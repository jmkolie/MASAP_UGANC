from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_token
from app.models.user import User, RoleEnum, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_roles(*roles: RoleEnum):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return checker


def get_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def get_dept_head_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.dept_head]:
        raise HTTPException(status_code=403, detail="Department head or admin access required")
    return current_user


def get_teacher_or_above(current_user: User = Depends(get_current_user)) -> User:
    allowed = [RoleEnum.super_admin, RoleEnum.dept_head, RoleEnum.teacher]
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Teacher or higher access required")
    return current_user


def log_action(db: Session, user_id: int, action: str, entity_type: str = None,
               entity_id: int = None, details: str = None, ip_address: str = None):
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
