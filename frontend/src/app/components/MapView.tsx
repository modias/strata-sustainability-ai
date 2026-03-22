import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { circle as turfCircle, featureCollection, intersect, polygon as turfPolygon } from "@turf/turf";
import type { MultiPolygon, Polygon } from "geojson";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin } from "lucide-react";

export type MapLayerId = "vegetation" | "heat";

interface MapViewProps {
  location: { lat: number; lng: number };
  name: string;
  greenScore?: number;
  /** 0–100 heat intensity */
  heatScore?: number;
  mode?: string;
}

const markerIcon = L.divIcon({
  html: `<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>`,
  className: "custom-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const badgeStyle: CSSProperties = {
  position: "absolute",
  bottom: "12px",
  left: "12px",
  zIndex: 1000,
  background: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "8px 12px",
  backdropFilter: "blur(8px)",
};

const labelStyle: CSSProperties = {
  fontSize: "9px",
  color: "#6b7280",
  letterSpacing: "2px",
  marginBottom: "2px",
  fontFamily: "monospace",
  textTransform: "uppercase",
};

const valueStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  fontFamily: "monospace",
  lineHeight: 1,
};

/** Visible boundary and strict clip for vegetation/overlay (green must stay inside this circle). */
const ANALYSIS_RADIUS_M = 800;
/** Overpass search radius — wider so edge polygons are still fetched, then clipped to ANALYSIS_RADIUS_M. */
const OVERPASS_FETCH_RADIUS_M = 1100;

const OVERPASS_FETCH_MS = 6000;

/** Public Overpass mirrors; try each until one returns 200 (429/5xx/CORS → next). */
const OVERPASS_INTERPRETER_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
] as const;

async function postOverpassQuery(query: string): Promise<Response | null> {
  for (const url of OVERPASS_INTERPRETER_URLS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), OVERPASS_FETCH_MS);
    let response: Response | null = null;
    try {
      response = await fetch(url, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeoutId);
      continue;
    }
    clearTimeout(timeoutId);
    if (response?.ok) return response;
  }
  return null;
}

async function fetchVegetation(lat: number, lng: number, radius: number): Promise<unknown[]> {
  try {
    const r = radius;
    const query = `
    [out:json][timeout:25];
    (
      way["leisure"="park"](around:${r},${lat},${lng});
      way["leisure"="garden"](around:${r},${lat},${lng});
      way["leisure"="playground"](around:${r},${lat},${lng});
      way["leisure"="pitch"](around:${r},${lat},${lng});
      way["leisure"="golf_course"](around:${r},${lat},${lng});
      way["leisure"="dog_park"](around:${r},${lat},${lng});
      way["leisure"="nature_reserve"](around:${r},${lat},${lng});
      way["leisure"="track"](around:${r},${lat},${lng});
      way["landuse"="grass"](around:${r},${lat},${lng});
      way["landuse"="forest"](around:${r},${lat},${lng});
      way["landuse"="meadow"](around:${r},${lat},${lng});
      way["landuse"="recreation_ground"](around:${r},${lat},${lng});
      way["landuse"="village_green"](around:${r},${lat},${lng});
      way["landuse"="allotments"](around:${r},${lat},${lng});
      way["landuse"="orchard"](around:${r},${lat},${lng});
      way["landuse"="vineyard"](around:${r},${lat},${lng});
      way["landuse"="cemetery"](around:${r},${lat},${lng});
      way["landuse"="grassland"](around:${r},${lat},${lng});
      way["landuse"="plantation"](around:${r},${lat},${lng});
      way["natural"="wood"](around:${r},${lat},${lng});
      way["natural"="scrub"](around:${r},${lat},${lng});
      way["natural"="grassland"](around:${r},${lat},${lng});
      way["natural"="heath"](around:${r},${lat},${lng});
      way["natural"="wetland"](around:${r},${lat},${lng});
      way["natural"="tree_row"](around:${r},${lat},${lng});
      way["natural"="fell"](around:${r},${lat},${lng});
      way["amenity"="grave_yard"](around:${r},${lat},${lng});
      way["barrier"="hedge"](around:${r},${lat},${lng});
      way["leisure"="common"](around:${r},${lat},${lng});
      way["landuse"="greenfield"](around:${r},${lat},${lng});
      way["natural"="green"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["leisure"="park"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["leisure"="garden"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["leisure"="nature_reserve"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["landuse"="forest"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["landuse"="grass"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["landuse"="meadow"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["natural"="wood"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["natural"="scrub"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["leisure"="common"](around:${r},${lat},${lng});
      relation["type"="multipolygon"]["barrier"="hedge"](around:${r},${lat},${lng});
    );
    out geom;
  `;
    const response = await postOverpassQuery(query);
    if (!response) return [];
    const data = (await response.json()) as {
      elements?: unknown[];
      error?: string;
    };
    if (data.error) return [];
    return data.elements ?? [];
  } catch {
    return [];
  }
}

