"use client";

import { guestService } from "@/api/guest";
import { FoodPreview } from "@/interface";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNotification } from "@/components/ui/notification";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [pendingFoodId, setPendingFoodId] = useState<string | null>(null);
  const [pendingRestaurantId, setPendingRestaurantId] = useState<string | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const { showNotification } = useNotification();

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cartItems");
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (itemId: string) => {
    if (!itemId) return;

    // Fetch food info to get restaurant id
    let food;
    try {
      food = await guestService.food.getFoodById(itemId);
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, "error");
        return;
      }
      showNotification("Không thể lấy thông tin món ăn.", "error");
      return;
    }
    if (!food || !food.restaurant?.id) {
      showNotification("Món ăn không hợp lệ.", "error");
      return;
    }

    // If cart is empty, set restaurantId and add
    if (cartItems.length === 0) {
      setRestaurantId(food.restaurant.id);
      setCartItems([{ foodId: itemId, quantity: 1 }]);
      showNotification("Đã thêm món vào giỏ hàng.", "success");
      return;
    }

    // If same restaurant, allow add
    if (restaurantId === food.restaurant.id) {
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
      showNotification("Đã thêm món vào giỏ hàng.", "success");
      return;
    }

    // If different restaurant, show modal instead of window.confirm
    setPendingFoodId(itemId);
    setPendingRestaurantId(food.restaurant.id);
    setShowReplaceModal(true);
  };

  // Handler for confirming replace
  const handleReplaceCart = () => {
    if (pendingFoodId && pendingRestaurantId) {
      setRestaurantId(pendingRestaurantId);
      setCartItems([{ foodId: pendingFoodId, quantity: 1 }]);
      showNotification("Đã thay thế giỏ hàng với món mới.", "info");
    }
    setShowReplaceModal(false);
    setPendingFoodId(null);
    setPendingRestaurantId(null);
  };

  // Handler for cancel
  const handleCancelReplace = () => {
    showNotification("Bạn đã huỷ thao tác.", "warning");
    setShowReplaceModal(false);
    setPendingFoodId(null);
    setPendingRestaurantId(null);
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

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter(item => item.foodId !== itemId));
    showNotification("Đã xóa món khỏi giỏ hàng.", "info");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems((prevItems) => 
      prevItems.map(item => 
        item.foodId === itemId ? { ...item, quantity } : item
      )
    );
  };

  return (
    <>
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
      <Dialog open={showReplaceModal} onOpenChange={setShowReplaceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay thế giỏ hàng?</DialogTitle>
          </DialogHeader>
          <div>Bạn chỉ có thể đặt món từ một nhà hàng mỗi lần. Thay thế giỏ hàng hiện tại?</div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              onClick={handleCancelReplace}
            >
              Hủy
            </button>
            <button
              className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
              onClick={handleReplaceCart}
            >
              Thay thế
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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