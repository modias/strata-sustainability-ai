import { useEffect, useRef, useState, type CSSProperties } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin } from "lucide-react";

export type MapLayerId = "vegetation" | "heat" | "corporate";

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

function drawLayerInto(
  map: L.Map,
  grid: L.LayerGroup,
  type: MapLayerId,
  location: { lat: number; lng: number },
  greenScore?: number,
  heatScore?: number
) {
  grid.clearLayers();

  const greenRatio = greenScore ?? 0.2;
  const heatRatio = (heatScore ?? 50) / 100;
  const gridSize = 20;
  const bounds = L.latLngBounds(
    [location.lat - 0.008, location.lng - 0.012],
    [location.lat + 0.008, location.lng + 0.012]
  );
  const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
  const lngStep = (bounds.getEast() - bounds.getWest()) / gridSize;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const lat = bounds.getSouth() + latStep * row;
      const lng = bounds.getWest() + lngStep * col;

      const dist = map.distance(
        [lat + latStep / 2, lng + lngStep / 2],
        [location.lat, location.lng]
      );
      if (dist > 800) continue;

      const seed = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
      const val = seed - Math.floor(seed);

      const clusterSeed =
        Math.sin(Math.floor(row / 3) * 127.1 + Math.floor(col / 3) * 311.7) * 43758.5453;
      const clusterVal = clusterSeed - Math.floor(clusterSeed);
      const blended = val * 0.4 + clusterVal * 0.6;

      let fillColor = "transparent";
      let fillOpacity = 0;

      if (type === "vegetation") {
        const isVeg = blended < greenRatio;
        fillColor = isVeg ? "#4ade80" : "#6b7280";
        fillOpacity = isVeg ? 0.4 : 0.15;
      } else if (type === "heat") {
        const heatVal =
          blended < greenRatio ? 0.1 + blended * 0.3 : heatRatio * blended;

        if (heatVal < 0.25) {
          fillColor = "#60a5fa";
          fillOpacity = 0.3;
        } else if (heatVal < 0.5) {
          fillColor = "#fde68a";
          fillOpacity = 0.35;
        } else if (heatVal < 0.75) {
          fillColor = "#f97316";
          fillOpacity = 0.4;
        } else {
          fillColor = "#ef4444";
          fillOpacity = 0.5;
        }
      } else if (type === "corporate") {
        const distRatio = dist / 800;
        const activity = (1 - distRatio) * (0.5 + blended * 0.5);

        if (activity > 0.7) {
          fillColor = "#818cf8";
          fillOpacity = 0.5;
        } else if (activity > 0.4) {
          fillColor = "#a78bfa";
          fillOpacity = 0.3;
        } else {
          fillColor = "#e2e8f0";
          fillOpacity = 0.1;
        }
      }

      L.rectangle(
        [
          [lat, lng],
          [lat + latStep, lng + lngStep],
        ],
        {
          color: "transparent",
          fillColor,
          fillOpacity,
          weight: 0,
        }
      ).addTo(grid);
    }
  }
}

function AnalysisMapLayers({
  location,
  greenScore,
  heatScore,
  activeLayer,
}: {
  location: { lat: number; lng: number };
  greenScore?: number;
  heatScore?: number;
  activeLayer: MapLayerId;
}) {
  const map = useMap();
  const gridRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const circle = L.circle([location.lat, location.lng], {
      radius: 800,
      color: "rgba(255,255,255,0.6)",
      weight: 1.5,
      fill: false,
      dashArray: "4 4",
    }).addTo(map);

    const grid = L.layerGroup().addTo(map);
    gridRef.current = grid;

    return () => {
      map.removeLayer(circle);
      map.removeLayer(grid);
      gridRef.current = null;
    };
  }, [map, location.lat, location.lng]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    drawLayerInto(map, grid, activeLayer, location, greenScore, heatScore);
  }, [map, activeLayer, greenScore, heatScore, location.lat, location.lng]);

  return null;
}

export function MapView({ location, name, greenScore, heatScore, mode }: MapViewProps) {
  const center: [number, number] = [location.lat, location.lng];
  const [activeLayer, setActiveLayer] = useState<MapLayerId>("vegetation");

  useEffect(() => {
    if (mode !== "hub" && activeLayer === "corporate") {
      setActiveLayer("vegetation");
    }
  }, [mode, activeLayer]);

  const greenRatio = greenScore ?? 0.2;
  const greenColor =
    greenRatio > 0.3 ? "#4ade80" : greenRatio > 0.15 ? "#fbbf24" : "#f87171";

  const layerKeys = ["vegetation", "heat", ...(mode === "hub" ? ["corporate"] : [])] as const;

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
          <MapContainer
            center={center}
            zoom={14}
            className="h-[400px] rounded-lg overflow-hidden border border-slate-700 z-0"
            scrollWheelZoom
            style={{ height: 400 }}
          >
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
              opacity={0.3}
            />
            <AnalysisMapLayers
              location={location}
              greenScore={greenScore}
              heatScore={heatScore}
              activeLayer={activeLayer}
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
                        : layer === "heat"
                          ? "#f97316"
                          : "#818cf8"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  borderRadius: "6px",
                  padding: "5px 10px",
                  color:
                    activeLayer === layer
                      ? layer === "vegetation"
                        ? "#4ade80"
                        : layer === "heat"
                          ? "#f97316"
                          : "#818cf8"
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
                {layer === "vegetation" ? "🌿 Green" : layer === "heat" ? "🔥 Heat" : "🏢 Corporate"}
              </button>
            ))}
          </div>

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

          {activeLayer === "corporate" && mode === "hub" && (
            <div style={badgeStyle}>
              <div style={labelStyle}>Corporate Density</div>
              <div style={{ ...valueStyle, color: "#818cf8" }}>HIGH</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