async function fetchTreeNodes(lat: number, lng: number, radius: number): Promise<unknown[]> {
  try {
    const query = `
    [out:json][timeout:15];
    (
      node["natural"="tree"](around:${radius},${lat},${lng});
    );
    out;
  `;
    const response = await postOverpassQuery(query);
    if (!response) return [];
    const data = (await response.json()) as {
      elements?: unknown[];
      error?: string;
    };
    if (data.error) return [];
    return data.elements ?? [];
  } catch {
    return [];
  }
}

/** Building footprints and roads for masking satellite vegetation off roofs and pavement. */
async function fetchOsmExclusionGeometries(lat: number, lng: number, radius: number): Promise<unknown[]> {
  try {
    const query = `
    [out:json][timeout:35];
    (
      way["building"](around:${radius},${lat},${lng});
      way["building:part"](around:${radius},${lat},${lng});
      relation["type"="multipolygon"]["building"](around:${radius},${lat},${lng});
      way["highway"](around:${radius},${lat},${lng});
    );
    out geom;
  `;
    const response = await postOverpassQuery(query);
    if (!response) return [];
    const data = (await response.json()) as {
      elements?: unknown[];
      error?: string;
    };
    if (data.error) return [];
    return data.elements ?? [];
  } catch {
    return [];
  }
}

async function fetchHeatSources(lat: number, lng: number, radius: number): Promise<unknown[]> {
  try {
    const query = `
    [out:json][timeout:15];
    (
      way["landuse"="industrial"](around:${radius},${lat},${lng});
      way["landuse"="commercial"](around:${radius},${lat},${lng});
      way["landuse"="retail"](around:${radius},${lat},${lng});
      way["highway"="motorway"](around:${radius},${lat},${lng});
      way["highway"="trunk"](around:${radius},${lat},${lng});
      way["building"="yes"](around:${radius},${lat},${lng});
    );
    out geom;
  `;
    const response = await postOverpassQuery(query);
    if (!response) return [];
    const data = (await response.json()) as {
      elements?: unknown[];
      error?: string;
    };
    if (data.error) return [];
    return data.elements ?? [];
  } catch {
    return [];
  }
}

function osmWayToLatLngs(element: { geometry?: { lat: number; lon: number }[] }): L.LatLng[] {
  if (!element.geometry?.length) return [];
  return element.geometry.map((pt) => L.latLng(pt.lat, pt.lon));
}

function intersectsCircle(
  latlngs: L.LatLng[],
  center: L.LatLng,
  radiusMeters: number,
  mapInstance: L.Map
): boolean {
  for (const pt of latlngs) {
    if (mapInstance.distance(pt, center) <= radiusMeters) {
      return true;
    }
  }
  if (latlngs.length >= 3) {
    const poly = L.polygon(latlngs);
    const bounds = poly.getBounds();
    if (bounds.contains(center)) return true;
  }
  return false;
}

/** Approximate meters between two points (for fallback circles when no map is available). */
function metersBetweenLatLng(a: L.LatLng, b: L.LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = dLat * R;
  const y = dLng * R * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(x * x + y * y);
}

function latLngToLocalMeters(center: L.LatLng, ll: L.LatLng): { x: number; y: number } {
  const R = 6371000;
  const dLat = ((ll.lat - center.lat) * Math.PI) / 180;
  const dLng = ((ll.lng - center.lng) * Math.PI) / 180;
  const y = dLat * R;
  const x = dLng * R * Math.cos((center.lat * Math.PI) / 180);
  return { x, y };
}

function localMetersToLatLng(center: L.LatLng, x: number, y: number): L.LatLng {
  const R = 6371000;
  const dLat = (y / R) * (180 / Math.PI);
  const dLng = (x / (R * Math.cos((center.lat * Math.PI) / 180))) * (180 / Math.PI);
  return L.latLng(center.lat + dLat, center.lng + dLng);
}

