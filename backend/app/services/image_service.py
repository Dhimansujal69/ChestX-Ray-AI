import io
import numpy as np
from PIL import Image
from fastapi import HTTPException, UploadFile
from app.config import IMAGE_SIZE

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

def validate_and_preprocess_image(file: UploadFile, image_bytes: bytes) -> np.ndarray:
    # 1. Check file extension
    filename = file.filename or ""
    extension = filename.split(".")[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{extension}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Verify image integrity
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupted or invalid image file.")

    # 3. Reload after verify(), convert to RGB, and resize to 224x224
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMAGE_SIZE)

    # 4. Convert to NumPy float array & create 4D batch tensor (1, 224, 224, 3)
    img_array = np.array(img, dtype=np.float32)
    img_batch = np.expand_dims(img_array, axis=0)
    
    return img_batch