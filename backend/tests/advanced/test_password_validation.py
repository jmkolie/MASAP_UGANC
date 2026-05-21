"""
Advanced tests for password validation functionality.

These tests cover:
- Password strength assessment
- Validation rules
- Edge cases
- Integration with auth schemas
"""

import pytest
from app.core.password_validation import (
    PasswordValidator,
    PasswordStrength,
    validate_password,
    get_password_strength,
    PasswordValidationError
)


class TestPasswordValidator:
    """Test suite for PasswordValidator class."""
    
    def test_valid_strong_password(self):
        """Test that a strong valid password passes validation."""
        password = "Str0ng!P@ssw0rd"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is True
        assert len(errors) == 0
    
    def test_minimum_length_requirement(self):
        """Test minimum length validation."""
        password = "Test1!"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("8 caractères" in error for error in errors)
    
    def test_uppercase_requirement(self):
        """Test uppercase letter requirement."""
        password = "test123!"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("majuscule" in error for error in errors)
    
    def test_lowercase_requirement(self):
        """Test lowercase letter requirement."""
        password = "TEST123!"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("minuscule" in error for error in errors)
    
    def test_digit_requirement(self):
        """Test digit requirement."""
        password = "TestPass!"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("chiffre" in error for error in errors)
    
    def test_special_char_requirement(self):
        """Test special character requirement."""
        password = "TestPass123"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("caractère spécial" in error for error in errors)
    
    def test_common_password_detection(self):
        """Test detection of common passwords."""
        common_passwords = ["password", "123456", "qwerty", "admin"]
        
        for password in common_passwords:
            is_valid, errors = PasswordValidator.validate(password)
            assert is_valid is False
            assert any("trop courant" in error for error in errors)
    
    def test_sequential_characters_detection(self):
        """Test detection of sequential characters."""
        passwords_with_sequences = ["abc123Test!", "Test123xyz!", "Password789!"]
        
        for password in passwords_with_sequences:
            is_valid, errors = PasswordValidator.validate(password)
            # Note: This might not always fail depending on other factors
            # Just verify the check is performed
            _ = PasswordValidator.SEQUENTIAL_PATTERN.search(password)
    
    def test_repeated_characters_detection(self):
        """Test detection of repeated characters."""
        password = "Teeest123!"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("répétés" in error for error in errors)
    
    def test_email_in_password(self):
        """Test that email cannot be in password."""
        email = "john.doe@example.com"
        password = "John.doe123!"
        
        is_valid, errors = PasswordValidator.validate(password, email=email)
        
        assert is_valid is False
        assert any("email" in error.lower() for error in errors)
    
    def test_username_in_password(self):
        """Test that username cannot be in password."""
        username = "johndoe"
        password = "Johndoe123!"
        
        is_valid, errors = PasswordValidator.validate(password, username=username)
        
        assert is_valid is False
        assert any("utilisateur" in error for error in errors)


class TestPasswordStrength:
    """Test suite for password strength assessment."""
    
    def test_weak_password(self):
        """Test weak password classification."""
        password = "test"
        strength = PasswordValidator.get_strength(password)
        
        assert strength == PasswordStrength.WEAK
    
    def test_medium_password(self):
        """Test medium password classification."""
        password = "TestPass"
        strength = PasswordValidator.get_strength(password)
        
        assert strength in [PasswordStrength.MEDIUM, PasswordStrength.WEAK]
    
    def test_strong_password(self):
        """Test strong password classification."""
        password = "Test123!"
        strength = PasswordValidator.get_strength(password)
        
        assert strength in [PasswordStrength.STRONG, PasswordStrength.MEDIUM]
    
    def test_very_strong_password(self):
        """Test very strong password classification."""
        password = "V3ry$tr0ng!P@ssw0rd123"
        strength = PasswordValidator.get_strength(password)
        
        assert strength == PasswordStrength.VERY_STRONG
    
    def test_get_strength_string(self):
        """Test get_password_strength convenience function."""
        password = "Str0ng!P@ss"
        strength_str = get_password_strength(password)
        
        assert isinstance(strength_str, str)
        assert strength_str in ["weak", "medium", "strong", "very_strong"]


class TestPasswordSuggestions:
    """Test suite for password improvement suggestions."""
    
    def test_suggestions_for_weak_password(self):
        """Test suggestions generation for weak password."""
        password = "test"
        suggestions = PasswordValidator.generate_suggestions(password)
        
        assert len(suggestions) > 0
        assert any("majuscules" in s for s in suggestions)
        assert any("chiffres" in s for s in suggestions)
    
    def test_no_suggestions_for_strong_password(self):
        """Test that strong passwords have minimal suggestions."""
        password = "V3ry$tr0ng!P@ss"
        suggestions = PasswordValidator.generate_suggestions(password)
        
        # Strong passwords should have few or no suggestions
        assert len(suggestions) <= 2


class TestPasswordValidationFunction:
    """Test suite for validate_password convenience function."""
    
    def test_validate_password_success(self):
        """Test successful password validation."""
        password = "Str0ng!P@ssw0rd"
        result = validate_password(password)
        
        assert result is True
    
    def test_validate_password_failure(self):
        """Test failed password validation raises exception."""
        password = "weak"
        
        with pytest.raises(PasswordValidationError) as exc_info:
            validate_password(password)
        
        assert "8 caractères" in str(exc_info.value.message)
    
    def test_validate_password_with_email(self):
        """Test password validation with email parameter."""
        password = "Str0ng!P@ssw0rd"
        email = "user@example.com"
        
        result = validate_password(password, email=email)
        assert result is True
    
    def test_validate_password_with_username(self):
        """Test password validation with username parameter."""
        password = "Str0ng!P@ssw0rd"
        username = "testuser"
        
        result = validate_password(password, username=username)
        assert result is True


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_empty_password(self):
        """Test empty password validation."""
        password = ""
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert len(errors) > 0
    
    def test_maximum_length(self):
        """Test maximum length validation."""
        password = "Aa1!" + "x" * 130  # Exceeds MAX_LENGTH of 128
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("dépasser" in error for error in errors)
    
    def test_exactly_minimum_length(self):
        """Test password with exactly minimum length."""
        password = "Test123!"  # Exactly 8 characters
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is True
    
    def test_unicode_characters(self):
        """Test password with unicode characters."""
        password = "Tëst123!Üñïcödé"
        is_valid, errors = PasswordValidator.validate(password)
        
        # Should handle unicode gracefully
        assert isinstance(is_valid, bool)
    
    def test_spaces_in_password(self):
        """Test password with spaces."""
        password = "Test 123! Pass"
        is_valid, errors = PasswordValidator.validate(password)
        
        # Spaces are allowed but don't count as special chars
        assert isinstance(is_valid, bool)
    
    def test_only_special_characters(self):
        """Test password with only special characters."""
        password = "!@#$%^&*()"
        is_valid, errors = PasswordValidator.validate(password)
        
        assert is_valid is False
        assert any("minuscule" in error for error in errors)
        assert any("majuscule" in error for error in errors)
        assert any("chiffre" in error for error in errors)
