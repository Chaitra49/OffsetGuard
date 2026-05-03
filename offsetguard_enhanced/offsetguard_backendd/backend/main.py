"""
OffsetGuard FastAPI Backend
Integrates YOLO tree detection, Google Earth Engine, and Polygon blockchain NFT minting.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.plantation import router as plantation_router
from api.yolo import router as yolo_router
from api.blockchain import router as blockchain_router

app = FastAPI(
    title="OffsetGuard API",
    description="Carbon credit verification backend with YOLO detection and NFT minting",
    version="1.0.0",
)

# CORS — allow the frontend (React/Leaflet) running on any local port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to your frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registration
app.include_router(plantation_router, prefix="", tags=["Plantation"])
app.include_router(yolo_router,       prefix="", tags=["YOLO Detection"])
app.include_router(blockchain_router, prefix="", tags=["Blockchain / NFT"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "OffsetGuard API"}
