import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface GeocodingResult {
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor() {
    this.accessToken = process.env.MAPBOX_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      this.logger.warn('No Mapbox access token found. Geocoding will not work.');
    }
  }

  /**
   * Convert an address into geographic coordinates using Mapbox
   * 
   * @param addressParts The parts of the address to geocode
   * @returns latitude and longitude coordinates
   */
  async geocode(addressParts: { street: string, ward: string, district: string, city: string }): Promise<GeocodingResult | null> {
    if (!this.accessToken) {
      this.logger.warn('Geocoding skipped - no Mapbox access token provided');
      return null;
    }

    try {
      // Format the address for the API
      const address = `${addressParts.street}, ${addressParts.ward}, ${addressParts.district}, ${addressParts.city}, Vietnam`;

      // URL encode the address
      const encodedAddress = encodeURIComponent(address);

      // Make request to Mapbox Geocoding API
      const response = await axios.get(`${this.baseUrl}/${encodedAddress}.json`, {
        params: {
          access_token: this.accessToken,
          country: 'vn', // Limit results to Vietnam
          limit: 1,      // Get just the top result
          types: 'address,place' // Focus on addresses and places
        }
      });

      // Check if we have valid results
      if (response.data && response.data.features && response.data.features.length > 0) {
        const [longitude, latitude] = response.data.features[0].geometry.coordinates;

        // Mapbox returns coordinates as [longitude, latitude]
        return {
          lat: latitude,
          lng: longitude
        };
      }

      this.logger.warn(`Mapbox geocoding failed for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error('Error during Mapbox geocoding', error);
      return null;
    }
  }
  haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
}