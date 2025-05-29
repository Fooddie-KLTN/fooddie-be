/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface CartItemsSectionProps {
  displayCartItems: any[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveFromCart: (id: string) => void;
  formatPrice: (price: number) => string;
}

export const CartItemsSection = ({
  displayCartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  formatPrice,
}: CartItemsSectionProps) => {
  return (
    <Card className="shadow-md border border-gray-100 rounded-xl p-0">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-2">
        <ShoppingCart className="text-primary" />
        <CardTitle className="text-lg font-bold">Chọn món & số lượng</CardTitle>
      </CardHeader>
      <CardContent>
        {displayCartItems.length === 0 ? (
          <div className="text-gray-500 text-center py-6">Giỏ hàng của bạn đang trống.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayCartItems.map((item) => (
              <div key={item.id} className="flex items-center py-3 gap-3">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  width={48} 
                  height={48} 
                  className="rounded-md object-cover border" 
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.restaurant?.name}</div>
                  <div className="text-xs text-gray-400">{formatPrice(Number(item.price))}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-2 text-red-500 hover:bg-red-50"
                  onClick={() => onRemoveFromCart(item.id)}
                  aria-label="Xóa món"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};