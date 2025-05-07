"use client";

import { FoodPreview } from "@/interface";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

// Define a cart item type that includes quantity
interface CartItem {
  foodId: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  getCartItems: () => (FoodPreview & { quantity: number })[];
  getTotalItems: () => number;
  getTotalPrice: () => number;
  removeInvalidCartItems: () => void; // Add this function type
}

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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (itemId: string | undefined) => {
    if (itemId === undefined) {
      return;
    }
    
    setCartItems((prevItems) => {
      // Check if the item is already in the cart
      const existingItemIndex = prevItems.findIndex(item => item.foodId === itemId);
      
      if (existingItemIndex !== -1) {
        // Item exists, increase quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // Item doesn't exist, add new with quantity 1
        return [...prevItems, { foodId: itemId, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(item => item.foodId === itemId);
      
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        if (updatedItems[existingItemIndex].quantity > 1) {
          // Decrease quantity if more than 1
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity - 1
          };
        } else {
          // Remove item if quantity is 1
          updatedItems.splice(existingItemIndex, 1);
        }
        return updatedItems;
      }
      return prevItems;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item completely if quantity is 0 or negative
      setCartItems((prevItems) => prevItems.filter(item => item.foodId !== itemId));
      return;
    }
    
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(item => item.foodId === itemId);
      
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity
        };
        return updatedItems;
      }
      return prevItems;
    });
  };

  const removeInvalidCartItems = () => {
    setCartItems((prevItems) => {
      const validItems = prevItems.filter(cartItem =>
        sampleFoodItems.some(food => food.id === cartItem.foodId)
      );
      // Only update state if the array actually changed
      if (validItems.length !== prevItems.length) {
        console.log("Removing invalid cart items from state.");
        return validItems;
      }
      return prevItems; // No change needed
    });
  };

  const getCartItems = () => {
    const itemsWithDetails = cartItems.map(cartItem => {
      const item = sampleFoodItems.find(food => food.id === cartItem.foodId);
      if (!item) {
        // Log a warning instead of throwing an error immediately
        console.warn(`Item with id ${cartItem.foodId} not found in sampleFoodItems during getCartItems.`);
        return null; // Mark as invalid for filtering
      }
      return { ...item, quantity: cartItem.quantity };
    });
    // Filter out the nulls (invalid items) before returning
    return itemsWithDetails.filter((item): item is (FoodPreview & { quantity: number }) => item !== null);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    // getCartItems() now returns only valid items, so reduce will work correctly
    return getCartItems().reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        getCartItems, 
        getTotalItems,
        getTotalPrice,
        removeInvalidCartItems, // Provide the new function
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};