import { Button } from "@/components/ui/button";
import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import FoodCard from "../food-card";
import { useRef } from "react";
import { FoodPreview } from "@/interface";

interface FoodRowProps {
  foods: FoodPreview[];
  formatPrice: (price: number) => string;
  name: string;
  maxItems?: number;
  viewAllLink?: string;
}

export default function FoodRow({ 
  foods, 
  formatPrice, 
  name, 
  maxItems = 4,
  viewAllLink 
}: FoodRowProps) {
  const displayFoods = foods.length > maxItems ? foods : foods.slice(0, maxItems);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{name}</h2>
        
        <div className="flex items-center gap-2">
          {/* Scroll controls */}
          <div className="hidden md:flex gap-2">
            <Button 
              onClick={scrollLeft} 
              variant="outline" 
              size="icon" 
              className="rounded-full h-8 w-8"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <Button 
              onClick={scrollRight} 
              variant="outline" 
              size="icon" 
              className="rounded-full h-8 w-8"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {viewAllLink && foods.length > maxItems && (
            <Link href={viewAllLink}>
              <Button variant="ghost" className="text-primary flex items-center">
                View all <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="relative px-5">
        {foods.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory scrollbar-hide scroll-smooth"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {displayFoods.map((food) => (
              <div 
                key={food.id} 
                className="min-w-[280px] snap-start transition-transform duration-300 hover:scale-[1.02]"
              >
                <FoodCard food={food} formatPrice={formatPrice} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-500">No food items found in this category.</p>
          </div>
        )}
        
        {/* Gradient fade effects */}
        <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
}