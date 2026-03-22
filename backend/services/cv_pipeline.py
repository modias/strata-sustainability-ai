import base64
import logging
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy
import rasterio
from rasterio.warp import transform_bounds

logger = logging.getLogger(__name__)

CV_PROFILES = {}


def load_satellite_bands(geotiff_path: str):
    try:
        with rasterio.open(geotiff_path) as src:
            red_band = src.read(4).astype(numpy.float32)
            nir_band = src.read(8).astype(numpy.float32)
            return red_band, nir_band, src.transform
    except Exception as e:
        logger.error("Failed to load satellite bands from %s: %s", geotiff_path, e, exc_info=True)
        return None, None, None


def calculate_ndvi(red_band, nir_band):
    ndvi = (nir_band - red_band) / (nir_band + red_band + 1e-10)
    return numpy.clip(ndvi, -1.0, 1.0)


def calculate_green_ratio(ndvi_array):
    mask = ndvi_array > 0.2
    vegetation = mask.sum()
    total = mask.size
    if total == 0:
        green_coverage_pct = 0.0
    else:
        green_coverage_pct = round((vegetation / total) * 100, 2)
    return {
        "green_coverage_pct": green_coverage_pct,
        "impervious_surface_pct": round(100 - green_coverage_pct, 2),
        "ndvi_mean": round(float(ndvi_array.mean()), 2),
    }


def calculate_fragmentation(mask):
    vegetation_pixels = int(mask.sum())
    if vegetation_pixels == 0:
        return 0

    u8 = mask.astype(numpy.uint8) * 255
    num_labels, _, _, _ = cv2.connectedComponentsWithStats(u8)
    blob_count = num_labels - 1

    ratio = blob_count / max(vegetation_pixels, 1)
    fragmentation_score = min(int(ratio * 1000), 100)
    return fragmentation_score


def calculate_heat_intensity(file_path: str):
    try:
        with rasterio.open(file_path) as src:
            if src.count >= 10:
                thermal_band = src.read(10).astype(float)
            else:
                thermal_band = src.read(1).astype(float)

        if thermal_band.ndim == 3:
            thermal_band = numpy.squeeze(thermal_band)

        h, w = thermal_band.shape
        r0, r1 = int(h * 0.25), int(h * 0.75)
        c0, c1 = int(w * 0.25), int(w * 0.75)
        center_region = thermal_band[r0:r1, c0:c1]

        inside_temp = float(center_region.mean())
        baseline_temp = float(thermal_band.mean())
        delta = inside_temp - baseline_temp
        heat_intensity_score = min(max(int((delta / 30) * 100 + 50), 0), 100)

        return {
            "heat_intensity_score": heat_intensity_score,
            "thermal_array": thermal_band,
        }
    except Exception as e:
        logger.error("Failed to calculate heat intensity from %s: %s", file_path, e, exc_info=True)
        return {"heat_intensity_score": 50, "thermal_array": None}


def generate_heatmap_image(thermal_array):
    if thermal_array is None:
        return None

    arr = numpy.squeeze(thermal_array)

    normalized = numpy.zeros_like(arr, dtype=numpy.float32)
    cv2.normalize(arr, normalized, 0, 255, cv2.NORM_MINMAX)
    u8 = numpy.clip(normalized, 0, 255).astype(numpy.uint8)
    colormap = cv2.applyColorMap(u8, cv2.COLORMAP_JET)

    ok, buf = cv2.imencode(".png", colormap)
    if not ok:
        return None
    return base64.b64encode(buf).decode("utf-8")


def bounds_polygon_wgs84(geotiff_path: str) -> Optional[dict[str, Any]]:
    """Rectangle footprint of the raster in WGS84 lon/lat for map boundary outline."""
    try:
        with rasterio.open(geotiff_path) as src:
            left, bottom, right, top = src.bounds
            crs = src.crs
            if crs is not None:
                left, bottom, right, top = transform_bounds(crs, "EPSG:4326", left, bottom, right, top)
            ring = [
                [left, bottom],
                [right, bottom],
                [right, top],
                [left, top],
                [left, bottom],
            ]
            return {"type": "Polygon", "coordinates": [ring]}
    except Exception as e:
        logger.error("bounds_polygon_wgs84 failed for %s: %s", geotiff_path, e, exc_info=True)
        return None


