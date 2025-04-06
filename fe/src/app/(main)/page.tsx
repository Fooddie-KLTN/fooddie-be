/**
 * @component Home
 * @description Trang chủ của ứng dụng Food Delivery, hiển thị các phần chính của giao diện người dùng.
 */

"use client";

import { useState } from "react";

import CategorySection from "./_components/ui/category";
import FoodGrid from "./_components/ui/food-grid";
import HeroSection from "./_components/ui/hero-section";
import PromotionSection from "./_components/ui/promotion";
import FoodRow from "./_components/ui/food-row";
import { FoodPreview, Category, Restaurant } from "@/interface";
import RestaurantCard from "./_components/restaurant-card";

// Dữ liệu mẫu cho danh mục món ăn
const foodCategories: Category[] = [
  { id: "1", name: "Burgers", icon: "🍔" },
  { id: "2", name: "Pizza", icon: "🍕" },
  { id: "3", name: "Sushi", icon: "🍣" },
  { id: "4", name: "Pasta", icon: "🍝" },
  { id: "5", name: "Món tráng miệng", icon: "🍰" },
  { id: "6", name: "Đồ uống", icon: "🥤" },
];
// Sample data for restaurants and their food items
const sampleRestaurants: Restaurant[] = [
  {
    id: "hub-1",
    name: "Burger Hub",
    description: "Nơi phục vụ burger ngon nhất thành phố.",
    distance: "1.5 km",
    deliveryTime: "15-25",
  },
  {
    id: "palace-1",
    name: "Pizza Palace",
    description: "Pizza truyền thống với hương vị tuyệt vời.",
    distance: "2.0 km",
    deliveryTime: "20-35",
  },
  {
    id: "sushi-1",
    name: "Sushi Master",
    description: "Sushi tươi ngon, được làm từ nguyên liệu chất lượng.",
    distance: "1.8 km",
    deliveryTime: "25-40",
  },
];

