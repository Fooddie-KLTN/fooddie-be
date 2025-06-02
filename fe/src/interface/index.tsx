export enum RestaurantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Category {
  id: string;
  name: string;
  image: string;
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
export interface Address {
    id?: string; // Unique ID for each address (e.g., UUID or DB ID)
    label?: string; // Optional label like "Home", "Work"
    street: string;
    ward: string;
    district: string;
    city: string;
    isDefault?: boolean; // Mark one as default
    latitude?: number; // For precise location
    longitude?: number; // For precise location
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  birthday?: string;
  address?: Address[]; // Changed to array

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
    imageUrls: string[]; // Array of image URLs

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
  distance?: number; // Distance in km
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
export interface OrderDetail {
  id: string;
  order: string | Order; // Usually just orderId, but can be populated
  food: FoodPreview;
  varity?: string;
  quantity: number;
  price: number | string;
  note?: string;
}
export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discountPercent?: number;
  // ...add more fields if needed
}

export interface Order {
  id: string;
  user?: UserProfile;
  restaurant?: Restaurant;
  total?: number;
  note?: string;
  status?: 'pending' | 'confirmed' | 'delivering' | 'completed' | 'canceled' | 'processing_payment' | string;
  createdAt: string;
  updatedAt: string;
  promotionCode?: Promotion;
  date?: string;
  address?: Address;
  orderDetails: OrderDetail[];
  shippingDetail?: ShippingDetail;
  paymentMethod?: string;
  paymentDate?: string;
  isPaid: boolean;
}

export enum ShippingStatus {
    PENDING = 'PENDING',
    SHIPPING = 'SHIPPING',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
}
export interface ShippingDetail {
  id?: string;
  order: Order;
  shipper: UserProfile;
  status: ShippingStatus;
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