/** Clip a line segment to a disk centered at the origin (local meters). Returns sub-segments inside the disk. */
function clipSegmentToDisk(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radiusM: number
): Array<[number, number, number, number]> {
  const R2 = radiusM * radiusM;
  const distSq = (x: number, y: number) => x * x + y * y;
  const aIn = distSq(ax, ay) <= R2;
  const bIn = distSq(bx, by) <= R2;
  if (aIn && bIn) return [[ax, ay, bx, by]];

  const dx = bx - ax;
  const dy = by - ay;
  const aCoeff = dx * dx + dy * dy;
  if (aCoeff < 1e-18) {
    return aIn ? [[ax, ay, ax, ay]] : [];
  }
  const bCoeff = 2 * (ax * dx + ay * dy);
  const cCoeff = ax * ax + ay * ay - R2;
  const disc = bCoeff * bCoeff - 4 * aCoeff * cCoeff;

  const ts: number[] = [0, 1];
  if (disc >= 0) {
    const s = Math.sqrt(disc);
    const t1 = (-bCoeff - s) / (2 * aCoeff);
    const t2 = (-bCoeff + s) / (2 * aCoeff);
    const add = (t: number) => {
      if (t > 1e-10 && t < 1 - 1e-10) ts.push(t);
    };
    add(t1);
    add(t2);
  }
  ts.sort((u, v) => u - v);
  const unique: number[] = [];
  for (const t of ts) {
    if (unique.length === 0 || Math.abs(t - unique[unique.length - 1]) > 1e-8) unique.push(t);
  }

  const out: Array<[number, number, number, number]> = [];
  for (let i = 0; i < unique.length - 1; i++) {
    const t0 = unique[i];
    const t1 = unique[i + 1];
    const mid = (t0 + t1) / 2;
    const mx = ax + mid * dx;
    const my = ay + mid * dy;
    if (distSq(mx, my) <= R2 * 1.0001) {
      const sx = ax + t0 * dx;
      const sy = ay + t0 * dy;
      const ex = ax + t1 * dx;
      const ey = ay + t1 * dy;
      if (Math.hypot(ex - sx, ey - sy) > 0.02) out.push([sx, sy, ex, ey]);
    }
  }
  return out;
}

function clipPolylineToAnalysisCircle(latlngs: L.LatLng[], center: L.LatLng, radiusM: number): L.LatLng[][] {
  if (latlngs.length < 2) return [];
  const out: L.LatLng[][] = [];
  let current: L.LatLng[] | null = null;

  for (let i = 0; i < latlngs.length - 1; i++) {
    const a = latLngToLocalMeters(center, latlngs[i]);
    const b = latLngToLocalMeters(center, latlngs[i + 1]);
    const segs = clipSegmentToDisk(a.x, a.y, b.x, b.y, radiusM);
    for (const [sx, sy, ex, ey] of segs) {
      const p0 = localMetersToLatLng(center, sx, sy);
      const p1 = localMetersToLatLng(center, ex, ey);
      if (!current) {
        current = [p0, p1];
      } else {
        const last = current[current.length - 1];
        if (metersBetweenLatLng(last, p0) < 0.4) {
          current.push(p1);
        } else {
          if (current.length >= 2) out.push(current);
          current = [p0, p1];
        }
      }
    }
  }
  if (current && current.length >= 2) out.push(current);
  return out;
}

/**
 * Clip a single OSM outer ring to the analysis circle so green never extends past the white boundary.
 */
function clipOsmRingToAnalysisCircle(
  latlngs: L.LatLng[],
  center: L.LatLng,
  radiusM: number
): L.LatLng[][][] | null {
  if (latlngs.length < 3) return null;
  const coords = latlngs.map((p) => [p.lng, p.lat] as [number, number]);
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }
  try {
    const poly = turfPolygon([coords]);
    const circ = turfCircle([center.lng, center.lat], radiusM / 1000, {
      units: "kilometers",
      steps: 64,
    });
    const int = intersect(featureCollection([poly, circ]));
    if (!int?.geometry) return null;
    const g = int.geometry;
    if (g.type === "Polygon") {
      const p = g as Polygon;
      return [p.coordinates.map((ring) => ring.map(([lng, lat]) => L.latLng(lat, lng)))];
    }
    if (g.type === "MultiPolygon") {
      const mp = g as MultiPolygon;
      return mp.coordinates.map((polyRings) =>
        polyRings.map((ring) => ring.map(([lng, lat]) => L.latLng(lat, lng)))
      );
    }
  } catch {
    return null;
  }
  return null;
}

function vegStyleFromTags(tags: Record<string, string | undefined>): { fillColor: string; fillOpacity: number } {
  const tag = tags;
  let fillColor = "#4ade80";
  let fillOpacity = 0.45;

  if (tag.landuse === "forest" || tag.natural === "wood") {
    fillColor = "#16a34a";
    fillOpacity = 0.55;
  } else if (tag.leisure === "park") {
    fillColor = "#4ade80";
    fillOpacity = 0.45;
  } else if (tag.natural === "grassland" || tag.landuse === "grass" || tag.landuse === "meadow") {
    fillColor = "#86efac";
    fillOpacity = 0.4;
  } else if (tag.natural === "wetland") {
    fillColor = "#2dd4bf";
    fillOpacity = 0.45;
  } else if (tag.natural === "scrub" || tag.landuse === "orchard" || tag.landuse === "vineyard") {
    fillColor = "#22c55e";
    fillOpacity = 0.48;
  }

  return { fillColor, fillOpacity };
}

