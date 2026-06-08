"use client";

import { useEffect, useRef, useState } from "react";

// Carga el SDK de Google Maps una sola vez en el documento.
let mapsLoadingPromise: Promise<void> | null = null;

function loadMapsSdk(apiKey: string): Promise<void> {
  if (typeof window !== "undefined" && (window as unknown as { google?: { maps?: unknown } }).google?.maps) {
    return Promise.resolve();
  }
  if (mapsLoadingPromise) return mapsLoadingPromise;
  mapsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-google-maps-loader]"
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Maps load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "1";
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Maps load failed")));
    document.head.appendChild(script);
  });
  return mapsLoadingPromise;
}

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: "red" | "blue" | "green";
};

type MarkerInstance = {
  setPosition: (p: { lat: number; lng: number }) => void;
  setMap: (m: unknown) => void;
};

type MapsNamespace = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
  LatLngBounds: new () => { extend: (point: { lat: number; lng: number }) => void };
  Marker: new (opts: {
    position: { lat: number; lng: number };
    map: unknown;
    title?: string;
    label?: { text: string; color: string; fontWeight: string };
    icon?: { path: number; scale: number; fillColor: string; fillOpacity: number; strokeColor: string; strokeWeight: number };
  }) => MarkerInstance;
  SymbolPath: { CIRCLE: number };
};

export function GoogleMapView({
  markers,
  fitBounds = true,
  className,
  height = 300,
}: {
  markers: MapMarker[];
  fitBounds?: boolean;
  className?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRefs = useRef<Map<string, MarkerInstance>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }
    if (!containerRef.current) return;
    let cancelled = false;

    loadMapsSdk(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = (window as unknown as { google: { maps: MapsNamespace } }).google;
        const center =
          markers.length > 0
            ? { lat: markers[0].lat, lng: markers[0].lng }
            : { lat: 6.4385, lng: -75.3318 }; // Barbosa
        mapRef.current = new google.maps.Map(containerRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        applyMarkers(google.maps);
      })
      .catch(() => setError("No se pudo cargar el mapa"));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (!mapRef.current) return;
    const g = (window as unknown as { google?: { maps: MapsNamespace } }).google;
    if (!g) return;
    applyMarkers(g.maps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  function applyMarkers(maps: MapsNamespace) {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const seen = new Set<string>();

    markers.forEach((m) => {
      seen.add(m.id);
      const color = m.color === "blue" ? "#2563eb" : m.color === "green" ? "#16a34a" : "#dc2626";
      const existing = markerRefs.current.get(m.id);
      if (existing) {
        existing.setPosition({ lat: m.lat, lng: m.lng });
      } else {
        const marker = new maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.label,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
        markerRefs.current.set(m.id, marker);
      }
    });

    // remove markers no longer present
    for (const [id, marker] of markerRefs.current) {
      if (!seen.has(id)) {
        marker.setMap(null);
        markerRefs.current.delete(id);
      }
    }

    if (fitBounds && markers.length > 1) {
      const bounds = new maps.LatLngBounds();
      markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      (map as { fitBounds: (b: unknown, p: number) => void }).fitBounds(bounds, 60);
    }
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-dashed bg-muted text-xs text-muted-foreground ${
          className ?? ""
        }`}
        style={{ height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-md border bg-muted ${className ?? ""}`}
      style={{ height }}
    />
  );
}
