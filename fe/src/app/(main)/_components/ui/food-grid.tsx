import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import FoodCard from "../food-card";
import { FoodPreview } from "@/interface/index";

interface FoodGridProps {
  foods: FoodPreview[];
  formatPrice: (price: number) => string;
  name: string;
}

export default function FoodGrid({ foods, formatPrice, name }: FoodGridProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{name}</h2>
        <div className="flex items-center">
          <Button variant="outline" className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {foods.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-6">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} formatPrice={formatPrice} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No food items found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}