// Sample food items for each restaurant
const sampleFoodItems: FoodPreview[] = [
  {
    id: "1",
    name: "Hamburger Phô Mai Cổ Điển",
    description: "Bánh burger bò với phô mai cheddar.",
    price: 89000,
    image: "https://source.unsplash.com/random/300x200/?cheeseburger",
    category: { id: "1", name: "Burgers" },
    rating: 4.8,
    popular: true,
    restaurant: { id: "hub-1", name: "Burger Hub", deliveryTime: "15-25" },
    status: "available"
  },
  {
    id: "2",
    name: "Pizza Margherita",
    description: "Pizza truyền thống với sốt cà chua và phô mai mozzarella.",
    price: 120000,
    image: "https://source.unsplash.com/random/300x200/?pizza",
    category: { id: "2", name: "Pizza" },
    rating: 4.5,
    popular: true,
    restaurant: { id: "palace-1", name: "Pizza Palace", deliveryTime: "20-35" },
    status: "available"
  },
  {
    id: "3",
    name: "Combo Sushi",
    description: "Hỗn hợp nigiri và cuộn maki tươi.",
    price: 180000,
    image: "https://source.unsplash.com/random/300x200/?sushi",
    category: { id: "3", name: "Sushi" },
    rating: 4.9,
    popular: true,
    restaurant: { id: "sushi-1", name: "Sushi Master", deliveryTime: "25-40" },
    status: "available"
  },
];
// Convert sample foods to use the FoodPreview interface
const sampleFoods: FoodPreview[] = [
  {
    id: "1",
    name: "Hamburger Phô Mai Cổ Điển",
    description: "Bánh burger bò với phô mai cheddar, rau xà lách, cà chua và sốt đặc biệt",
    price: 89000,
    image: "https://source.unsplash.com/random/300x200/?cheeseburger",
    category: { id: "1", name: "Burgers" },
    rating: 4.8,
    popular: true,
    restaurant: {
      id: "hub-1",
      name: "Burger Hub",
      deliveryTime: "15-25"
    },
    status: "available"
  },
  {
    id: "2",
    name: "Pizza Margherita",
    description: "Pizza truyền thống với sốt cà chua, phô mai mozzarella và lá húng quế",
    price: 120000,
    image: "https://source.unsplash.com/random/300x200/?pizza",
    category: { id: "2", name: "Pizza" },
    rating: 4.5,
    popular: true,
    restaurant: {
      id: "palace-1",
      name: "Pizza Palace",
      deliveryTime: "20-35"
    },
    status: "available"
  },
  {
    id: "3",
    name: "Combo Sushi",
    description: "Hỗn hợp nigiri và cuộn maki tươi với wasabi và nước tương",
    price: 180000,
    image: "https://source.unsplash.com/random/300x200/?sushi",
    category: { id: "3", name: "Sushi" },
    rating: 4.9,
    popular: true,
    restaurant: {
      id: "sushi-1",
      name: "Sushi Master",
      deliveryTime: "25-40"
    },
    status: "available"
  },
  {
    id: "4",
    name: "Mì Ý Carbonara",
    description: "Mì Ý cổ điển với trứng, phô mai, thịt xông khói và tiêu đen",
    price: 110000,
    image: "https://source.unsplash.com/random/300x200/?pasta",
    category: { id: "4", name: "Pasta" },
    rating: 4.7,
    popular: false,
    restaurant: {
      id: "pasta-1",
      name: "Pasta Perfecto",
      deliveryTime: "20-30"
    },
    status: "available"
  },
  {
    id: "5",
    name: "Tiramisu",
    description: "Món tráng miệng Ý với bánh quy tẩm cà phê và kem mascarpone",
    price: 65000,
    image: "https://source.unsplash.com/random/300x200/?tiramisu",
    category: { id: "5", name: "Dessert" },
    rating: 4.6,
    popular: true,
    restaurant: {
      id: "sweet-1",
      name: "Sweet Treats",
      deliveryTime: "15-25"
    },
    status: "available"
  },
  {
    id: "6",
    name: "Trà Sữa Trân Châu",
    description: "Trà sữa với trân châu và si-rô đường nâu",
    price: 45000,
    image: "https://source.unsplash.com/random/300x200/?bubbletea",
    category: { id: "6", name: "Drinks" },
    rating: 4.4,
    popular: false,
    restaurant: {
      id: "bubble-1",
      name: "Bubble Tea House",
      deliveryTime: "10-20"
    },
    status: "available"
  },
];

// Dữ liệu mẫu cho nhà hàng gần đây
const sampleNearbyFoods: FoodPreview[] = [
  {
    id: "101",
    name: "Bánh Mì Thịt",
    description: "Bánh mì Việt Nam với thịt heo nướng, rau củ ngâm chua và rau thơm",
    price: 35000,
    image: "https://source.unsplash.com/random/300x200/?banhmi",
    category: { id: "7", name: "Vietnamese" },
    rating: 4.7,
    popular: true,
    restaurant: {
      id: "banhmi-1",
      name: "Bánh Mì Express",
      deliveryTime: "10-20",
      distance: "0.5 km"
    },
    status: "available"
  },
  {
    id: "102",
    name: "Phở Bò",
    description: "Súp phở bò truyền thống với rau thơm và giá đỗ",
    price: 65000,
    image: "https://source.unsplash.com/random/300x200/?pho",
    category: { id: "7", name: "Vietnamese" },
    rating: 4.9,
    popular: true,
    restaurant: {
      id: "pho-1",
      name: "Phở House",
      deliveryTime: "15-25",
      distance: "0.7 km"
    },
    status: "available"
  },
  {
    id: "103",
    name: "Bún Chả",
    description: "Thịt lợn nướng với bún, rau thơm và nước chấm",
    price: 70000,
    image: "https://source.unsplash.com/random/300x200/?buncha",
    category: { id: "7", name: "Vietnamese" },
    rating: 4.8,
    popular: false,
    restaurant: {
      id: "hanoi-1",
      name: "Hanoi Kitchen",
      deliveryTime: "20-30",
      distance: "1.2 km"
    },
    status: "available"
  },
  {
    id: "104",
    name: "Cơm Tấm",
    description: "Cơm tấm với thịt heo nướng, trứng và nước mắm",
    price: 55000,
    image: "https://source.unsplash.com/random/300x200/?brokemrice",
    category: { id: "7", name: "Vietnamese" },
    rating: 4.6,
    popular: true,
    restaurant: {
      id: "saigon-1",
      name: "Saigon Corner",
      deliveryTime: "15-25",
      distance: "1.5 km"
    },
    status: "available"
  },
];

