"""
/run-yolo endpoint
Accepts an image (upload or URL), runs the pre-trained YOLO model,
and returns tree count + species breakdown.
"""

import os
import io
import uuid
import tempfile
from typing import Optional

import numpy as np
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from PIL import Image

from models.yolo_model_loader import get_model

router = APIRouter()

CONF_THRESHOLD = float(os.getenv("YOLO_CONF_THRESHOLD", "0.35"))


# ──────────────────────────────────────────────
# Response schema
# ──────────────────────────────────────────────
class TreeDetection(BaseModel):
    label: str
    confidence: float
    bbox: list          # [x1, y1, x2, y2] normalised 0-1


class YOLOResult(BaseModel):
    success: bool
    image_id: str
    tree_count: int
    species_breakdown: dict         # {"species_name": count, ...}
    detections: list[TreeDetection]
    model_path: str
    message: str


# ──────────────────────────────────────────────
# Endpoint
# ──────────────────────────────────────────────
@router.post("/run-yolo", response_model=YOLOResult)
async def run_yolo(
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
):
    """
    Run YOLO tree detection on an uploaded image or a public image URL.

    - **image**: Binary image upload (multipart/form-data)
    - **image_url**: Alternatively, a public URL to an image
    """
    if image is None and image_url is None:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'image' (file upload) or 'image_url'.",
        )

    model = get_model()
    image_id = str(uuid.uuid4())

    # ── Load image ──────────────────────────────
    try:
        if image is not None:
            contents = await image.read()
            pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        else:
            import requests  # lightweight fetch
            resp = requests.get(image_url, timeout=10)
            resp.raise_for_status()
            pil_img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not load image: {exc}")

    img_array = np.array(pil_img)

    # ── Run inference ───────────────────────────
    try:
        results = model(img_array, conf=CONF_THRESHOLD, verbose=False)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO inference failed: {exc}")

    # ── Parse results ───────────────────────────
    detections = []
    species_count: dict = {}
    h, w = img_array.shape[:2]

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            label = (
                model.names[cls_id]
                if hasattr(model, "names") and cls_id in model.names
                else f"class_{cls_id}"
            )
            conf = round(float(box.conf[0].item()), 4)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            # Normalise to 0-1
            bbox_norm = [
                round(x1 / w, 4),
                round(y1 / h, 4),
                round(x2 / w, 4),
                round(y2 / h, 4),
            ]
            detections.append(TreeDetection(label=label, confidence=conf, bbox=bbox_norm))
            species_count[label] = species_count.get(label, 0) + 1

    tree_count = len(detections)

    return YOLOResult(
        success=True,
        image_id=image_id,
        tree_count=tree_count,
        species_breakdown=species_count,
        detections=detections,
        model_path=os.getenv("YOLO_MODEL_PATH", "models/best.pt"),
        message=f"Detected {tree_count} tree(s) across {len(species_count)} species.",
    )
