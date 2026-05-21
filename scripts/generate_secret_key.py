# Secret Key Generator for MASAP-UGANC Portal
# Generate a secure random secret key for JWT tokens

import secrets
import string

def generate_secret_key(length: int = 32) -> str:
    """
    Generate a cryptographically secure random secret key.
    
    Args:
        length: Length of the secret key (minimum 32 recommended)
    
    Returns:
        A random secret key string
    """
    if length < 32:
        print(f"Warning: Recommended minimum length is 32, got {length}")
    
    # Use secrets module for cryptographically secure random generation
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_env_example():
    """Generate an example .env file with a new secret key."""
    secret_key = generate_secret_key(64)
    
    env_content = f"""# MASAP-UGANC Portal Environment Configuration
# Copy this file to .env and update values as needed

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@db:5432/masap_uganc

# Security - IMPORTANT: Change this in production!
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application Settings
DEBUG=False
APP_NAME=MASAP-UGANC Portal
APP_VERSION=1.0.0

# CORS Settings
ALLOWED_ORIGINS=["http://localhost:3000", "https://your-domain.com"]
FRONTEND_URL=http://localhost:3000

# File Upload Settings
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=MASAP-UGANC <noreply@masap-uganc.com>

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
"""
    
    return env_content, secret_key


if __name__ == "__main__":
    print("=" * 60)
    print("MASAP-UGANC Portal - Secret Key Generator")
    print("=" * 60)
    print()
    
    # Generate and display secret key
    secret_key = generate_secret_key(64)
    print("✓ Generated secure secret key (64 characters):")
    print(f"  {secret_key}")
    print()
    
    # Generate .env.example content
    env_content, _ = generate_env_example()
    
    # Save to file
    output_file = "backend/.env.example"
    with open(output_file, "w") as f:
        f.write(env_content)
    
    print(f"✓ Created {output_file} with configuration template")
    print()
    print("Next steps:")
    print("1. Copy backend/.env.example to backend/.env")
    print("2. Update DATABASE_URL for your environment")
    print("3. Configure SMTP settings for email notifications")
    print("4. Update ALLOWED_ORIGINS with your production domain")
    print("5. NEVER commit .env files to version control!")
    print()
    print("=" * 60)
