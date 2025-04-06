export enum RestaurantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Category {
  id?: string;
  name: string;
  icon?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  phoneNumber?: string;
  backgroundImage?: string;
  address?: string;
  avatar?: string;
  description?: string;
  openTime?: string;
  closeTime?: string;
  status?: RestaurantStatus;
  latitude?: number;
  longitude?: number;
  distance?: string; // Frontend-only calculated field
  deliveryTime?: string; // Frontend-only calculated field
}

/**
 * Food preview interface for lists, cards, and rows
 */
export interface FoodPreview {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  discountPercent?: number;
  status?: string;
  tag?: string;
  preparationTime?: number;
  rating?: number;
  popular?: boolean;
  purchasedNumber?: number; // Renamed to match backend
  createdAt?: Date;
  updatedAt?: Date;
  soldCount?: number; // Number of items sold
  
  // Related information
  category?: Category;
  restaurant: Restaurant;
}

export interface Review {
  id?: string;
  foodId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}
/**
 * Detailed food information with complete data
 */
export interface FoodDetail extends FoodPreview {
  imageUrls: string[]; // Array of image URLs
  soldCount: number; // Number of items sold
  
  // Full related objects
  category: Category;
  restaurant: Restaurant;
  reviews?: Review[]; // Optional reviews array
}

/**
 * Cart item format compatible with cart context
 */
export interface CartItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  discountPercent?: number;
  restaurantId?: string;
}

/**
 * Helper function to convert food to cart item
 */
export function foodToCartItem(food: FoodPreview, quantity: number = 1): CartItem {
  return {
    id: food.id || '',
    name: food.name,
    description: food.description,
    price: food.price,
    image: food.image,
    quantity: quantity,
    discountPercent: food.discountPercent,
    restaurantId: food.restaurant?.id
  };
}