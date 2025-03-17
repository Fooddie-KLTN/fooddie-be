"use client";
import { Product } from "@/type";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

interface CartContextType {
  cart: Product[];
  addToCart: (item: Omit<Product, "id">) => void;
  removeFromCart: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

export const CartProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [cart, setCart] = useState<Product[]>([]);

  const addToCart = (item: Omit<Product, "id">) => {
    const id = `${item.title}-${Date.now()}`;
    setCart((prev) => [...prev, { ...item, id }]);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
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
