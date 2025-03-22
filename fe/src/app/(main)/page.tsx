/**
 * @component Home
 * @description Trang chủ của ứng dụng Food Delivery, hiển thị các phần chính của giao diện người dùng.
 */

"use client";

import { useState } from "react";

import CategorySection from "./_components/ui/category";
import FoodGrid from "./_components/ui/food-grid";
import HeroSection from "./_components/hero-section";
import PromotionSection from "./_components/ui/promotion";

// Sample food data
const foodCategories = [
  { id: 1, name: "Burgers", icon: "🍔" },
  { id: 2, name: "Pizza", icon: "🍕" },
  { id: 3, name: "Sushi", icon: "🍣" },
  { id: 4, name: "Pasta", icon: "🍝" },
  { id: 5, name: "Dessert", icon: "🍰" },
  { id: 6, name: "Drinks", icon: "🥤" },
];

const sampleFoods = [
  {
    id: 1,
    name: "Classic Cheeseburger",
    description: "Beef patty with cheddar cheese, lettuce, tomato, and special sauce",
    price: 89000,
    image: "https://source.unsplash.com/random/300x200/?cheeseburger",
    category: "Burgers",
    rating: 4.8,
    popular: true,
    restaurant: "Burger Hub",
    deliveryTime: "15-25",
  },
  {
    id: 2,
    name: "Margherita Pizza",
    description: "Traditional pizza with tomato sauce, mozzarella, and basil",
    price: 120000,
    image: "https://source.unsplash.com/random/300x200/?pizza",
    category: "Pizza",
    rating: 4.5,
    popular: true,
    restaurant: "Pizza Palace",
    deliveryTime: "20-35",
  },
  {
    id: 3,
    name: "Sushi Combo",
    description: "Mix of fresh nigiri and maki rolls with wasabi and soy sauce",
    price: 180000,
    image: "https://source.unsplash.com/random/300x200/?sushi",
    category: "Sushi",
    rating: 4.9,
    popular: true,
    restaurant: "Sushi Master",
    deliveryTime: "25-40",
  },
  {
    id: 4,
    name: "Spaghetti Carbonara",
    description: "Classic pasta with eggs, cheese, bacon, and black pepper",
    price: 110000,
    image: "https://source.unsplash.com/random/300x200/?pasta",
    category: "Pasta",
    rating: 4.7,
    popular: false,
    restaurant: "Pasta Perfecto",
    deliveryTime: "20-30",
  },
  {
    id: 5,
    name: "Tiramisu",
    description: "Italian dessert with coffee-soaked ladyfingers and mascarpone cream",
    price: 65000,
    image: "https://source.unsplash.com/random/300x200/?tiramisu",
    category: "Dessert",
    rating: 4.6,
    popular: true,
    restaurant: "Sweet Treats",
    deliveryTime: "15-25",
  },
  {
    id: 6,
    name: "Bubble Milk Tea",
    description: "Milk tea with tapioca pearls and brown sugar syrup",
    price: 45000,
    image: "https://source.unsplash.com/random/300x200/?bubbletea",
    category: "Drinks",
    rating: 4.4,
    popular: false,
    restaurant: "Bubble Tea House",
    deliveryTime: "10-20",
  },
];

const promotions = [
  {
    id: 1,
    title: "Free Delivery",
    description: "On all orders over 150k",
    image: "https://source.unsplash.com/random/600x300/?delivery",
    code: "FREEDEL",
  },
  {
    id: 2,
    title: "50% Off Your First Order",
    description: "New users get 50% discount",
    image: "https://source.unsplash.com/random/600x300/?discount",
    code: "WELCOME50",
  },
];

export default function Home() {
  const [foods, setFoods] = useState(sampleFoods);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter foods by category
  const filteredFoods = activeCategory === "All" 
    ? foods 
    : foods.filter(food => food.category === activeCategory);

  // Filter by search query
  const searchedFoods = searchQuery 
    ? filteredFoods.filter(food => 
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredFoods;

  // Format price to VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <>
      <HeroSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="container mx-auto px-4 py-10">
        <CategorySection 
          categories={foodCategories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <PromotionSection promotions={promotions} />

        <FoodGrid 
          foods={searchedFoods}
          formatPrice={formatPrice}
        />
      </div>
    </>
  );
}