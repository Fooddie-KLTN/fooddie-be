import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from 'lucide-react';

interface ActionButtonsProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
}

const ActionButtons = ({ onAddToCart, onBuyNow }: ActionButtonsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button 
        onClick={onAddToCart}
        variant="outline" 
        className="flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary hover:text-white"
      >
        <ShoppingCart className="h-5 w-5" />
        Thêm vào giỏ
      </Button>
      <Button 
        onClick={onBuyNow}
        className="food-button"
      >
        Mua ngay
      </Button>
    </div>
  );
};

export default ActionButtons;