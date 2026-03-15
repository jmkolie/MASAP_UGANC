from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user, log_action
from app.schemas.auth import Token, RefreshTokenRequest, PasswordChangeRequest, PasswordResetRequest
from app.schemas.user import UserResponse
from app.core.security import get_password_hash

router = APIRouter()


@router.post("/login", response_model=Token)
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
        raise HTTPException(status_code=400, detail="Compte désactivé. Contactez l'administration.")

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
async def forgot_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request a password reset link (email)."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Always return success to avoid email enumeration
    return {"message": "Si l'email existe, un lien de réinitialisation vous a été envoyé."}
