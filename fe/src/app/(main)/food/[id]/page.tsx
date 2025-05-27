"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from "@/context/cart-context";
import { Card } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

import ActionButtons from './_components/action';
import FoodDescription from './_components/food-description';
import FoodHeader from './_components/food-header';
import FoodImage from './_components/food-image';
import FoodBasicInfo from './_components/food-info';
import PriceSection from './_components/price';
import RestaurantInfo from './_components/restaurant-info';
import RestaurantLink from './_components/restaurant-link';
import LoadingState from './_components/loading';
import FoodRow from '../../_components/ui/food-row';
import { FoodDetail, FoodPreview } from '@/interface';
import ReviewsSection from './_components/review';
import { guestService } from '@/api/guest';



export default function FoodDetailPage() {
  const params = useParams();
  const foodId = params.id as string;
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [sameRestaurant, setSameRestaurant] = useState<FoodPreview[]>([]);
  const [sameCategory, setSameCategory] = useState<FoodPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFood = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Find food in sample data instead of making API call
        const foundFood = await guestService.food.getFoodById(foodId);
        const sameCategoryFoods = await guestService.food.getFoodsByCategory(foundFood.category.id, 1, 4);
        const sameRestaurantFoods = await guestService.food.getFoodsByRestaurant(foundFood.restaurant.id, 1, 4);
        if (foundFood) {
          setFood(foundFood);
          setSameCategory(sameCategoryFoods.items || []);
          setSameRestaurant(sameRestaurantFoods.items || []);
        } else {
          setFood(null);
        }
        

        setLoading(false);
      } catch (error) {
        console.error('Error fetching food:', error);
        setLoading(false);
      }
    };

    if (foodId) {
      fetchFood();
    }
  }, [foodId]);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddToCart = () => {
    if (food && food.id) {
      
      // Passing the food ID as expected by addToCart
      addToCart(food.id);
    }
  };

  const handleBuyNow = () => {
    if (food) {
      // Add to cart and redirect to checkout
      handleAddToCart();
      window.location.href = "/checkout";
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  if (loading) {
    return <LoadingState />;
  }

  if (!food) {
    return (
      <div className="container mx-auto px-4 py-10 min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy món ăn</h2>
          <p className="text-gray-500 mb-6">Món ăn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link href="/food">
            <Button className="food-button w-full">Xem danh sách món ăn</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <FoodHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Food Image Section */}
        <FoodImage
          imageUrls={food.imageUrls || [food.image]}
          name={food.name}
          status={food.status}
          discountPercent={food.discountPercent}
        />

        {/* Food Details Section */}
        <div>
          <FoodBasicInfo
            name={food.name}
            starReview={food.rating || 0}
            purchasedNumber={food.purchasedNumber || 0}
            categoryName={food.category.name}
          />

          <RestaurantInfo
            restaurantName={food.restaurant.name}
            deliveryTime={food.restaurant.deliveryTime}
          />

          <FoodDescription description={food.description} />

          <div className="border-t pt-6">
            <PriceSection
              price={Number(food.price)}
              discountPercent={food.discountPercent || 0}
              quantity={quantity}
              onIncrement={incrementQuantity}
              onDecrement={decrementQuantity}
              formatPrice={formatPrice}
            />

            <ActionButtons
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>



        </div>
      </div>
      <ReviewsSection
        rating={food.rating || 0}
        foodId={foodId}
      />
      <RestaurantLink
        restaurantId={food.restaurant.id}
        restaurantName={food.restaurant.name}
        restaurantImage={food.image} // Using food image for now as sample data doesn't have restaurant image
        restaurantDescription={`${food.restaurant.name} là nhà hàng chuyên phục vụ các món ${food.category.name} ngon và chất lượng. Thời gian giao hàng trung bình: ${food.restaurant.deliveryTime} phút.`}
      />
      {/* Add the new sections here */}
      <div className="mt-12">
        <FoodRow
          foods={sameRestaurant}
          formatPrice={formatPrice}
          name={`Món khác từ ${food.restaurant.name}`}
          maxItems={4}
          viewAllLink={`/restaurant/${food.restaurant.id}`}
        />

        <FoodRow
          foods={sameCategory}
          formatPrice={formatPrice}
          name={`Món ${food.category.name} tương tự`}
          maxItems={4}
          viewAllLink={`/category/${food.category.id}`}
        />
      </div>
    </div>
  );
}