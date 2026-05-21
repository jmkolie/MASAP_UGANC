from pydantic import BaseModel, EmailStr, field_validator
from typing import List
from app.core.password_validation import PasswordValidator


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password meets security requirements."""
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError("; ".join(errors))
        return v


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password meets security requirements."""
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError("; ".join(errors))
        return v


class UserRegisterRequest(BaseModel):
    """Schema for user registration with password validation."""
    email: EmailStr
    password: str
    full_name: str
    username: str | None = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str, info) -> str:
        """Validate password meets security requirements."""
        # Get other field values if available
        data = info.data
        email = data.get('email')
        username = data.get('username')
        
        is_valid, errors = PasswordValidator.validate(v, email=email, username=username)
        if not is_valid:
            raise ValueError("; ".join(errors))
        return v


class PasswordStrengthResponse(BaseModel):
    """Response schema for password strength assessment."""
    strength: str
    score: int
    suggestions: List[str]
    is_valid: bool
    errors: List[str]