/** Placeholder parks when Overpass returns nothing or fails — deterministic circles inside the analysis radius. */
function drawFallbackVegetation(
  group: L.LayerGroup,
  location: { lat: number; lng: number },
  greenScore?: number
) {
  const numParks = Math.max(2, Math.floor((greenScore ?? 0.2) * 10));
  const baseRadius = 80 + (greenScore ?? 0.2) * 120;
  const centerPt = L.latLng(location.lat, location.lng);

  for (let i = 0; i < numParks; i++) {
    const angle = (i / numParks) * Math.PI * 2 + 0.5;
    const dist = 200 + Math.sin(i * 2.7) * 200;
    const clat = location.lat + Math.sin(angle) * dist * 0.000009;
    const clng = location.lng + Math.cos(angle) * dist * 0.000013;
    const d = metersBetweenLatLng(centerPt, L.latLng(clat, clng));
    const radius = Math.min(baseRadius, Math.max(0, ANALYSIS_RADIUS_M - d - 8));
    if (radius < 20) continue;

    L.circle([clat, clng], {
      radius,
      color: "#16a34a",
      weight: 1,
      fillColor: "#4ade80",
      fillOpacity: 0.45,
      interactive: false,
    }).addTo(group);
  }
}

function drawFallbackHeat(
  group: L.LayerGroup,
  location: { lat: number; lng: number },
  heatScore?: number
) {
  const intensity = heatScore != null ? Math.min(1, Math.max(0, heatScore / 100)) : 0.5;
  const numHot = Math.floor(intensity * 6) + 2;
  const centerPt = L.latLng(location.lat, location.lng);
  for (let i = 0; i < numHot; i++) {
    const angle = (i / numHot) * Math.PI * 2;
    const r = 0.002 + Math.random() * 0.004;
    const clat = location.lat + Math.sin(angle) * r * 0.85;
    const clng = location.lng + Math.cos(angle) * r * 1.2;
    const d = metersBetweenLatLng(centerPt, L.latLng(clat, clng));
    const baseR = 25 + Math.random() * 45;
    const rM = Math.min(baseR, Math.max(0, ANALYSIS_RADIUS_M - d - 6));
    if (rM < 8) continue;
    L.circle([clat, clng], {
      radius: rM,
      color: "transparent",
      fillColor: "#f97316",
      fillOpacity: 0.35,
      weight: 0,
      interactive: false,
    }).addTo(group);
  }
}

const MAX_TREE_MARKERS = 600;

async function drawRealVegetation(
  mapInstance: L.Map,
  group: L.LayerGroup,
  location: { lat: number; lng: number },
  greenScore: number | undefined,
  isCancelled: () => boolean
): Promise<void> {
  try {
    const [elements, treeElements] = await Promise.all([
      fetchVegetation(location.lat, location.lng, OVERPASS_FETCH_RADIUS_M),
      fetchTreeNodes(location.lat, location.lng, OVERPASS_FETCH_RADIUS_M),
    ]);
    if (isCancelled()) return;

    const center = L.latLng(location.lat, location.lng);
    let drawn = 0;
    for (const el of elements) {
      if (isCancelled()) return;
      const raw = el as {
        type?: string;
        geometry?: { lat: number; lon: number }[];
        tags?: Record<string, string>;
      };
      if (raw.type && raw.type !== "way" && raw.type !== "relation") continue;
      const latlngs = osmWayToLatLngs(raw);
      if (latlngs.length < 3) continue;

      if (!intersectsCircle(latlngs, center, OVERPASS_FETCH_RADIUS_M, mapInstance)) {
        continue;
      }

      const clipped = clipOsmRingToAnalysisCircle(latlngs, center, ANALYSIS_RADIUS_M);
      if (!clipped?.length) continue;

      const tag = raw.tags ?? {};
      const { fillColor, fillOpacity } = vegStyleFromTags(tag);

      for (const polyRings of clipped) {
        if (!polyRings[0]?.length) continue;
        try {
          L.polygon(polyRings, {
            color: fillColor,
            weight: 1,
            fillColor,
            fillOpacity,
            interactive: false,
          }).addTo(group);
          drawn += 1;
        } catch {
          /* skip invalid ring */
        }
      }
    }

    let treeCount = 0;
    for (const el of treeElements) {
      if (isCancelled()) return;
      if (treeCount >= MAX_TREE_MARKERS) break;
      const n = el as { type?: string; lat?: number; lon?: number };
      if (n.type !== "node" || n.lat == null || n.lon == null) continue;
      const pt = L.latLng(n.lat, n.lon);
      const dCenter = mapInstance.distance(pt, center);
      if (dCenter > ANALYSIS_RADIUS_M) continue;
      const treeRadiusM = Math.min(5.5, Math.max(0, ANALYSIS_RADIUS_M - dCenter));
      if (treeRadiusM < 1.2) continue;
      try {
        L.circle(pt, {
          radius: treeRadiusM,
          color: "#15803d",
          weight: 0,
          fillColor: "#22c55e",
          fillOpacity: 0.55,
          interactive: false,
        }).addTo(group);
        treeCount += 1;
        drawn += 1;
      } catch {
        /* skip */
      }
    }

    if (drawn === 0 && !isCancelled()) {
      drawFallbackVegetation(group, location, greenScore);
    }
  } catch (e) {
    console.warn("Map data unavailable:", e);
    if (!isCancelled()) {
      drawFallbackVegetation(group, location, greenScore);
    }
    return;
  }
}

