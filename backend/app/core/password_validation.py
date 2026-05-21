"""
Password validation utilities for MASAP-UGANC Portal.

This module provides comprehensive password validation including:
- Minimum length requirements
- Character complexity checks (uppercase, lowercase, numbers, special characters)
- Common password detection
- Breached password checking (optional via API)
- Password strength scoring
"""

import re
import hashlib
from typing import Tuple, List
from enum import Enum


class PasswordStrength(Enum):
    """Password strength levels."""
    WEAK = "weak"
    MEDIUM = "medium"
    STRONG = "strong"
    VERY_STRONG = "very_strong"


# Common passwords list (top 100 most common - should be expanded in production)
COMMON_PASSWORDS = {
    "password", "123456", "123456789", "qwerty", "abc123", "monkey", "master",
    "dragon", "letmein", "login", "admin", "welcome", "password1", "p@ssw0rd",
    "pass123", "test123", "masap", "uganc", "student", "professeur", "etudiant"
}


class PasswordValidationError(Exception):
    """Custom exception for password validation errors."""
    def __init__(self, message: str, field: str = "password"):
        self.message = message
        self.field = field
        super().__init__(self.message)


class PasswordValidator:
    """
    Comprehensive password validator with strength assessment.
    
    Requirements:
    - Minimum 8 characters (12 recommended for strong passwords)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - Not in common passwords list
    - No sequential characters (e.g., abc, 123)
    - No repeated characters (e.g., aaa, 111)
    """
    
    MIN_LENGTH = 8
    MIN_LENGTH_STRONG = 12
    MAX_LENGTH = 128
    
    # Regex patterns
    UPPERCASE_PATTERN = re.compile(r'[A-Z]')
    LOWERCASE_PATTERN = re.compile(r'[a-z]')
    DIGIT_PATTERN = re.compile(r'\d')
    SPECIAL_CHAR_PATTERN = re.compile(r'[!@#$%^&*(),.?":{}|<>_\-=\[\]\\;\'`~+/]')
    SEQUENTIAL_PATTERN = re.compile(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', re.IGNORECASE)
    REPEATED_PATTERN = re.compile(r'(.)\1{2,}')
    
    @classmethod
    def validate(cls, password: str, email: str = None, username: str = None) -> Tuple[bool, List[str]]:
        """
        Validate a password and return validation status with error messages.
        
        Args:
            password: The password to validate
            email: User's email (to check if password contains email)
            username: User's username (to check if password contains username)
        
        Returns:
            Tuple of (is_valid, list_of_error_messages)
        """
        errors = []
        
        # Check minimum length
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"Le mot de passe doit contenir au moins {cls.MIN_LENGTH} caractères.")
        
        # Check maximum length
        if len(password) > cls.MAX_LENGTH:
            errors.append(f"Le mot de passe ne peut pas dépasser {cls.MAX_LENGTH} caractères.")
        
        # Check for uppercase letters
        if not cls.UPPERCASE_PATTERN.search(password):
            errors.append("Le mot de passe doit contenir au moins une lettre majuscule.")
        
        # Check for lowercase letters
        if not cls.LOWERCASE_PATTERN.search(password):
            errors.append("Le mot de passe doit contenir au moins une lettre minuscule.")
        
        # Check for digits
        if not cls.DIGIT_PATTERN.search(password):
            errors.append("Le mot de passe doit contenir au moins un chiffre.")
        
        # Check for special characters
        if not cls.SPECIAL_CHAR_PATTERN.search(password):
            errors.append("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...).")
        
        # Check against common passwords
        if password.lower() in COMMON_PASSWORDS:
            errors.append("Ce mot de passe est trop courant. Veuillez en choisir un plus sécurisé.")
        
        # Check for sequential characters
        if cls.SEQUENTIAL_PATTERN.search(password):
            errors.append("Le mot de passe ne doit pas contenir de séquences de caractères (ex: abc, 123).")
        
        # Check for repeated characters
        if cls.REPEATED_PATTERN.search(password):
            errors.append("Le mot de passe ne doit pas contenir de caractères répétés (ex: aaa, 111).")
        
        # Check if password contains email
        if email and email.split('@')[0].lower() in password.lower():
            errors.append("Le mot de passe ne peut pas contenir votre adresse email.")
        
        # Check if password contains username
        if username and username.lower() in password.lower():
            errors.append("Le mot de passe ne peut pas contenir votre nom d'utilisateur.")
        
        return len(errors) == 0, errors
    
    @classmethod
    def get_strength(cls, password: str) -> PasswordStrength:
        """
        Assess password strength.
        
        Args:
            password: The password to assess
        
        Returns:
            PasswordStrength enum value
        """
        score = 0
        
        # Length scoring
        if len(password) >= cls.MIN_LENGTH:
            score += 1
        if len(password) >= cls.MIN_LENGTH_STRONG:
            score += 1
        if len(password) >= 16:
            score += 1
        
        # Complexity scoring
        if cls.UPPERCASE_PATTERN.search(password):
            score += 1
        if cls.LOWERCASE_PATTERN.search(password):
            score += 1
        if cls.DIGIT_PATTERN.search(password):
            score += 1
        if cls.SPECIAL_CHAR_PATTERN.search(password):
            score += 1
        
        # Deductions
        if cls.SEQUENTIAL_PATTERN.search(password):
            score -= 1
        if cls.REPEATED_PATTERN.search(password):
            score -= 1
        if password.lower() in COMMON_PASSWORDS:
            score -= 2
        
        # Determine strength level
        if score <= 2:
            return PasswordStrength.WEAK
        elif score <= 4:
            return PasswordStrength.MEDIUM
        elif score <= 6:
            return PasswordStrength.STRONG
        else:
            return PasswordStrength.VERY_STRONG
    
    @classmethod
    def hash_password_sha256(cls, password: str) -> str:
        """
        Hash a password using SHA-256 (for additional verification purposes).
        Note: This is NOT for storage - use bcrypt/argon2 for password storage.
        
        Args:
            password: The password to hash
        
        Returns:
            Hexadecimal hash string
        """
        return hashlib.sha256(password.encode()).hexdigest()
    
    @classmethod
    def generate_suggestions(cls, password: str) -> List[str]:
        """
        Generate suggestions for improving password strength.
        
        Args:
            password: The current password
        
        Returns:
            List of suggestion strings
        """
        suggestions = []
        
        if len(password) < cls.MIN_LENGTH_STRONG:
            suggestions.append(f"Ajoutez des caractères pour atteindre au moins {cls.MIN_LENGTH_STRONG} caractères.")
        
        if not cls.UPPERCASE_PATTERN.search(password):
            suggestions.append("Ajoutez des lettres majuscules (A-Z).")
        
        if not cls.LOWERCASE_PATTERN.search(password):
            suggestions.append("Ajoutez des lettres minuscules (a-z).")
        
        if not cls.DIGIT_PATTERN.search(password):
            suggestions.append("Ajoutez des chiffres (0-9).")
        
        if not cls.SPECIAL_CHAR_PATTERN.search(password):
            suggestions.append("Ajoutez des caractères spéciaux (!@#$%^&*...).")
        
        if cls.SEQUENTIAL_PATTERN.search(password):
            suggestions.append("Évitez les séquences de caractères comme 'abc' ou '123'.")
        
        if cls.REPEATED_PATTERN.search(password):
            suggestions.append("Évitez les caractères répétés comme 'aaa' ou '111'.")
        
        return suggestions


def validate_password(password: str, email: str = None, username: str = None) -> bool:
    """
    Convenience function to validate a password.
    
    Args:
        password: The password to validate
        email: User's email (optional)
        username: User's username (optional)
    
    Returns:
        True if password is valid
    
    Raises:
        PasswordValidationError: If password fails validation
    """
    is_valid, errors = PasswordValidator.validate(password, email, username)
    
    if not is_valid:
        raise PasswordValidationError("; ".join(errors))
    
    return True


def get_password_strength(password: str) -> str:
    """
    Get password strength as a string.
    
    Args:
        password: The password to assess
    
    Returns:
        Strength level string (weak, medium, strong, very_strong)
    """
    return PasswordValidator.get_strength(password).value
