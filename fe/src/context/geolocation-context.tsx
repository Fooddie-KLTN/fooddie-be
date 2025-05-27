"use client";
import React, { createContext, useContext } from "react";
import { useEffect, useState } from "react";

interface GeoLocation {
  lat: number;
  lng: number;
}

export function useGeoLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Trình duyệt của bạn không hỗ trợ định vị.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error getting location:", err);
        setError("Bạn cần cho phép truy cập vị trí để sử dụng dịch vụ.");
        setLoading(false);
      }
    );
  }, []);

  return { location, error, loading };
}

// --- Add below this line ---

const GeoLocationContext = createContext<ReturnType<typeof useGeoLocation> | null>(null);

export const GeoLocationProvider = ({ children }: { children: React.ReactNode }) => {
  const geo = useGeoLocation();
  return (
    <GeoLocationContext.Provider value={geo}>
      {children}
    </GeoLocationContext.Provider>
  );
};

export const useGeo = () => {
  const ctx = useContext(GeoLocationContext);
  if (!ctx) throw new Error("useGeo must be used within GeoLocationProvider");
  return ctx;
};