import { Card } from "@/components/ui/card";
import { StarIcon, MapPinIcon, ClockIcon } from "lucide-react";

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  popular: boolean;
  restaurant: string;
  deliveryTime: string;
}

interface FoodCardProps {
  food: Food;
  formatPrice: (price: number) => string;
}

export default function FoodCard({ food, formatPrice }: FoodCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
        {food.popular && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded-md">
            Popular
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{food.name}</h3>
          <div className="flex items-center gap-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">{food.rating}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{food.description}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-primary">{formatPrice(food.price)}</span>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPinIcon className="h-3 w-3" /> {food.restaurant}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <ClockIcon className="h-3 w-3" /> {food.deliveryTime} mins
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}