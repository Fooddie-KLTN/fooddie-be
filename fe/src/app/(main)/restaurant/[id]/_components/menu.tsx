import { FoodPreview } from '@/interface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import FoodRow from '../../../_components/ui/food-row';

interface RestaurantMenuProps {
  foods: FoodPreview[];
  formatPrice: (price: number) => string;
}

export function RestaurantMenu({ foods, formatPrice }: RestaurantMenuProps) {
  // Sort foods by different criteria for different rows
  const mostSoldFoods = [...foods].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
  const discountedFoods = foods.filter(food => food.discountPercent && food.discountPercent > 0);
  const popularFoods = foods.filter(food => food.popular);

  return (
    <div className="mt-8 space-y-4">
      <Tabs defaultValue="all" className="mb-10">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="popular">Phổ biến</TabsTrigger>
          <TabsTrigger value="discounted">Khuyến mãi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-10">
          <FoodRow 
            name="Món ăn bán chạy" 
            foods={mostSoldFoods} 
            formatPrice={formatPrice} 
            maxItems={5}
          />
          
          {discountedFoods.length > 0 && (
            <FoodRow 
              name="Đang giảm giá" 
              foods={discountedFoods} 
              formatPrice={formatPrice} 
              maxItems={5}
            />
          )}
          
          {popularFoods.length > 0 && (
            <FoodRow 
              name="Món ăn được yêu thích" 
              foods={popularFoods} 
              formatPrice={formatPrice} 
              maxItems={5}
            />
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-6">
          <FoodRow 
            name="Món ăn được yêu thích" 
            foods={popularFoods} 
            formatPrice={formatPrice} 
            maxItems={5}
          />
        </TabsContent>
        
        <TabsContent value="discounted" className="space-y-6">
          <FoodRow 
            name="Đang giảm giá" 
            foods={discountedFoods} 
            formatPrice={formatPrice} 
            maxItems={5}
          />
        </TabsContent>
      </Tabs>
      
      <div className="text-center mt-10 pb-6">
        <Button className="bg-primary hover:bg-primary/90 px-6 py-2">
          Xem tất cả món ăn
        </Button>
      </div>
    </div>
  );
}