async function drawRealHeat(
  mapInstance: L.Map,
  group: L.LayerGroup,
  location: { lat: number; lng: number },
  isCancelled: () => boolean,
  setLayerLoading: Dispatch<SetStateAction<boolean>>
): Promise<void> {
  try {
    const elements = await fetchHeatSources(location.lat, location.lng, OVERPASS_FETCH_RADIUS_M);
    if (isCancelled()) return;

    const center = L.latLng(location.lat, location.lng);
    for (const el of elements) {
      if (isCancelled()) return;
      const raw = el as {
        type?: string;
        geometry?: { lat: number; lon: number }[];
        tags?: Record<string, string>;
      };
      if (raw.type && raw.type !== "way") continue;
      const latlngs = osmWayToLatLngs(raw);
      if (!intersectsCircle(latlngs, center, OVERPASS_FETCH_RADIUS_M, mapInstance)) {
        continue;
      }
      const isRoad = Boolean(raw.tags?.highway);
      const color = isRoad ? "#ef4444" : "#f97316";

      try {
        if (isRoad) {
          if (latlngs.length < 2) continue;
          const clippedLines = clipPolylineToAnalysisCircle(latlngs, center, ANALYSIS_RADIUS_M);
          for (const line of clippedLines) {
            if (line.length < 2) continue;
            L.polyline(line, {
              color,
              weight: 3,
              opacity: 0.5,
              interactive: false,
            }).addTo(group);
          }
        } else {
          if (latlngs.length < 3) continue;
          const clipped = clipOsmRingToAnalysisCircle(latlngs, center, ANALYSIS_RADIUS_M);
          if (!clipped?.length) continue;
          for (const polyRings of clipped) {
            if (!polyRings[0]?.length) continue;
            L.polygon(polyRings, {
              color,
              weight: 0,
              fillColor: color,
              fillOpacity: 0.35,
              interactive: false,
            }).addTo(group);
          }
        }
      } catch {
        /* skip invalid geometry */
      }
    }
  } catch (e) {
    console.warn("Map data unavailable:", e);
    setLayerLoading(false);
    return;
  }
}

const SATELLITE_VEG_MASK_PANE = "satelliteVegMask";

/** Screen-space radius of the analysis circle in pixels (approximate, latitude-based). */
function computePixelRadiusForMeters(map: L.Map, center: L.LatLng, radiusM: number): number {
  const metersPerDegLat = 111320;
  const edge = L.latLng(center.lat + radiusM / metersPerDegLat, center.lng);
  const c = map.latLngToContainerPoint(center);
  const e = map.latLngToContainerPoint(edge);
  return Math.hypot(e.x - c.x, e.y - c.y);
}

function rgbSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  if (max === 0) return 0;
  return (max - Math.min(r, g, b)) / max;
}

/**
 * Excess-green + chroma rules for canopy vs roofs, roads, and gray built surfaces.
 * When OSM exclusion masks are not loaded yet, we use stricter thresholds.
 */
function isLikelyVegetationPixel(r: number, g: number, b: number, strictExclusionPending: boolean): boolean {
  const sum = r + g + b;
  if (sum < 45) return false;
  const exg = 2 * g - r - b;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const sat = rgbSaturation(r, g, b);
  const mean = (r + g + b) / 3;

  const minExg = strictExclusionPending ? 14 : 10;
  const minGreenLead = strictExclusionPending ? 10 : 6;

  if (exg < minExg) return false;
  if (g < r + minGreenLead) return false;
  if (g < b + 4) return false;
  if (b > g + 22 && b > r + 12) return false;
  if (b > g + 12 && r < 130 && g < 150) return false;
  // Flat gray roofs / asphalt (often read as slightly green in aerials)
  if (spread < 15 && mean > 70 && mean < 195 && exg < 28) return false;
  if (spread < 18 && r < 125 && g < 125 && b < 125) return false;
  if (spread < 22 && r > 172 && g > 172 && b > 172) return false;
  // Low-saturation gray with a green cast (roofing)
  if (sat < 0.14 && spread < 28 && mean > 55 && mean < 200 && exg < 32) return false;
  // Strong vegetation signal: allow darker canopy
  if (exg >= 35 || (exg >= 22 && sat >= 0.18)) return true;
  if (exg >= 18 && sat >= 0.18 && g > r + 8) return true;
  return false;
}

