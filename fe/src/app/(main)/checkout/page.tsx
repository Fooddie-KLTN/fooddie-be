/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import {  useEffect, useState } from 'react';

interface Province { id: number; name: string; }
interface District { id: number; name: string; }
interface Ward { id: number; name: string; }

export default function CheckoutPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartItems, getTotalPrice } = useCart();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Real cart data
  const [displayCartItems, setDisplayCartItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      setLoadingCart(true);
      const items = await getCartItems();
      setDisplayCartItems(items);
      setTotalPrice(await getTotalPrice());
      setLoadingCart(false);
    };
    fetchCart();
  }, [cartItems, getCartItems, getTotalPrice]);

  // Address logic (unchanged)
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch('https://vnprovinces.pythonanywhere.com/api/provinces/?basic=true&limit=100');
        const data = await response.json();
        const provinceData = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
        setProvinces(Array.isArray(provinceData) ? provinceData : []);
      } catch {
        setProvinces([]);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]); setSelectedDistrict(null); setWards([]); setSelectedWard(null); return;
    }
    const fetchDistricts = async () => {
      setIsLoadingDistricts(true); setDistricts([]); setSelectedDistrict(null); setWards([]); setSelectedWard(null);
      try {
        const response = await fetch(`https://vnprovinces.pythonanywhere.com/api/districts/?province_id=${selectedProvince}&basic=true&limit=100`);
        const data = await response.json();
        const districtData = data && Array.isArray(data.results) ? data.results : [];
        setDistricts(Array.isArray(districtData) ? districtData : []);
      } catch {
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) { setWards([]); setSelectedWard(null); return; }
    const fetchWards = async () => {
      setIsLoadingWards(true); setWards([]); setSelectedWard(null);
      try {
        const response = await fetch(`https://vnprovinces.pythonanywhere.com/api/wards/?district_id=${selectedDistrict}&basic=true&limit=100`);
        const data = await response.json();
        const wardData = data && Array.isArray(data.results) ? data.results : [];
        setWards(Array.isArray(wardData) ? wardData : []);
      } catch {
        setWards([]);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleProvinceChange = (value: string) => {
    const provinceId = parseInt(value, 10);
    setSelectedProvince(!isNaN(provinceId) ? provinceId : null);
    setSelectedDistrict(null); setSelectedWard(null);
  };
  const handleDistrictChange = (value: string) => {
    const districtId = parseInt(value, 10);
    setSelectedDistrict(!isNaN(districtId) ? districtId : null);
    setSelectedWard(null);
  };
  const handleWardChange = (value: string) => {
    const wardId = parseInt(value, 10);
    setSelectedWard(!isNaN(wardId) ? wardId : null);
  };

  const deliveryFee = 15000;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Thanh toán</h1>
      {loadingCart ? (
        <div className="text-center py-10">Đang tải giỏ hàng...</div>
      ) : !displayCartItems || displayCartItems.length === 0 ? (
        <Card className="text-center p-10 shadow-lg border border-gray-200 rounded-lg">
          <CardTitle className="mb-4 text-2xl font-semibold">Giỏ hàng của bạn đang trống</CardTitle>
          <p className="text-gray-600 mb-6">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/"><Button size="lg">Bắt đầu mua sắm</Button></Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Cart Summary */}
          <div className="space-y-6">
            <Card className="shadow-md border border-gray-100 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tóm tắt đơn hàng ({displayCartItems.length} sản phẩm)</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 p-0">
                {displayCartItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center p-4 hover:bg-gray-50 transition-colors duration-150 gap-4">
                    <Image src={item.image} alt={item.name} width={80} height={80} className="rounded-md object-cover border" />
                    <div className="flex-grow min-w-[150px]">
                      <h3 className="font-semibold text-base">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.restaurant?.name}</p>
                      <p className="text-sm font-medium text-primary">{formatPrice(Number(item.price))}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300 hover:bg-gray-100"
                        onClick={() => updateQuantity(item.id!, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300 hover:bg-gray-100"
                        onClick={() => updateQuantity(item.id!, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right font-semibold min-w-[100px] text-base">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                      onClick={() => removeFromCart(item.id!)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-end font-bold text-lg p-4 bg-gray-50 rounded-b-lg">
                Tổng cộng: {formatPrice(totalPrice)}
              </CardFooter>
            </Card>
          </div>
          {/* Address Card */}
          <div className="space-y-6">
            <Card className="shadow-md border border-gray-100 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Địa chỉ giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">Địa chỉ nhà</Label>
                  <Input id="address" placeholder="Ví dụ: 123 Đường ABC, Phường XYZ" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">Tỉnh/Thành phố</Label>
                  <Select value={selectedProvince?.toString() ?? ''} onValueChange={handleProvinceChange} disabled={isLoadingProvinces}>
                    <SelectTrigger id="city" className="mt-1">
                      <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.length === 0 && !isLoadingProvinces && <p key="no-provinces-found" className="p-4 text-sm text-gray-500">Không tìm thấy tỉnh/thành phố.</p>}
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>{province.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district" className="text-sm font-medium">Quận/Huyện</Label>
                  <Select value={selectedDistrict?.toString() ?? ''} onValueChange={handleDistrictChange}
                    disabled={!selectedProvince || isLoadingDistricts || districts.length === 0}>
                    <SelectTrigger id="district" className="mt-1">
                      <SelectValue placeholder={
                        isLoadingDistricts ? "Đang tải..." :
                          !selectedProvince ? "Vui lòng chọn tỉnh/thành phố" :
                            districts.length === 0 && !isLoadingProvinces ? "Không tìm thấy quận/huyện" :
                              "Chọn quận/huyện"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.length === 0 && selectedProvince && !isLoadingDistricts && <p key="no-districts-found" className="p-4 text-sm text-gray-500">Không tìm thấy quận/huyện cho tỉnh/thành phố đã chọn.</p>}
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id.toString()}>{district.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ward" className="text-sm font-medium">Phường/Xã</Label>
                  <Select value={selectedWard?.toString() ?? ''} onValueChange={handleWardChange}
                    disabled={!selectedDistrict || isLoadingWards || wards.length === 0}>
                    <SelectTrigger id="ward" className="mt-1">
                      <SelectValue placeholder={
                        isLoadingWards ? "Đang tải..." :
                          !selectedDistrict ? "Vui lòng chọn quận/huyện" :
                            wards.length === 0 && !isLoadingDistricts ? "Không tìm thấy phường/xã" :
                              "Chọn phường/xã"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.length === 0 && selectedDistrict && !isLoadingWards && <p key="no-wards-found" className="p-4 text-sm text-gray-500">Không tìm thấy phường/xã cho quận/huyện đã chọn.</p>}
                      {wards.map((ward) => (
                        <SelectItem key={ward.id} value={ward.id.toString()}>{ward.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                  <Input id="phone" type="tel" placeholder="Ví dụ: 09xxxxxxxx" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Ghi chú (tùy chọn)</Label>
                  <Input id="notes" placeholder="Ví dụ: Giao hàng giờ hành chính" className="mt-1" />
                </div>
              </CardContent>
            </Card>
            {/* Payment Method Card */}
            <Card className="shadow-md border border-gray-100 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Các tùy chọn thanh toán sẽ hiển thị ở đây.</p>
                <p className="text-sm text-gray-500 mt-2">(Ví dụ: Thanh toán khi nhận hàng, Ví điện tử, Thẻ ngân hàng)</p>
              </CardContent>
            </Card>
            {/* Order Summary Card */}
            <Card className="shadow-md border border-gray-100 rounded-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tổng đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí giao hàng</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200 mt-3">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(totalPrice + deliveryFee)}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4">
                <Button className="w-full hover:outline-primary hover:text-primary" size="lg">Đặt hàng</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}