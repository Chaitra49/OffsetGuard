"""
/verify-plantation endpoint
Accepts company submission: name, CO₂ offset claim, GPS point, polygon boundary,
and optional media files. Runs basic GEE NDVI validation and returns a
structured JSON result compatible with the OffsetGuard React/Leaflet frontend.
"""

import os
import json
import traceback
from typing import Optional, List

from fastapi import APIRouter, Form, File, UploadFile, HTTPException
from pydantic import BaseModel

router = APIRouter()


# ──────────────────────────────────────────────
# Response schema (matches frontend expectations)
# ──────────────────────────────────────────────
class PlantationVerificationResult(BaseModel):
    success: bool
    company_name: str
    co2_offset_tons: float
    gps_coordinates: dict           # {lat, lng}
    polygon_area_ha: Optional[float]
    ndvi_mean: Optional[float]
    ndvi_valid: Optional[bool]
    media_files_received: int
    verification_status: str        # "verified" | "pending" | "rejected"
    message: str
    timestamp: str


# ──────────────────────────────────────────────
# Helper: compute polygon area (Shoelace formula, approx degrees→ha)
# ──────────────────────────────────────────────
def _polygon_area_ha(coords: list) -> float:
    """
    Rough area in hectares from a list of [lng, lat] or {lat,lng} GeoJSON coords.
    Uses the spherical excess approximation — good enough for plantation scale.
    """
    import math
    if not coords or len(coords) < 3:
        return 0.0
    # Accept both [[lng,lat],...] and [{"lat":...,"lng":...},...]
    pts = []
    for c in coords:
        if isinstance(c, (list, tuple)):
            pts.append((float(c[1]), float(c[0])))   # (lat, lng)
        elif isinstance(c, dict):
            pts.append((float(c.get("lat", 0)), float(c.get("lng", 0))))
    n = len(pts)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += pts[i][1] * pts[j][0]
        area -= pts[j][1] * pts[i][0]
    area_deg2 = abs(area) / 2.0
    # 1 degree² ≈ 12,308 km² at equator; 1 km² = 100 ha
    area_ha = area_deg2 * 12_308 * 100
    return round(area_ha, 4)


# ──────────────────────────────────────────────
# Helper: GEE NDVI check (graceful fallback if EE unavailable)
# ──────────────────────────────────────────────
def _run_gee_ndvi(lat: float, lng: float, polygon_coords: list) -> dict:
    """
    Attempts to pull NDVI from Google Earth Engine for the given AOI.
    Returns {"ndvi_mean": float, "valid": bool} or fallback values.
    """
    try:
        import ee  # earthengine-api

        ee.Initialize()

        if polygon_coords and len(polygon_coords) >= 3:
            # Build GeoJSON geometry from the submitted polygon
            ring = []
            for c in polygon_coords:
                if isinstance(c, (list, tuple)):
                    ring.append([float(c[0]), float(c[1])])
                elif isinstance(c, dict):
                    ring.append([float(c.get("lng", 0)), float(c.get("lat", 0))])
            geometry = ee.Geometry.Polygon([ring])
        else:
            geometry = ee.Geometry.Point([lng, lat]).buffer(500)

        image = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(geometry)
            .filterDate("2023-01-01", "2024-12-31")
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .sort("CLOUDY_PIXEL_PERCENTAGE")
            .first()
        )

        ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
        stats = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=geometry, scale=10, maxPixels=1e9
        )
        ndvi_mean = stats.getInfo().get("NDVI", None)

        if ndvi_mean is None:
            return {"ndvi_mean": None, "valid": False}

        ndvi_mean = round(float(ndvi_mean), 4)
        return {"ndvi_mean": ndvi_mean, "valid": ndvi_mean > 0.3}

    except Exception as exc:
        # GEE not configured or network unavailable — return graceful fallback
        print(f"[GEE] Skipped: {exc}")
        return {"ndvi_mean": None, "valid": None}


# ──────────────────────────────────────────────
# Endpoint
# ──────────────────────────────────────────────
@router.post("/verify-plantation", response_model=PlantationVerificationResult)
async def verify_plantation(
    company_name: str = Form(...),
    co2_offset_tons: float = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    polygon_boundary: Optional[str] = Form(None),   # JSON string of coord array
    media_files: Optional[List[UploadFile]] = File(None),
):
    """
    Verify a plantation submission.

    - **company_name**: Registering company
    - **co2_offset_tons**: Claimed CO₂ offset in metric tons
    - **latitude / longitude**: Representative GPS point
    - **polygon_boundary**: JSON-encoded array of [lng,lat] coordinates
    - **media_files**: Optional photos / drone footage
    """
    from datetime import datetime, timezone

    # Parse polygon
    polygon_coords = []
    polygon_area_ha = None
    if polygon_boundary:
        try:
            polygon_coords = json.loads(polygon_boundary)
            polygon_area_ha = _polygon_area_ha(polygon_coords)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid polygon_boundary JSON")

    # Count uploaded files (save to temp if needed)
    media_count = 0
    if media_files:
        for f in media_files:
            if f and f.filename:
                media_count += 1

    # GEE NDVI
    gee_result = _run_gee_ndvi(latitude, longitude, polygon_coords)

    # Determine verification status
    if gee_result["valid"] is True:
        status = "verified"
        msg = "Plantation verified via NDVI satellite analysis."
    elif gee_result["valid"] is False:
        status = "rejected"
        msg = "Low vegetation index detected — plantation claim may be inaccurate."
    else:
        status = "pending"
        msg = "Satellite verification pending (GEE unavailable). Manual review required."

    return PlantationVerificationResult(
        success=True,
        company_name=company_name,
        co2_offset_tons=co2_offset_tons,
        gps_coordinates={"lat": latitude, "lng": longitude},
        polygon_area_ha=polygon_area_ha,
        ndvi_mean=gee_result["ndvi_mean"],
        ndvi_valid=gee_result["valid"],
        media_files_received=media_count,
        verification_status=status,
        message=msg,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
