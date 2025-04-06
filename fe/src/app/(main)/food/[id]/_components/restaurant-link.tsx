import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface RestaurantLinkProps {
  restaurantId: string;
  restaurantName: string;
}

const RestaurantLink = ({ restaurantId, restaurantName }: RestaurantLinkProps) => {
  return (
    <div className="mt-12 mb-8">
      <Link href={`/restaurant/${restaurantId}`} className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{restaurantName}</h3>
            <p className="text-gray-600">Xem thêm món ăn từ nhà hàng này</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </Link>
    </div>
  );
};

export default RestaurantLink;