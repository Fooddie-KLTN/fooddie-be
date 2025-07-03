const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');
require('dotenv').config(); // Nếu không dùng NestJS ConfigModule

const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('MAPBOX_ACCESS_TOKEN is missing in .env');
}

const directionsService = mbxDirections({ accessToken });

/**
 * Get distance and duration via Mapbox Directions API
 */
export async function getDistanceAndDurationFromMapbox(
  origin: [number, number], // [lng, lat]
  destination: [number, number] // [lng, lat]
): Promise<{ distanceKm: number; durationMin: number } | null> {
  try {
    const res = await directionsService.getDirections({
      profile: 'driving',
      waypoints: [
        { coordinates: origin },
        { coordinates: destination },
      ],
      geometries: 'geojson',
    }).send();

    const route = res.body.routes[0];

    return {
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch (err) {
    console.error('Mapbox error:', err.message);
    return null;
  }
}
