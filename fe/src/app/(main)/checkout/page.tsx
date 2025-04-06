"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioItem } from "@radix-ui/react-dropdown-menu";
import {  ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 * @component Cart
 * @description Component hiển thị trang thanh toán (checkout) với danh sách sản phẩm và tóm tắt đơn hàng
 */
export default function Cart() {
  const { cart, addToCart, removeFromCart } = useCart();
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(15000); // Fixed delivery fee
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  // Calculate total amount whenever cart changes
  useEffect(() => {


    const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    setTotalAmount(subtotal);
  }, [cart]);

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(item.id);
      return;
    }

    // First remove the current item
    removeFromCart(item.id);
    
    // Then add it back with updated quantity
    addToCart({
      ...item,
      quantity: newQuantity
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Here you would typically process the order
    // For now, we'll just show an alert
    alert("Đặt hàng thành công!");
    
    // In a real app, you would redirect to a confirmation page
    // window.location.href = "/order-confirmation";
  };

  // Format price to VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center text-gray-600 hover:text-primary">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Trở về trang chủ</span>
          </Link>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-500 mb-8">Hãy thêm vài món ngon vào giỏ hàng của bạn</p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 hover:text-primary hover:border-primary">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Cart items */}
            <div className="lg:col-span-2">
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Giỏ hàng ({cart.length} món)</h2>
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.id} className="py-4 flex items-center">
                      <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="ml-4 flex-grow">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                        <p className="text-primary font-semibold mt-1">{formatPrice(item.price)}</p>
                      </div>
                      
                      <div className="flex items-center ml-4">
                        <div className="flex items-center border rounded-md">
                          <button 
                            onClick={() => handleQuantityChange(item, (item.quantity || 1) - 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3">{item.quantity || 1}</span>
                          <button 
                            onClick={() => handleQuantityChange(item, (item.quantity || 1) + 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="ml-4 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Nhập họ tên của bạn"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      placeholder="Nhập số điện thoại"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Địa chỉ giao hàng</Label>
                    <Textarea 
                      id="address" 
                      name="address"
                      placeholder="Nhập địa chỉ giao hàng đầy đủ" 
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="note">Ghi chú (không bắt buộc)</Label>
                    <Textarea 
                      id="note" 
                      name="note"
                      placeholder="Ghi chú thêm cho đơn hàng" 
                      value={formData.note}
                      onChange={handleInputChange}
                    />
                  </div>
                </form>
              </Card>
            </div>
            
            {/* Right column - Order summary */}
            <div>
              <div className="lg:sticky lg:top-20">
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Tổng đơn hàng</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tạm tính</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí giao hàng</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Tổng cộng</span>
                        <span className="text-primary text-xl">{formatPrice(totalAmount + deliveryFee)}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        (Đã bao gồm VAT nếu có)
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
                  <RadioGroup defaultValue="cod" value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioItem value="cod" id="cod" />
                      <Label className="flex items-center" htmlFor="cod">
                        <div className="w-8 h-8 mr-2 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                          </svg>
                        </div>
                        Thanh toán khi nhận hàng
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioItem value="online" id="online" />
                      <Label className="flex items-center" htmlFor="online">
                        <div className="w-8 h-8 mr-2 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                          </svg>
                        </div>
                        Thanh toán online
                      </Label>
                    </div>
                  </RadioGroup>
                </Card>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 py-6 text-lg"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.phone || !formData.address}
                >
                  Đặt hàng
                </Button>
                
                <p className="text-center text-gray-500 text-sm mt-4">
                  Bằng cách đặt hàng, bạn đồng ý với các{' '}
                  <a href="#" className="text-primary hover:underline">điều khoản</a> của chúng tôi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}