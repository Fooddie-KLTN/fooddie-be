// src/components/common/map.tsx
"use client";
import React from "react";

interface Props {
  from: string; // lat,lng
  to: string;   // lat,lng
}

const Map: React.FC<Props> = ({ from, to }) => {
  const [lat1, lng1] = from.split(",").map(Number);
  const [lat2, lng2] = to.split(",").map(Number);

  return (
    <iframe
      className="w-full h-full border-none"
      loading="lazy"
      allowFullScreen
      src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyDu1egFoX1KFXjhRH6LCscMoVqo9uYsNiE&origin=${lat1},${lng1}&destination=${lat2},${lng2}&mode=driving`}
    />
  );
};

export default Map;
