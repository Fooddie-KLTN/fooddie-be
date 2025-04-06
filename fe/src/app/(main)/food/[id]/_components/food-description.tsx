import React from 'react';

interface FoodDescriptionProps {
  description: string;
}

const FoodDescription = ({ description }: FoodDescriptionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Mô tả</h2>
      <p className="text-gray-700">{description}</p>
    </div>
  );
};

export default FoodDescription;