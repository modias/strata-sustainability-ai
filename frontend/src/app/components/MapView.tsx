import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin } from "lucide-react";

interface MapViewProps {
  location: { lat: number; lng: number };
  name: string;
  greenScore?: number;
}

export function MapView({ location, name, greenScore }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([location.lat, location.lng], 14);

    // Add satellite imagery tile layer (ESRI World Imagery)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxZoom: 18,
    }).addTo(map);

    // Add street overlay for labels
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
      opacity: 0.3,
    }).addTo(map);

    // Custom marker icon
    const customIcon = L.divIcon({
      html: `<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>`,
      className: "custom-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add marker
    L.marker([location.lat, location.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<strong>${name}</strong>`)
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [location.lat, location.lng, name]);

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
          <div ref={mapRef} className="h-[400px] rounded-lg overflow-hidden border border-slate-700" />
          {greenScore !== undefined && (
            <div className="absolute top-3 right-3 z-[1000] bg-black/80 border border-green-400/40 rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="text-xs text-muted-foreground mb-1 font-mono uppercase tracking-widest">
                Green Coverage
              </div>
              <div className="text-2xl font-bold text-green-400">{(greenScore * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