function roadWidthPx(map: L.Map, highway: string | undefined): number {
  const z = map.getZoom();
  const t = highway ?? "";
  if (["motorway", "trunk", "primary"].includes(t)) return 12 + z * 0.85;
  if (["secondary", "tertiary"].includes(t)) return 10 + z * 0.65;
  if (["residential", "unclassified", "living_street", "service"].includes(t)) return 7 + z * 0.5;
  if (["footway", "path", "cycleway", "pedestrian", "steps", "track"].includes(t)) return 3 + z * 0.35;
  return 8 + z * 0.5;
}

/** White-on-black raster: 1 = exclude from vegetation highlight. */
function buildExclusionBitmap(map: L.Map, elements: unknown[], w: number, h: number): Uint8Array | null {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const el of elements) {
    const raw = el as {
      type?: string;
      geometry?: { lat: number; lon: number }[];
      tags?: Record<string, string>;
    };
    if (raw.type && raw.type !== "way" && raw.type !== "relation") continue;
    const tags = raw.tags ?? {};
    const latlngs = osmWayToLatLngs(raw);
    if (latlngs.length < 2) continue;
    const pts = latlngs.map((ll) => map.latLngToContainerPoint(ll));

    const isBuilding = Boolean(tags.building || tags["building:part"]);
    if (isBuilding) {
      if (pts.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
    } else if (tags.highway) {
      ctx.lineWidth = roadWidthPx(map, tags.highway);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  }

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }
  const d = imageData.data;
  const out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i++) {
    const o = i * 4;
    if (d[o] > 128 || d[o + 1] > 128 || d[o + 2] > 128) out[i] = 1;
  }
  return out;
}

function dilateBinaryMask(mask: Uint8Array, w: number, h: number, passes: number): void {
  const tmp = new Uint8Array(mask.length);
  for (let p = 0; p < passes; p++) {
    tmp.set(mask);
    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const i = row + x;
        if (tmp[i]) continue;
        if (
          tmp[i - 1] ||
          tmp[i + 1] ||
          tmp[i - w] ||
          tmp[i + w] ||
          tmp[i - w - 1] ||
          tmp[i - w + 1] ||
          tmp[i + w - 1] ||
          tmp[i + w + 1]
        ) {
          mask[i] = 1;
        }
      }
    }
  }
}

function redrawSatelliteVegetationMask(
  map: L.Map,
  canvas: HTMLCanvasElement,
  location: { lat: number; lng: number },
  /** `null` = OSM exclusions not loaded yet (stricter pixel rules); array = subtract buildings/roads */
  exclusionElements: unknown[] | null
): void {
  const size = map.getSize();
  const w = Math.floor(size.x);
  const h = Math.floor(size.y);
  if (w < 1 || h < 1) return;

  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const comp = document.createElement("canvas");
  comp.width = w;
  comp.height = h;
  const cctx = comp.getContext("2d");
  if (!cctx) return;

  const container = map.getContainer();
  const cRect = container.getBoundingClientRect();
  const tiles = container.querySelectorAll("img.leaflet-tile");
  for (const tile of tiles) {
    if (!(tile instanceof HTMLImageElement)) continue;
    if (!tile.complete || tile.naturalWidth === 0) continue;
    const rect = tile.getBoundingClientRect();
    const dx = rect.left - cRect.left;
    const dy = rect.top - cRect.top;
    try {
      cctx.drawImage(tile, dx, dy, rect.width, rect.height);
    } catch {
      /* skip */
    }
  }

  let imageData: ImageData;
  try {
    imageData = cctx.getImageData(0, 0, w, h);
  } catch {
    ctx.clearRect(0, 0, w, h);
    return;
  }

  const data = imageData.data;
  const strictPixels = exclusionElements === null;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!isLikelyVegetationPixel(r, g, b, strictPixels)) continue;
      const idx = y * w + x;
      mask[idx] = 1;
      if (x + 1 < w) mask[idx + 1] = 1;
      if (y + 1 < h) {
        mask[idx + w] = 1;
        if (x + 1 < w) mask[idx + w + 1] = 1;
      }
    }
  }

  dilateBinaryMask(mask, w, h, strictPixels ? 2 : 3);

  if (exclusionElements !== null && exclusionElements.length > 0) {
    const excl = buildExclusionBitmap(map, exclusionElements, w, h);
    if (excl) {
      for (let i = 0; i < mask.length; i++) {
        if (excl[i]) mask[i] = 0;
      }
    }
  }

  const center = map.latLngToContainerPoint(L.latLng(location.lat, location.lng));
  const rPx = computePixelRadiusForMeters(map, L.latLng(location.lat, location.lng), ANALYSIS_RADIUS_M);
  const r2 = rPx * rPx;

  const out = ctx.createImageData(w, h);
  const od = out.data;
  const fillR = 74;
  const fillG = 222;
  const fillB = 128;
  const fillA = 104;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const i = row + x;
      if (!mask[i]) continue;
      const dx = x - center.x;
      const dy = y - center.y;
      if (dx * dx + dy * dy > r2) continue;
      const o = i * 4;
      od[o] = fillR;
      od[o + 1] = fillG;
      od[o + 2] = fillB;
      od[o + 3] = fillA;
    }
  }
  ctx.putImageData(out, 0, 0);
}

