import React from 'react';
import { MapPin, Clock } from 'lucide-react';

interface RestaurantInfoProps {
  restaurantName: string;
  deliveryTime?: string | number;
}

const RestaurantInfo = ({ restaurantName, deliveryTime }: RestaurantInfoProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-gray-600 mb-2">
        <MapPin className="h-4 w-4" />
        <span>{restaurantName}</span>
      </div>
      {deliveryTime && (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Thời gian giao hàng: {deliveryTime} phút</span>
        </div>
      )}
    </div>
  );
};

export default RestaurantInfo;