'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { FoodPreview } from '@/interface';
import { useMemo, useEffect, useState } from 'react'; // Import useState

// Define interfaces for API data - CORRECTED
interface Province {
  id: number; // Use id (number) instead of code
  name: string;
  // Add other fields if needed from the API response (e.g., full_name, type)
}

interface District {
  id: number; // Assuming district also uses id (number)
  name: string;
  // Add other fields if needed
}

// Add Ward interface
interface Ward {
  id: number;
  name: string;
  // Add other fields if needed
}

// Define the type for cart items used for display
type DisplayCartItem = FoodPreview & { quantity: number };

// Sample food items (assuming this is consistent with the context)
// Keep sample data as is unless specifically asked to change
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


export default function CheckoutPage() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, removeInvalidCartItems } = useCart();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]); // Add state for wards
  // Use number | null for selected IDs, initialize to null
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null); // Add state for selected ward
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false); // Add loading state for wards

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        // Using the public API endpoint mentioned in context
        const response = await fetch('https://vnprovinces.pythonanywhere.com/api/provinces/?basic=true&limit=100'); // Added params for basic info and increased limit
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Provinces API response:", data); // Log raw data
        // Check if data is an array directly, or has a 'results' property which is an array
        const provinceData = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
        if (!Array.isArray(provinceData)) {
            console.error("Fetched province data is not an array:", provinceData);
            setProvinces([]); // Set to empty array if data is invalid
        } else {
            setProvinces(provinceData);
        }
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
        setProvinces([]); // Reset on error
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when a province is selected
  useEffect(() => {
    console.log("District fetch effect - Selected Province ID:", selectedProvince);

    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]); // Reset wards when province changes
      setSelectedWard(null); // Reset selected ward
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]); // Reset wards when fetching new districts
      setSelectedWard(null); // Reset selected ward
      try {
        // CORRECTED API endpoint using query parameter province_id
        const response = await fetch(`https://vnprovinces.pythonanywhere.com/api/districts/?province_id=${selectedProvince}&basic=true&limit=100`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Districts API response for province ${selectedProvince}:`, data);
        // Use data.results as the API nests the array
        const districtData = data && Array.isArray(data.results) ? data.results : [];
        if (!Array.isArray(districtData)) {
            console.error("Fetched district data is not in the expected format (results array):", data);
            setDistricts([]);
        } else {
            setDistricts(districtData);
        }
      } catch (error) {
        console.error("Failed to fetch districts:", error);
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  // Fetch wards when a district is selected
  useEffect(() => {
    console.log("Ward fetch effect - Selected District ID:", selectedDistrict);

    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      return;
    }

    const fetchWards = async () => {
      setIsLoadingWards(true);
      setWards([]);
      setSelectedWard(null);
      try {
        const response = await fetch(`https://vnprovinces.pythonanywhere.com/api/wards/?district_id=${selectedDistrict}&basic=true&limit=100`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Wards API response for district ${selectedDistrict}:`, data);
        const wardData = data && Array.isArray(data.results) ? data.results : [];
        if (!Array.isArray(wardData)) {
            console.error("Fetched ward data is not in the expected format (results array):", data);
            setWards([]);
        } else {
            setWards(wardData);
        }
      } catch (error) {
        console.error("Failed to fetch wards:", error);
        setWards([]);
      } finally {
        setIsLoadingWards(false);
      }
    };

    fetchWards();
  }, [selectedDistrict]); // Dependency on selectedDistrict

  // Add a separate effect to log the state value whenever it changes
  useEffect(() => {
    console.log("State updated - selectedProvince is now:", selectedProvince);
  }, [selectedProvince]);

  useEffect(() => {
    console.log("State updated - selectedDistrict is now:", selectedDistrict);
  }, [selectedDistrict]);

  useEffect(() => {
    console.log("State updated - selectedWard is now:", selectedWard);
  }, [selectedWard]);

  useEffect(() => {
    removeInvalidCartItems();
  }, [cartItems, removeInvalidCartItems]);

  const displayCartItems = useMemo(() => {
    return cartItems.map(cartItem => {
        const foodDetails = sampleFoodItems.find(food => food.id === cartItem.foodId);
        if (!foodDetails) {
          return null;
        }
        return {
          ...foodDetails,
          quantity: cartItem.quantity,
        };
      }).filter((item): item is DisplayCartItem => item !== null);
  }, [cartItems]);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Handler for province selection change
  const handleProvinceChange = (value: string) => { // shadcn/ui Select typically provides string value
    console.log("Province Select onValueChange triggered. Value:", value, "Type:", typeof value);
    const provinceId = parseInt(value, 10);
    if (!isNaN(provinceId)) {
      setSelectedProvince(provinceId);
      setSelectedDistrict(null); // Reset district when province changes
      setSelectedWard(null); // Reset ward when province changes
    } else {
      console.error("Received non-numeric string or invalid value from Province Select:", value);
      setSelectedProvince(null); // Reset if parsing fails
      setSelectedDistrict(null);
      setSelectedWard(null);
    }
  };

  // Handler for district selection change
  const handleDistrictChange = (value: string) => { // shadcn/ui Select typically provides string value
    console.log("District Select onValueChange triggered. Value:", value, "Type:", typeof value);
    const districtId = parseInt(value, 10);
    if (!isNaN(districtId)) {
      setSelectedDistrict(districtId);
      setSelectedWard(null); // Reset ward when district changes
    } else {
      console.error("Received non-numeric string or invalid value from District Select:", value);
      setSelectedDistrict(null); // Reset if parsing fails
      setSelectedWard(null);
    }
  };

  // Handler for ward selection change
  const handleWardChange = (value: string) => {
    console.log("Ward Select onValueChange triggered. Value:", value, "Type:", typeof value);
    const wardId = parseInt(value, 10);
    if (!isNaN(wardId)) {
      setSelectedWard(wardId);
    } else {
      console.error("Received non-numeric string or invalid value from Ward Select:", value);
      setSelectedWard(null); // Reset if parsing fails
    }
  };

  // Example delivery fee
  const deliveryFee = 15000;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl"> {/* Adjusted max-width */}
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Thanh toán</h1>

      { !displayCartItems || displayCartItems.length === 0 ? (
        <Card className="text-center p-10 shadow-lg border border-gray-200 rounded-lg">
          <CardTitle className="mb-4 text-2xl font-semibold">Giỏ hàng của bạn đang trống</CardTitle>
          <p className="text-gray-600 mb-6">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/">
            <Button size="lg">Bắt đầu mua sắm</Button>
          </Link>
        </Card>
      ) : (
        // Changed grid to flex layout for stacking
        <div className="flex flex-col gap-8">
          {/* Cart Summary */}
          <div className="space-y-6">
            <Card className="shadow-md border border-gray-100 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tóm tắt đơn hàng ({totalItems} sản phẩm)</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 p-0">
                {displayCartItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center p-4 hover:bg-gray-50 transition-colors duration-150 gap-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover border"
                    />
                    <div className="flex-grow min-w-[150px]"> {/* Added min-width */}
                      <h3 className="font-semibold text-base">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.restaurant.name}</p>
                      <p className="text-sm font-medium text-primary">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-gray-300 hover:bg-gray-100"
                        onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-gray-300 hover:bg-gray-100"
                        onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right font-semibold min-w-[100px] text-base"> {/* Adjusted min-width */}
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                      onClick={() => removeFromCart(item.id!)}
                    >
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

          {/* Checkout Details - Now in the same column */}
          <div className="space-y-6">
             {/* Address Card */}
            <Card className="shadow-md border border-gray-100 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Địa chỉ giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                  <Label htmlFor="address" className="text-sm font-medium">Địa chỉ nhà</Label>
                  <Input id="address" placeholder="Ví dụ: 123 Đường ABC, Phường XYZ" className="mt-1"/>
                </div>
                {/* Province/City Select */}
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">Tỉnh/Thành phố</Label>
                   <Select
                    value={selectedProvince?.toString() ?? ''} // Use ?? '' for null safety
                    onValueChange={handleProvinceChange} // Use the refined handler
                    disabled={isLoadingProvinces}
                  >
                    <SelectTrigger id="city" className="mt-1">
                      <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add check for empty provinces */}
                      {provinces.length === 0 && !isLoadingProvinces && <p key="no-provinces-found" className="p-4 text-sm text-gray-500">Không tìm thấy tỉnh/thành phố.</p>}
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 {/* District Select */}
                 <div>
                  <Label htmlFor="district" className="text-sm font-medium">Quận/Huyện</Label>
                   <Select
                    value={selectedDistrict?.toString() ?? ''} // Use ?? '' for null safety
                    onValueChange={handleDistrictChange} // Use the new handler
                    disabled={!selectedProvince || isLoadingDistricts || districts.length === 0}
                  >
                    <SelectTrigger id="district" className="mt-1">
                      <SelectValue placeholder={
                        isLoadingDistricts ? "Đang tải..." :
                        !selectedProvince ? "Vui lòng chọn tỉnh/thành phố" :
                        districts.length === 0 && !isLoadingProvinces ? "Không tìm thấy quận/huyện" : // Check province loading too
                        "Chọn quận/huyện"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                       {/* Add check for empty districts */}
                      {districts.length === 0 && selectedProvince && !isLoadingDistricts && <p key="no-districts-found" className="p-4 text-sm text-gray-500">Không tìm thấy quận/huyện cho tỉnh/thành phố đã chọn.</p>}
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id.toString()}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Ward Select */}
                <div>
                  <Label htmlFor="ward" className="text-sm font-medium">Phường/Xã</Label>
                  <Select
                    value={selectedWard?.toString() ?? ''} // Use ?? '' for null safety
                    onValueChange={handleWardChange} // Use the new handler
                    disabled={!selectedDistrict || isLoadingWards || wards.length === 0}
                  >
                    <SelectTrigger id="ward" className="mt-1">
                      <SelectValue placeholder={
                        isLoadingWards ? "Đang tải..." :
                        !selectedDistrict ? "Vui lòng chọn quận/huyện" :
                        wards.length === 0 && !isLoadingDistricts ? "Không tìm thấy phường/xã" : // Check district loading too
                        "Chọn phường/xã"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add check for empty wards */}
                      {wards.length === 0 && selectedDistrict && !isLoadingWards && <p key="no-wards-found" className="p-4 text-sm text-gray-500">Không tìm thấy phường/xã cho quận/huyện đã chọn.</p>}
                      {wards.map((ward) => (
                        <SelectItem key={ward.id} value={ward.id.toString()}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                  <Input id="phone" type="tel" placeholder="Ví dụ: 09xxxxxxxx" className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Ghi chú (tùy chọn)</Label>
                  <Input id="notes" placeholder="Ví dụ: Giao hàng giờ hành chính" className="mt-1"/>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="shadow-md border border-gray-100 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add actual payment options here later */}
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
                <Button className="w-full" size="lg">Đặt hàng</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
