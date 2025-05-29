/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckIcon } from 'lucide-react';
import Image from 'next/image';

interface OrderSummaryProps {
  displayCartItems: any[];
  totalPrice: number;
  shippingFee: number;
  distance: number;
  total: number;
  calculating: boolean;
  selectedUserAddressId: string | null;
  onOrder: () => void;
  formatPrice: (price: number) => string;
}

export const OrderSummary = ({
  displayCartItems,
  totalPrice,
  shippingFee,
  distance,
  total,
  calculating,
  selectedUserAddressId,
  onOrder,
  formatPrice,
}: OrderSummaryProps) => {
  return (
    <Card className="shadow-lg border border-gray-100 rounded-xl sticky top-8">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-2">
        <ShoppingCart className="text-primary" />
        <CardTitle className="text-lg font-bold">Tóm tắt đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
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
              <div className="flex-1">
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{item.restaurant?.name}</div>
                <div className="text-xs text-gray-400">x{item.quantity}</div>
              </div>
              <div className="font-semibold text-base">
                {formatPrice(Number(item.price) * item.quantity)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-base">
          <span className="text-gray-600">Tạm tính:</span>
          <span className="font-semibold">{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between mt-2 text-base">
          <span className="text-gray-600">Phí vận chuyển:</span>
          <span className="font-semibold">{formatPrice(shippingFee)}</span>
        </div>
        <div className="flex justify-between mt-2 text-base">
          <span className="text-gray-600">Khoảng cách:</span>
          <span className="font-semibold">{distance} km</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-3 border-t pt-3">
          <span>Tổng cộng:</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
        {calculating && <div className="text-center text-sm text-gray-500 py-2">Đang tính toán...</div>}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full text-base font-bold bg-primary text-white hover:bg-primary/90 hover:text-primary transition disabled:opacity-60 py-3 rounded-lg"
          size="lg"
          disabled={!selectedUserAddressId}
          onClick={onOrder}
        >
          <span className="flex items-center gap-2 hover:text-primary">
            <CheckIcon className="w-5 h-5 hover:text-primary" />
            Xác nhận đơn hàng
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
};