// Dữ liệu mẫu cho món ăn bán chạy
const sampleTopSellingFoods: FoodPreview[] = [
  {
    id: "201",
    name: "Burger Gà Cay",
    description: "Thịt gà giòn với sốt cay và dưa chua",
    price: 95000,
    image: "https://source.unsplash.com/random/300x200/?chickenburger",
    category: { id: "1", name: "Burgers" },
    rating: 4.9,
    popular: true,
    restaurant: {
      id: "burger-2",
      name: "Burger Joint",
      deliveryTime: "15-25"
    },
    purchasedNumber: 1250,
    status: "available"
  },
  {
    id: "202",
    name: "Pizza Pepperoni",
    description: "Pizza pepperoni cổ điển với phô mai thêm",
    price: 135000,
    image: "https://source.unsplash.com/random/300x200/?pepperonipizza",
    category: { id: "2", name: "Pizza" },
    rating: 4.8,
    popular: true,
    restaurant: {
      id: "pizza-2",
      name: "Pizza Hub",
      deliveryTime: "20-35"
    },
    purchasedNumber: 980,
    status: "available"
  },
  {
    id: "203",
    name: "Pad Thái",
    description: "Mì xào với tôm, đậu hũ và đậu phộng",
    price: 90000,
    image: "https://source.unsplash.com/random/300x200/?padthai",
    category: { id: "8", name: "Thai" },
    rating: 4.7,
    popular: true,
    restaurant: {
      id: "thai-1",
      name: "Thai Bistro",
      deliveryTime: "25-40"
    },
    purchasedNumber: 870,
    status: "available"
  },
  {
    id: "204",
    name: "Tacos Bò",
    description: "Bánh tortilla ngô với thịt bò, salsa và guacamole",
    price: 75000,
    image: "https://source.unsplash.com/random/300x200/?tacos",
    category: { id: "9", name: "Mexican" },
    rating: 4.6,
    popular: true,
    restaurant: {
      id: "taco-1",
      name: "Taco House",
      deliveryTime: "15-30"
    },
    purchasedNumber: 750,
    status: "available"
  },
];


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
  const [foods] = useState<FoodPreview[]>(sampleFoods);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter by category - updated to handle the new category object structure
  const filteredFoods = activeCategory === "All"
    ? foods
    : foods.filter(food => food.category?.name === activeCategory);

  const getFoodsByRestaurantId = (restaurantId: string) => {
    return sampleFoodItems.filter(food => food.restaurant.id === restaurantId);
  };
  // Filter by search query
  const searchedFoods = searchQuery
    ? filteredFoods.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : filteredFoods;

  // Format price to VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <>
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="container mx-auto px-4 py-10">

        <PromotionSection promotions={promotions} />

        <h1 className="text-2xl font-bold mb-6">Restaurants</h1>
        <div className="container mx-auto px-4 py-8">
          <RestaurantCard
            restaurants={sampleRestaurants}
            getFoods={getFoodsByRestaurantId}
          />
        </div>
        <FoodRow
          foods={sampleTopSellingFoods}
          formatPrice={formatPrice}
          name="Nổi tiếng"
          viewAllLink="/foods"
        />

        <FoodRow
          foods={sampleNearbyFoods}
          formatPrice={formatPrice}
          name="Gần đây"
          viewAllLink="/foods"
        />

        <CategorySection
          categories={foodCategories}
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