def generate_green_overlay(ndvi_array, transform):
    empty = {"type": "FeatureCollection", "features": []}
    try:
        arr = numpy.squeeze(ndvi_array)
        features = []
        for row in range(0, arr.shape[0], 10):
            for col in range(0, arr.shape[1], 10):
                lng, lat = rasterio.transform.xy(transform, row, col)
                is_vegetation = bool(arr[row, col] > 0.2)
                coordinates = [
                    [lng, lat],
                    [lng + 0.0001, lat],
                    [lng + 0.0001, lat + 0.0001],
                    [lng, lat + 0.0001],
                    [lng, lat],
                ]
                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "color": "#4ade80" if is_vegetation else "#4b5563",
                            "vegetation": is_vegetation,
                        },
                        "geometry": {"type": "Polygon", "coordinates": [coordinates]},
                    }
                )
        return {"type": "FeatureCollection", "features": features}
    except Exception as e:
        logger.error("generate_green_overlay failed: %s", e, exc_info=True)
        return empty


def _default_cv_profile(entity_id: str) -> dict:
    return {
        "entity_id": entity_id,
        "green_coverage_pct": 0.0,
        "impervious_surface_pct": 0.0,
        "ndvi_mean": 0.0,
        "fragmentation_score": 0,
        "heat_intensity_score": 0,
        "heatmap_image_b64": None,
        "boundary_geojson": None,
        "green_overlay_geojson": {"type": "FeatureCollection", "features": []},
    }


def build_cv_profile(entity_id: str, file_path: str) -> dict:
    red_band, nir_band, transform = load_satellite_bands(file_path)
    if red_band is None:
        return _default_cv_profile(entity_id)

    ndvi_array = calculate_ndvi(red_band, nir_band)
    green_metrics = calculate_green_ratio(ndvi_array)
    vegetation_mask = ndvi_array > 0.2
    fragmentation_score = calculate_fragmentation(vegetation_mask)
    heat_dict = calculate_heat_intensity(file_path)
    heatmap_b64 = generate_heatmap_image(heat_dict["thermal_array"])
    geojson = generate_green_overlay(ndvi_array, transform)
    boundary_geojson = bounds_polygon_wgs84(file_path)

    return {
        "entity_id": entity_id,
        "green_coverage_pct": green_metrics["green_coverage_pct"],
        "impervious_surface_pct": green_metrics["impervious_surface_pct"],
        "ndvi_mean": green_metrics["ndvi_mean"],
        "fragmentation_score": fragmentation_score,
        "heat_intensity_score": heat_dict["heat_intensity_score"],
        "heatmap_image_b64": heatmap_b64,
        "boundary_geojson": boundary_geojson,
        "green_overlay_geojson": geojson,
    }


def preload_all_profiles() -> None:
    try:
        cache_dir = Path(__file__).resolve().parent / "satellite_cache"
        mapping = {
            "tesla": "tesla.tif",
            "amazon": "amazon.tif",
            "microsoft": "microsoft.tif",
            "anacostia": "anacostia.tif",
            "phoenix_south": "phoenix_south.tif",
            "detroit_midtown": "detroit_midtown.tif",
        }
        for entity_id, filename in mapping.items():
            tif_path = cache_dir / filename
            try:
                if not tif_path.is_file():
                    logger.warning("CV preload: missing file for %s → %s", entity_id, tif_path)
                    continue
                CV_PROFILES[entity_id] = build_cv_profile(entity_id, str(tif_path))
                logger.info("CV preload: loaded profile for %s from %s", entity_id, tif_path)
            except Exception as e:
                logger.error("CV preload: failed for %s: %s", entity_id, e, exc_info=True)
    except Exception as e:
        logger.error("preload_all_profiles failed: %s", e, exc_info=True)


try:
    preload_all_profiles()
except Exception:
    logger.exception("CV preload at module import did not complete; continuing without cached profiles")
