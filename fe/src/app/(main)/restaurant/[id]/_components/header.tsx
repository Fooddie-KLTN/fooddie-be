import Image from 'next/image';
import { MapPinIcon, ClockIcon, PhoneIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Restaurant } from '@/interface';

interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  return (
    <div className="relative h-[300px] w-full">
      <Image
        src={restaurant.backgroundImage || '/images/default-restaurant-bg.jpg'}
        alt={restaurant.name}
        fill
        className="object-cover brightness-75"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border-4 border-white shadow-md">
          <Image
            src={restaurant.avatar || '/images/default-restaurant-avatar.jpg'}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="flex-1 text-white">
          <h1 className="text-3xl font-bold mb-1">{restaurant.name}</h1>
          <div className="flex flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-1 text-sm">
              <MapPinIcon className="h-4 w-4" />
              <span>{`${restaurant.address?.street }, ${restaurant.address?.ward}, ${restaurant.address?.district}, ${restaurant.address?.city}`}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ClockIcon className="h-4 w-4" />
              <span>{restaurant.openTime} - {restaurant.closeTime}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <PhoneIcon className="h-4 w-4" />
              <span>{restaurant.phoneNumber}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge className="bg-green-500 hover:bg-green-600">Thời gian giao hàng: {restaurant.deliveryTime} phút</Badge>
            <Badge className="bg-blue-500 hover:bg-blue-600">Khoảng cách: {restaurant.distance} Km</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}