function SatelliteVegetationMask({
  location,
  activeLayer,
}: {
  location: { lat: number; lng: number };
  activeLayer: MapLayerId;
}) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const exclusionRef = useRef<unknown[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (activeLayer !== "vegetation") {
      exclusionRef.current = null;
      return () => {
        cancelled = true;
      };
    }
    exclusionRef.current = null;
    void (async () => {
      const els = await fetchOsmExclusionGeometries(
        location.lat,
        location.lng,
        OVERPASS_FETCH_RADIUS_M
      );
      if (cancelled) return;
      exclusionRef.current = els;
      if (canvasRef.current) {
        redrawSatelliteVegetationMask(map, canvasRef.current, location, els);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [map, location.lat, location.lng, activeLayer]);

  useEffect(() => {
    let pane = map.getPane(SATELLITE_VEG_MASK_PANE);
    if (!pane) {
      pane = map.createPane(SATELLITE_VEG_MASK_PANE);
    }
    pane.style.zIndex = "350";
    pane.style.pointerEvents = "none";

    if (activeLayer !== "vegetation") {
      pane.style.display = "none";
      return () => {
        pane.style.display = "none";
      };
    }

    pane.style.display = "";

    let canvas = canvasRef.current;
    if (!canvas) {
      const existing = pane.querySelector("canvas");
      if (existing instanceof HTMLCanvasElement) {
        canvas = existing;
      } else {
        canvas = L.DomUtil.create("canvas", "", pane) as HTMLCanvasElement;
        canvas.style.position = "absolute";
        canvas.style.left = "0";
        canvas.style.top = "0";
        canvas.style.pointerEvents = "none";
      }
      canvasRef.current = canvas;
    }

    const run = () => {
      if (canvasRef.current) {
        redrawSatelliteVegetationMask(map, canvasRef.current, location, exclusionRef.current);
      }
    };

    const debounced = () => {
      if (debounceTimerRef.current != null) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        run();
      }, 320);
    };

    const tileLayersWithListeners: L.TileLayer[] = [];
    const seenTileLayers = new WeakSet<L.TileLayer>();
    const bindTileLayer = (tl: L.TileLayer) => {
      if (seenTileLayers.has(tl)) return;
      seenTileLayers.add(tl);
      tl.on("tileload", debounced);
      tileLayersWithListeners.push(tl);
    };

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) bindTileLayer(layer);
    });

    const onLayerAdd = (e: L.LayerEvent) => {
      if (e.layer instanceof L.TileLayer) bindTileLayer(e.layer);
    };

    const delayedRuns: number[] = [400, 900, 1800].map((ms) => window.setTimeout(run, ms));

    map.whenReady(() => {
      run();
      window.setTimeout(run, 450);
    });

    map.on("layeradd", onLayerAdd);
    map.on("moveend", debounced);
    map.on("zoomend", debounced);
    map.on("resize", debounced);

    return () => {
      if (debounceTimerRef.current != null) window.clearTimeout(debounceTimerRef.current);
      for (const t of delayedRuns) window.clearTimeout(t);
      for (const tl of tileLayersWithListeners) {
        tl.off("tileload", debounced);
      }
      map.off("layeradd", onLayerAdd);
      map.off("moveend", debounced);
      map.off("zoomend", debounced);
      map.off("resize", debounced);
      pane.style.display = "none";
    };
  }, [map, location.lat, location.lng, activeLayer]);

  return null;
}

