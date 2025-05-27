"use client";

import { guestService } from "@/api/guest";
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
  getCartItems: () => Promise<(FoodPreview & { quantity: number })[]>;
  getTotalItems: () => number;
  getTotalPrice: () => Promise<number>;
  removeInvalidCartItems: () => Promise<void>;
}

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
      const existingItemIndex = prevItems.findIndex(item => item.foodId === itemId);
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
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
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity - 1
          };
        } else {
          updatedItems.splice(existingItemIndex, 1);
        }
        return updatedItems;
      }
      return prevItems;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
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

  // Fetch food details for all cart items from API
  const getCartItems = async (): Promise<(FoodPreview & { quantity: number })[]> => {
    const results: (FoodPreview & { quantity: number })[] = [];
    for (const cartItem of cartItems) {
      try {
        const food = await guestService.food.getFoodById(cartItem.foodId);
        if (food) {
          results.push({ ...food, quantity: cartItem.quantity });
        }
      } catch (err) {
        console.error(`Failed to fetch food with ID ${cartItem.foodId}:`, err);
        // Optionally log error
      }
    }
    return results;
  };

  // Remove invalid cart items (not found in API)
  const removeInvalidCartItems = async () => {
    const validItems: CartItem[] = [];
    for (const cartItem of cartItems) {
      try {
        const food = await guestService.food.getFoodById(cartItem.foodId);
        if (food) {
          validItems.push(cartItem);
        }
      } catch (err) {
        console.error(`Failed to fetch food with ID ${cartItem.foodId}:`, err);
        // Optionally log error
      }
    }
    setCartItems(validItems);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = async () => {
    const items = await getCartItems();
    return items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
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
        removeInvalidCartItems,
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