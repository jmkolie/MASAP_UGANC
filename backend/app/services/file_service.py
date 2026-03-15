"""File upload and management service."""
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/zip",
}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


async def save_upload_file(
    file: UploadFile,
    sub_dir: str = "documents",
    allowed_types: Optional[set] = None,
    max_size: int = None,
) -> dict:
    """Save an uploaded file and return file info."""
    if allowed_types is None:
        allowed_types = ALLOWED_DOCUMENT_TYPES

    if max_size is None:
        max_size = settings.MAX_UPLOAD_SIZE

    # Validate content type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed types: {', '.join(allowed_types)}",
        )

    # Read file content
    content = await file.read()

    # Validate size
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB",
        )

    # Generate unique filename
    ext = Path(file.filename).suffix if file.filename else ""
    unique_name = f"{uuid.uuid4()}{ext}"

    # Create directory
    upload_dir = Path(settings.UPLOAD_DIR) / sub_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save file
    file_path = upload_dir / unique_name
    with open(file_path, "wb") as f:
        f.write(content)

    # Return relative path for storage
    relative_path = f"{sub_dir}/{unique_name}"

    return {
        "file_path": relative_path,
        "file_name": file.filename,
        "file_size": len(content),
        "file_type": file.content_type,
    }


def delete_file(file_path: str) -> bool:
    """Delete a file from storage."""
    full_path = Path(settings.UPLOAD_DIR) / file_path
    if full_path.exists():
        full_path.unlink()
        return True
    return False


def get_file_path(relative_path: str) -> Path:
    """Get the full path for a file."""
    return Path(settings.UPLOAD_DIR) / relative_path
