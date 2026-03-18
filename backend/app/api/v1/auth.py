from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, create_reset_token
from app.core.deps import get_current_user, log_action
from app.config import settings
import logging

logger = logging.getLogger(__name__)

from app.schemas.auth import (
    Token,
    RefreshTokenRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.schemas.user import UserResponse, StudentRegisterRequest
from app.core.security import get_password_hash

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register_student(
    request: Request,
    payload: StudentRegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Public endpoint — allows a student to create their own account."""
    from app.models.user import StudentProfile
    from app.utils.helpers import generate_student_id
    from app.services.email_service import send_registration_email

    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone,
        role=RoleEnum.student,
        is_active=False,
        is_verified=False,
    )
    db.add(user)
    db.flush()

    student_id = generate_student_id(db)
    db.add(StudentProfile(user_id=user.id, student_id=student_id))
    db.commit()
    db.refresh(user)

    background_tasks.add_task(
        send_registration_email,
        to=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        student_id=student_id,
        password=payload.password,
        pending_validation=True,
    )

    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login endpoint — returns JWT access and refresh tokens."""
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        detail = (
            "Votre compte est en attente de validation par l'administration."
            if not user.is_verified
            else "Compte désactivé. Contactez l'administration."
        )
        raise HTTPException(status_code=400, detail=detail)

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create tokens
    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Audit log
    ip = request.client.host if request.client else None
    log_action(db, user.id, "LOGIN", "User", user.id, f"Login from {ip}", ip)

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh the access token using a valid refresh token."""
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de rafraîchissement invalide ou expiré")

    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé ou inactif")

    new_token_data = {"sub": str(user.id), "role": user.role}
    return Token(
        access_token=create_access_token(new_token_data),
        refresh_token=create_refresh_token(new_token_data),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's info."""
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Logout — client should delete the tokens."""
    log_action(db, current_user.id, "LOGOUT", "User", current_user.id)
    return {"message": "Déconnexion réussie"}


@router.post("/change-password")
async def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères")

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    log_action(db, current_user.id, "CHANGE_PASSWORD", "User", current_user.id)
    return {"message": "Mot de passe modifié avec succès"}


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Request a password reset link (email)."""
    from app.services.email_service import send_password_reset_email

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user and user.is_active:
        token = create_reset_token(user.email)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        background_tasks.add_task(
            send_password_reset_email,
            to=user.email,
            first_name=user.first_name,
            reset_link=reset_link,
        )
        if settings.DEBUG:
            logger.info("🔑 [DEBUG] Reset link for %s: %s", user.email, reset_link)
    # Always return success to avoid email enumeration
    return {"message": "Si l'email existe, un lien de réinitialisation vous a été envoyé."}


@router.post("/reset-password")
async def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    token_data = decode_token(payload.token)
    if not token_data or token_data.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Lien de réinitialisation invalide ou expiré")

    email = token_data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Lien de réinitialisation invalide ou expiré")

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins 8 caractères",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()

    log_action(db, user.id, "RESET_PASSWORD", "User", user.id)
    return {"message": "Mot de passe réinitialisé avec succès"}
