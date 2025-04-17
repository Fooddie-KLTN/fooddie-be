import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Store } from 'lucide-react';

interface RestaurantLinkProps {
  restaurantId: string;
  restaurantName: string;
  restaurantImage?: string; // Optional restaurant avatar URL
  restaurantDescription?: string; // Optional restaurant description
}

const RestaurantLink = ({ 
  restaurantId, 
  restaurantName, 
  restaurantImage, 
  restaurantDescription = "Xem thêm món ăn từ nhà hàng này" // Default description if none provided
}: RestaurantLinkProps) => {
  return (
    <div className="mt-12 mb-8">
      <Link href={`/restaurant/${restaurantId}`} className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {restaurantImage ? (
                <Image 
                  src={restaurantImage} 
                  alt={restaurantName}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{restaurantName}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{restaurantDescription}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </Link>
    </div>
  );
};

export default RestaurantLink;