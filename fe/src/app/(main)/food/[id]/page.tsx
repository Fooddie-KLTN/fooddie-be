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
import { FoodDetail } from '@/interface';
import ReviewsSection from './_components/review';

// Sample Foods data for mocking API calls
const sampleFoods: FoodDetail[] = [
  {
    id: "1",
    name: "Bún Bò Huế Đặc Biệt",
    description: "Bún bò Huế đặc biệt với nước dùng đậm đà, thịt bò mềm, giò heo giòn, chả cua thơm ngon, ăn kèm rau sống và bánh mì.",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3"],
    price: 75000,
    status: "available",
    category: {
      id: "c1",
      name: "Món Việt"
    },
    discountPercent: 10,
    purchasedNumber: 120,
    restaurant: {
      id: "r1",
      name: "Nhà hàng Hương Việt",
      deliveryTime: "30",
      owner: undefined
    },
    soldCount: 100,
    rating: 4.7,
  },
  {
    id: "2",
    name: "Pizza Hải Sản Đặc Biệt",
    description: "Pizza hải sản với đế bánh mỏng giòn, phủ sốt cà chua đặc biệt, phô mai Mozzarella, tôm, mực và các loại hải sản tươi ngon.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1014&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3"],
    price: 189000,
    status: "popular",
    category: {
      id: "c2",
      name: "Pizza"
    },
    discountPercent: 15,
    purchasedNumber: 258,
    restaurant: {
      id: "r2",
      name: "Pizza Express",
      deliveryTime: "45",
      owner: undefined
    },
    soldCount: 150,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Gà Rán Sốt Cay",
    description: "Gà rán giòn thơm phủ sốt cay Hàn Quốc, ăn kèm khoai tây chiên và salad tươi.",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3"],
    price: 99000,
    status: "available",
    category: {
      id: "c3",
      name: "Đồ Ăn Nhanh"
    },
    discountPercent: 0,
    purchasedNumber: 198,
    restaurant: {
      id: "r3",
      name: "Chicken & Chips",
      deliveryTime: "25",
      owner: undefined
    },
    soldCount: 75,
    rating: 4.5,
  },
  {
    id: "4",
    name: "Phở Bò Tái Nạm",
    description: "Phở bò truyền thống với nước dùng xương hầm 24 giờ, bánh phở mềm dai, thịt bò tái và nạm mềm, kèm rau thơm và gia vị.",
    image: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?ixlib=rb-4.0.3",
    imageUrls: ["https://images.unsplash.com/photo-1503764654157-72d979d9af2f?ixlib=rb-4.0.3"],
    price: 65000,
    status: "popular",
    category: {
      id: "c1",
      name: "Món Việt"
    },
    discountPercent: 5,
    purchasedNumber: 234,
    restaurant: {
      id: "r1",
      name: "Nhà hàng Hương Việt",
      deliveryTime: "30",
      owner: undefined
    },
    soldCount: 120,
    rating: 4.8,
  },
  {
    id: "5",
    name: "Cơm Tấm Sườn Bì Chả",
    description: "Cơm tấm với sườn nướng thơm lừng, bì heo giòn dai, chả trứng mềm, kèm đồ chua và nước mắm truyền thống.",
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?ixlib=rb-4.0.3",
    imageUrls: ["https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?ixlib=rb-4.0.3"],
    price: 85000,
    status: "available",
    category: {
      id: "c1",
      name: "Món Việt"
    },
    discountPercent: 0,
    purchasedNumber: 175,
    restaurant: {
      id: "r1",
      name: "Nhà hàng Hương Việt",
      deliveryTime: "30",
      owner: undefined
    },
    soldCount: 80,
    rating: 4.6,
  },
  {
    id: "6",
    name: "Pizza Bò & Phô Mai",
    description: "Pizza với đế giòn, sốt cà chua đậm đà, phô mai Mozzarella, thịt bò xay, hành tây và ớt chuông.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3",
    imageUrls: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3"],
    price: 169000,
    status: "available",
    category: {
      id: "c2",
      name: "Pizza"
    },
    discountPercent: 10,
    purchasedNumber: 145,
    restaurant: {
      id: "r2",
      name: "Pizza Express",
      deliveryTime: "45",
      owner: undefined
    },
    soldCount: 70,
    rating: 4.5,
  },
  {
    id: "7",
    name: "Hamburger Bò Phô Mai",
    description: "Hamburger với bánh mì nướng, thịt bò Úc 100%, phô mai Cheddar, rau xà lách, cà chua và sốt đặc biệt.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3",
    imageUrls: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3"],
    price: 89000,
    status: "popular",
    category: {
      id: "c3",
      name: "Đồ Ăn Nhanh"
    },
    discountPercent: 0,
    purchasedNumber: 210,
    restaurant: {
      id: "r3",
      name: "Chicken & Chips",
      deliveryTime: "25",
      owner: undefined
    },
    soldCount: 95,
    rating: 4.6,
  },
  {
    id: "8",
    name: "Bánh Mì Thịt Nướng",
    description: "Bánh mì giòn với thịt heo nướng, pate, rau thơm, đồ chua và sốt tương ớt truyền thống.",
    image: "https://images.unsplash.com/photo-1633896949673-1eb9d131a9b4?ixlib=rb-4.0.3",
    imageUrls: ["https://images.unsplash.com/photo-1633896949673-1eb9d131a9b4?ixlib=rb-4.0.3"],
    price: 45000,
    status: "available",
    category: {
      id: "c1",
      name: "Món Việt"
    },
    discountPercent: 0,
    purchasedNumber: 256,
    restaurant: {
      id: "r4",
      name: "Tiệm Bánh Việt Nam",
      deliveryTime: "20",
      owner: undefined
    },
    soldCount: 110,
    rating: 4.7,
  },
  {
    id: "9",
    name: "Mì Ý Sốt Bò Bằm",
    description: "Mì Ý spaghetti với sốt bò bằm thơm ngon, cà chua, hương thảo và phô mai Parmesan.",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3",
    imageUrls: ["https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3"],
    price: 129000,
    status: "available",
    category: {
      id: "c4",
      name: "Món Ý"
    },
    discountPercent: 5,
    purchasedNumber: 98,
    restaurant: {
      id: "r2",
      name: "Pizza Express",
      deliveryTime: "45",
      owner: undefined
    },
    soldCount: 45,
    rating: 4.4,
  }
];

export default function FoodDetailPage() {
  const params = useParams();
  const foodId = params.id as string;
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [sameRestaurant, setSameRestaurant] = useState<FoodDetail[]>([]);
  const [sameCategory, setSameCategory] = useState<FoodDetail[]>([]);
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
        const foundFood = sampleFoods.find(item => item.id === foodId);

        if (foundFood) {
          setFood(foundFood);
        } else {
          setFood(null);
        }
        // Set similar foods based on restaurant and category
        setSameRestaurant(sampleFoods.filter(item => item.restaurant.id === foundFood?.restaurant.id && item.id !== foodId));
        setSameCategory(sampleFoods.filter(item => item.category.id === foundFood?.category.id && item.id !== foodId));

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
              price={food.price}
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