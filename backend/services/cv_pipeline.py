import logging

import cv2
import numpy
import rasterio

logger = logging.getLogger(__name__)


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
