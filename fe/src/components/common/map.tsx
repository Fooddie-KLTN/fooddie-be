// src/components/common/map.tsx
"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface Props {
  from: string; // address string
  to: string;   // address string
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const Map: React.FC<Props> = ({ from, to }) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [106.660172, 10.762622], // Default: HCM
      zoom: 12,
    });

    // You can add geocoding here to convert `from` and `to` to coordinates and add markers

    return () => map.remove();
  }, [from, to]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
