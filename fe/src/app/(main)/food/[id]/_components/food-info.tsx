import React from 'react';
import { Star } from 'lucide-react';

interface FoodBasicInfoProps {
  name: string;
  starReview: number;
  purchasedNumber: number;
  categoryName: string;
}

const FoodBasicInfo = ({ name, starReview, purchasedNumber, categoryName }: FoodBasicInfoProps) => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">{name}</h1>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
          <span>{starReview}</span>
          <span className="mx-1">•</span>
          <span>{purchasedNumber}+ đã mua</span>
        </div>
        <div className="text-sm text-gray-500">
          {categoryName}
        </div>
      </div>
    </>
  );
};

export default FoodBasicInfo;