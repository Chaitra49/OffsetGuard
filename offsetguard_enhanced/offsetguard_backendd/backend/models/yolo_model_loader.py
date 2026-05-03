"""
YOLO model loader — singleton pattern.
Model path is read from the YOLO_MODEL_PATH environment variable.
Falls back to models/best.pt (relative to the backend root).
"""

import os
from pathlib import Path

_model_instance = None

DEFAULT_MODEL_PATH = str(Path(__file__).parent.parent / "models" / "best.pt")


def get_model():
    """
    Return the cached YOLO model, loading it on first call.
    Set YOLO_MODEL_PATH env var to override the default path.
    """
    global _model_instance
    if _model_instance is not None:
        return _model_instance

    model_path = os.getenv("YOLO_MODEL_PATH", DEFAULT_MODEL_PATH)

    if not Path(model_path).exists():
        raise FileNotFoundError(
            f"YOLO model not found at: {model_path}\n"
            f"Set the YOLO_MODEL_PATH environment variable to the correct path, "
            f"or place best.pt in backend/models/."
        )

    try:
        from ultralytics import YOLO
        print(f"[YOLO] Loading model from: {model_path}")
        _model_instance = YOLO(model_path)
        print("[YOLO] Model loaded successfully.")
    except ImportError:
        raise ImportError(
            "ultralytics is not installed. Run: pip install ultralytics"
        )

    return _model_instance


def reload_model(path: str | None = None):
    """Force reload the model (useful for hot-swapping weights)."""
    global _model_instance
    _model_instance = None
    if path:
        os.environ["YOLO_MODEL_PATH"] = path
    return get_model()
