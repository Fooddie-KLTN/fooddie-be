"use client";

import { useState, useMemo, useEffect } from "react";
import CategorySection from "./_components/ui/category";
import FoodGrid from "./_components/ui/food-grid";
import HeroSection from "./_components/ui/hero-section";
import PromotionSection from "./_components/ui/promotion";
import FoodRow from "./_components/ui/food-row";
import { FoodPreview, Category, Restaurant } from "@/interface";
import RestaurantCard from "./_components/restaurant-card";
import { guestService } from "@/api/guest";
import { useGeo } from "@/context/geolocation-context";

const promotions = [
  {
    id: 1,
    title: "Miễn Phí Giao Hàng",
    description: "Cho đơn hàng trên 150k",
    image: "https://source.unsplash.com/random/600x300/?delivery",
    code: "FREEDEL",
  },
  {
    id: 2,
    title: "Giảm 50% Đơn Hàng Đầu Tiên",
    description: "Người dùng mới được giảm 50%",
    image: "https://source.unsplash.com/random/600x300/?discount",
    code: "WELCOME50",
  },
];

export default function Home() {
  const { location} = useGeo();

  const [foods, setFoods] = useState<FoodPreview[]>([]);
  const [topSellingFoods, setTopSellingFoods] = useState<FoodPreview[]>([]);
  const [nearbyFoods, setNearbyFoods] = useState<FoodPreview[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          foodsRes,
          topSellingRes,
          nearbyRes,
          restaurantsRes,
          categoriesRes
        ] = await Promise.all([
          guestService.food.getFoodsWithQuerry(1, 20, location?.lat || 10.7769, location?.lng || 106.6951),
          guestService.food.getTopSellingFoods(1, 8, location?.lat || 10.7769, location?.lng || 106.6951),
          guestService.food.getFoodsWithQuerry(1, 20, location?.lat, location?.lng), 
          guestService.restaurant.getPopularRestaurants( location?.lat || 10.7769, location?.lng || 106.6951),
          guestService.category.getCategories(1, 20)
        ]);
        setFoods(foodsRes.items);
        setTopSellingFoods(topSellingRes.items);
        setNearbyFoods(nearbyRes.items);
        setRestaurants(restaurantsRes.items);
        setCategories(categoriesRes.items);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setFoods([]);
        setTopSellingFoods([]);
        setNearbyFoods([]);
        setRestaurants([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter by category
  const filteredFoods = useMemo(
    () =>
      activeCategory === "All"
        ? foods
        : foods.filter((food) => food.category?.name === activeCategory),
    [foods, activeCategory]
  );

  // Filter by search query
  const searchedFoods = useMemo(
    () =>
      searchQuery
        ? filteredFoods.filter(
          (food) =>
            food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredFoods,
    [filteredFoods, searchQuery]
  );

  // Get foods by restaurant id
  const getFoodsByRestaurantId = (restaurantId: string) => {
    return foods.filter((food) => food.restaurant.id === restaurantId);
  };

  // Format price to VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <>
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="container mx-auto px-4 py-10">
        <PromotionSection promotions={promotions} />

        <h1 className="text-2xl font-bold mb-6">Restaurants</h1>
        <div className="container mx-auto px-4 py-8">
          <RestaurantCard restaurants={restaurants} getFoods={getFoodsByRestaurantId} />
        </div>
        <FoodRow
          foods={topSellingFoods}
          formatPrice={formatPrice}
          name="Nổi tiếng"
          viewAllLink="/foods"
        />

        <FoodRow
          foods={nearbyFoods}
          formatPrice={formatPrice}
          name="Gần đây"
          viewAllLink="/foods"
        />

        <CategorySection
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <FoodGrid
          name={activeCategory === "All" ? "Tất cả món ăn" : activeCategory}
          foods={searchedFoods}
          formatPrice={formatPrice}
        />
      </div>
    </>
  );
}