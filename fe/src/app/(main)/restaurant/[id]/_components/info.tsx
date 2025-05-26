import { ClockIcon, MapPinIcon, PhoneIcon, CalendarIcon } from 'lucide-react';
import { Restaurant } from '@/interface';

interface RestaurantInfoProps {
  restaurant: Restaurant;
}

export function RestaurantInfo({ restaurant }: RestaurantInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-bold mb-3">Thông tin nhà hàng</h2>
      <p className="text-gray-700 mb-4">{restaurant.description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">Giờ mở cửa</p>
            <p className="font-medium">{restaurant.openTime} - {restaurant.closeTime}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">Địa chỉ</p>
            <p className="font-medium">{`${restaurant.address?.street }, ${restaurant.address?.ward}, ${restaurant.address?.district}, ${restaurant.address?.city}`}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <PhoneIcon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">Điện thoại</p>
            <p className="font-medium">{restaurant.phoneNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">Thời gian giao hàng</p>
            <p className="font-medium">{restaurant.deliveryTime} phút</p>
          </div>
        </div>
      </div>
    </div>
  );
}