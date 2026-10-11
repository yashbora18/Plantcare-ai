import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from backend.app.config import settings

UPLOAD_DIR_PATH = Path(settings.UPLOAD_DIR).resolve()
UPLOAD_DIR_PATH.mkdir(parents=True, exist_ok=True)

def save_upload_file(file: UploadFile, subfolder: str = "") -> str:
    """
    Saves an uploaded file safely, preventing path traversal and validating extensions.
    Returns the relative path e.g. '/uploads/filename.jpg' or '/uploads/subfolder/filename.jpg'.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename."
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
        )

    # Generate safe random filename
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    
    target_dir = UPLOAD_DIR_PATH
    if subfolder:
        # Sanitize subfolder
        clean_subfolder = Path(subfolder).name
        target_dir = UPLOAD_DIR_PATH / clean_subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

    dest_path = target_dir / safe_filename

    # Read and check size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Save to disk
    with open(dest_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            buffer.write(chunk)

    rel_sub = f"{clean_subfolder}/" if subfolder else ""
    return f"/uploads/{rel_sub}{safe_filename}"
