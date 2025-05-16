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

// --- Interfaces ---
export interface Province {
  id: number;
  name: string;
}
 
export interface District {
  id: number;
  name: string;
}

export interface Ward {
  id: number;
  name: string;
}

// Define a specific Address interface
export interface Address {
    id: string; // Unique ID for each address (e.g., UUID or DB ID)
    label?: string; // Optional label like "Home", "Work"
    street?: string;
    wardId?: number | null;
    districtId?: number | null;
    provinceId?: number | null;
    wardName?: string;
    districtName?: string;
    provinceName?: string;
    isDefault?: boolean; // Optional: Mark one as default
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  birthday?: string;
  addresses?: Address[]; // Changed to array
  currentAddress?: Address; // Optional: Current address for quick access
}
/**
 * Interface for restaurant details
 */
export interface Restaurant {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  status?: string;
  phoneNumber?: string;
  openTime?: string;
  closeTime?: string;
  licenseCode?: string;
  distance?: number | string; // Distance in km
  deliveryTime?: number | string; // Delivery time in minutes
  rating?: number; // Average rating
  certificateImage?: string;
  backgroundImage?: string;
  latitude?: string | number;  // It appears as string in your data
  longitude?: string | number; // It appears as string in your data
  foods?: FoodPreview[];
  owner?: {
    id: string;
    name: string;
    username?: string;
    email?: string;
    phone?: string | null;
    avatar?: string | null;
    isActive?: boolean;
    role?: {
      id: string;
      name: string;
      displayName: string;
      description: string;
      isSystem: boolean;
    }
  };
  address?: {
    id?: string;
    street: string;
    ward: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Food preview interface for lists, cards, and rows
 */
export interface FoodPreview {
  id?: string;
  name: string;
  description: string;
  price: number | string; // Price can be a number or string
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
    price: food.price ? parseFloat(food.price.toString()) : 0,
    image: food.image,
    quantity: quantity,
    discountPercent: food.discountPercent,
    restaurantId: food.restaurant?.id
  };
}