function AnalysisMapLayers({
  location,
  greenScore,
  heatScore,
  activeLayer,
  setLayerLoading,
}: {
  location: { lat: number; lng: number };
  greenScore?: number;
  heatScore?: number;
  activeLayer: MapLayerId;
  setLayerLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const map = useMap();
  const dataLayerGroupRef = useRef<L.LayerGroup | null>(null);

  useLayoutEffect(() => {
    const dataLayerGroup = L.layerGroup().addTo(map);
    dataLayerGroupRef.current = dataLayerGroup;

    const analysisBorder = L.circle([location.lat, location.lng], {
      radius: ANALYSIS_RADIUS_M,
      color: "#ffffff",
      weight: 3.5,
      fill: false,
      interactive: false,
    }).addTo(map);

    return () => {
      map.removeLayer(dataLayerGroup);
      map.removeLayer(analysisBorder);
      dataLayerGroupRef.current = null;
    };
  }, [map, location.lat, location.lng]);

  useEffect(() => {
    const group = dataLayerGroupRef.current;
    if (!group) return;

    let cancelled = false;
    const isCancelled = () => cancelled;

    group.clearLayers();
    setLayerLoading(true);

    const run = async () => {
      try {
        if (activeLayer === "vegetation") {
          await drawRealVegetation(map, group, location, greenScore, isCancelled);
        } else {
          await drawRealHeat(map, group, location, isCancelled, setLayerLoading);
        }
      } finally {
        if (!cancelled) setLayerLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [map, activeLayer, greenScore, heatScore, location.lat, location.lng, setLayerLoading]);

  return null;
}

export function MapView({ location, name, greenScore, heatScore }: MapViewProps) {
  const center: [number, number] = [location.lat, location.lng];
  const [activeLayer, setActiveLayer] = useState<MapLayerId>("vegetation");
  const [layerLoading, setLayerLoading] = useState(false);

  const greenRatio = greenScore ?? 0.2;
  const greenColor =
    greenRatio > 0.3 ? "#4ade80" : greenRatio > 0.15 ? "#fbbf24" : "#f87171";

  const layerKeys = ["vegetation", "heat"] as const;

  const greenLegend = [
    { color: "#34d399", label: "Satellite canopy" },
    { color: "#16a34a", label: "Forest / Wood" },
    { color: "#4ade80", label: "Parks & Play" },
    { color: "#86efac", label: "Grass / Meadow" },
    { color: "#22c55e", label: "Trees / Scrub" },
    { color: "#2dd4bf", label: "Wetlands" },
  ];

  const heatLegend = [
    { color: "#60a5fa", label: "Cool zone" },
    { color: "#fde68a", label: "Moderate heat" },
    { color: "#f97316", label: "Warm zone" },
    { color: "#ef4444", label: "High heat" },
    { color: "#dc2626", label: "Industrial / Roads" },
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-white text-lg">Location Overview</CardTitle>
        </div>
        <p className="text-sm text-slate-400 mt-1">Satellite imagery from ESRI World Imagery</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            className="border border-slate-700 z-0 rounded-lg overflow-hidden"
            style={{
              position: "relative",
              height: 400,
            }}
          >
            <MapContainer
              center={center}
              zoom={14}
              className="h-full w-full z-0 [&_.leaflet-container]:!bg-transparent"
              scrollWheelZoom
              preferCanvas
              style={{ height: "100%", minHeight: 400 }}
            >
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
              crossOrigin="anonymous"
            />
            <SatelliteVegetationMask location={location} activeLayer={activeLayer} />
            <AnalysisMapLayers
              location={location}
              greenScore={greenScore}
              heatScore={heatScore}
              activeLayer={activeLayer}
              setLayerLoading={setLayerLoading}
            />
            <Marker position={center} icon={markerIcon}>
              <Popup>
                <strong>{name}</strong>
              </Popup>
            </Marker>
          </MapContainer>
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 400,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 50% 50%, transparent 35%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.85) 100%)",
            }}
          />
          </div>

          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {layerKeys.map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setActiveLayer(layer as MapLayerId)}
                style={{
                  background: activeLayer === layer ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.6)",
                  border: `1px solid ${
                    activeLayer === layer
                      ? layer === "vegetation"
                        ? "#4ade80"
                        : "#f97316"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  borderRadius: "6px",
                  padding: "5px 10px",
                  color:
                    activeLayer === layer
                      ? layer === "vegetation"
                        ? "#4ade80"
                        : "#f97316"
                      : "rgba(255,255,255,0.4)",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  whiteSpace: "nowrap",
                }}
              >
                {layer === "vegetation" ? "🌿 Green" : "🔥 Heat"}
                {layer === activeLayer && layerLoading && (
                  <span style={{ marginLeft: "4px", display: "inline-block" }}>⟳</span>
                )}
              </button>
            ))}
          </div>

          {(activeLayer === "vegetation" || activeLayer === "heat") && (
            <div
              style={{
                position: "absolute",
                bottom: "28px",
                right: "12px",
                zIndex: 1000,
                background: "rgba(0,0,0,0.82)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "8px 10px",
                backdropFilter: "blur(8px)",
                minWidth: "130px",
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  color: "#6b7280",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  marginBottom: "6px",
                }}
              >
                {activeLayer === "vegetation" ? "Vegetation" : "Heat Sources"}
              </div>
              {(activeLayer === "vegetation" ? greenLegend : heatLegend).map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeLayer === "vegetation" && (
            <div style={badgeStyle}>
              <div style={labelStyle}>Green Coverage</div>
              <div style={{ ...valueStyle, color: greenColor }}>
                {greenScore ? `${(greenScore * 100).toFixed(0)}%` : "—"}
              </div>
            </div>
          )}

          {activeLayer === "heat" && (
            <div style={badgeStyle}>
              <div style={labelStyle}>Heat Intensity</div>
              <div
                style={{
                  ...valueStyle,
                  color:
                    heatScore != null && heatScore > 70
                      ? "#ef4444"
                      : heatScore != null && heatScore > 40
                        ? "#f97316"
                        : "#60a5fa",
                }}
              >
                {heatScore ?? "—"}/100
              </div>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
}
