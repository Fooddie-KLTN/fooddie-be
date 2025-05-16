"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { userApi } from "@/api/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { MapPinIcon, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Restaurant } from "@/interface";

// Import MapboxSearch component dynamically to prevent SSR issues
const MapboxSearch = dynamic(() => import('@/components/mapbox-search'), {
  ssr: false,
  loading: () => <div className="h-12 rounded-md bg-gray-100 animate-pulse"></div>
});

interface RestaurantFormData {
  name: string;
  address: string;
  description: string;
  phoneNumber: string;
  openTime: string;
  closeTime: string;
  licenseCode: string;
  latitude?: number;
  longitude?: number;
}

export default function MyShopPage() {
  // Optimized form state management
  const [form, setForm] = useState<RestaurantFormData>({
    name: "",
    address: "",
    description: "",
    phoneNumber: "",
    openTime: "",
    closeTime: "",
    licenseCode: "",
  });

  // Use memoized handler to prevent recreating functions on each render
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);
  const { user, getToken } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  
  // File upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  
  // Image previews
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);
  const router = useRouter();

  // References for file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const fetchMyShop = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !user) return null;
      
      // Get restaurant data
      const response = await userApi.restaurant.getMyRestaurant(token);
      console.log("Fetched restaurant response:", response);
      
      // Since the response is directly the restaurant object, we can check it directly
      if (response && response.id) {
        console.log("Restaurant data found:", response);
        setRestaurant(response);
        return response;
      } else {
        console.log("No restaurant data found");
        setRestaurant(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      setRestaurant(null);
      return null;
    }
  }, [user, getToken]);
  
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
       await fetchMyShop();

      setLoading(false);
    };
    
    loadInitialData();
  }, [fetchMyShop]);
  
  // Handle navigation based on restaurant status
  useEffect(() => {
    if (!restaurant) return;
    
    if (restaurant.status === "approved") {
      router.push(`/restaurant/${restaurant.id}/edit`);
    }
  }, [restaurant, router]);
  
  const handleAddressSelect = useCallback((addressData: { full: string; latitude: number; longitude: number }) => {
    setForm(prev => ({
      ...prev,
      address: addressData.full,
      latitude: addressData.latitude,
      longitude: addressData.longitude
    }));
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void, setPreview: (preview: string | null) => void) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveFile = (setFile: (file: File | null) => void, setPreview: (preview: string | null) => void, inputRef: React.RefObject<HTMLInputElement | null>) => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = await getToken();
      if (!token || !user) return;
      
      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      
      // Add owner ID
      formData.append("ownerId", user.id);
      
      // Add files if they exist
      if (avatarFile) formData.append("avatar", avatarFile);
      if (backgroundFile) formData.append("backgroundImage", backgroundFile);
      if (certificateFile) formData.append("certificateImage", certificateFile);
      
      // Create restaurant
      await userApi.restaurant.createRestaurantWithFiles(token, formData);
      toast.success("Tạo cửa hàng thành công! Hệ thống sẽ duyệt trong thời gian sớm nhất.");
      
      // Refresh restaurant data to get the newly created restaurant
      setRefreshingData(true);
      const updatedRestaurant = await fetchMyShop();
      setRefreshingData(false);
      
      if (!updatedRestaurant) {
        toast.error("Không thể tải thông tin cửa hàng. Vui lòng làm mới trang.");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading initial data state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Đang tải thông tin cửa hàng...</p>
        </div>
      </div>
    );
  }

  // If a pending restaurant was found, show waiting status
  if (restaurant && restaurant.status === "pending") {
    console.log("Pending restaurant found:", restaurant);
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Card className="p-8 shadow-lg border border-amber-100 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-7 w-7 text-amber-500" />
              <CardTitle className="text-2xl font-bold text-amber-700">Đang chờ phê duyệt</CardTitle>
            </div>
            
            {/* Enhanced notification message */}
            <div className="mt-4 p-4 bg-white rounded-md border border-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-amber-700">Yêu cầu của bạn đã được gửi thành công!</p>
                  <p className="text-amber-600 mt-1">
                    Cửa hàng của bạn đã được tạo và đang chờ quản trị viên phê duyệt.
                    Hệ thống sẽ xử lý yêu cầu trong thời gian sớm nhất, thông thường
                    quá trình này sẽ mất từ 1-3 ngày làm việc.
                  </p>
                  <p className="text-amber-600 mt-2">
                    Bạn sẽ nhận được thông báo qua email khi cửa hàng được phê duyệt.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
            
          <CardContent className="space-y-6">
            {/* Restaurant Info Summary */}
            <div className="bg-white rounded-md border border-amber-200 p-4">
              <h3 className="font-medium text-lg mb-3 text-amber-800">Thông tin cửa hàng</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700 w-32">Tên cửa hàng:</span>
                  <span>{restaurant.name}</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700 w-32">Địa chỉ:</span>
                  <span className="flex-1">
                    {restaurant.address?.street}, {restaurant.address?.ward}, {restaurant.address?.district}, {restaurant.address?.city}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700 w-32">Giờ hoạt động:</span>
                  <span>{restaurant.openTime} - {restaurant.closeTime}</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700 w-32">Số điện thoại:</span>
                  <span>{restaurant.phoneNumber || "Chưa cung cấp"}</span>
                </div>
              </div>
              
              {/* Restaurant Images */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {restaurant.avatar && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Logo</p>
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border border-gray-200">
                      <Image 
                        src={restaurant.avatar}
                        alt="Logo"
                        fill
                        style={{objectFit: 'cover'}}
                        sizes="96px"
                      />
                    </div>
                  </div>
                )}
                
                {restaurant.backgroundImage && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Ảnh bìa</p>
                    <div className="relative h-24 w-full rounded-md overflow-hidden border border-gray-200">
                      <Image 
                        src={restaurant.backgroundImage}
                        alt="Background"
                        fill
                        style={{objectFit: 'cover'}}
                        sizes="400px"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Timeline */}
            <div className="space-y-4">
              <h3 className="font-medium">Trạng thái</h3>
              
              <div className="flex items-stretch">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="w-1 flex-1 bg-amber-300"></div>
                </div>
                <div className="ml-3 pb-8">
                  <p className="font-medium text-green-700">Đã tạo thành công</p>
                  <p className="text-sm text-gray-500">Cửa hàng của bạn đã được tạo trong hệ thống</p>
                </div>
              </div>
              
              <div className="flex items-stretch">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="w-1 flex-1 bg-gray-200"></div>
                </div>
                <div className="ml-3 pb-8">
                  <p className="font-medium text-amber-700">Đang chờ duyệt</p>
                  <p className="text-sm text-gray-500">Quản trị viên đang xem xét thông tin của cửa hàng</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400">3</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-400">Phê duyệt</p>
                  <p className="text-sm text-gray-500">Khi được duyệt, bạn có thể bắt đầu quản lý cửa hàng</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-100 rounded-md p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Sau khi cửa hàng được duyệt, bạn sẽ nhận được thông báo qua email và có thể 
                  bắt đầu quản lý các món ăn, khuyến mãi và đơn hàng.
                </p>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setRefreshingData(true);
                fetchMyShop().finally(() => setRefreshingData(false));
              }}
              disabled={refreshingData}
            >
              {refreshingData ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang làm mới...</>
              ) : (
                'Kiểm tra trạng thái'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show create shop section if NOT loading and restaurant is null
  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Card className="p-8 shadow-lg border border-gray-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold mb-2">Tạo cửa hàng mới</CardTitle>
            <p className="text-gray-500">Điền thông tin để đăng ký cửa hàng của bạn</p>
          </CardHeader>
          
          <CardContent>
            {refreshingData ? (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium">Đang xử lý...</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Chúng tôi đang cập nhật thông tin cửa hàng của bạn.
                  Vui lòng đợi trong giây lát.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên cửa hàng <span className="text-red-500">*</span></label>
                      <Input 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        required 
                        placeholder="Nhập tên cửa hàng" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                      <Input 
                        name="phoneNumber" 
                        value={form.phoneNumber} 
                        onChange={handleChange}
                        placeholder="Số điện thoại liên hệ"
                      />
                    </div>
                  </div>
                  
                  {/* Enhanced Address Section with Mapbox */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-medium">Địa chỉ cửa hàng <span className="text-red-500">*</span></h3>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      {/* Mapbox Search */}
                      <MapboxSearch 
                        key="mapbox-search" // Add stable key to prevent re-renders
                        onAddressSelect={handleAddressSelect}
                        placeholder="Tìm địa chỉ cửa hàng của bạn..."
                        className="mb-3"
                        debounceTime={1500}
                      />
                      
                      {/* Display selected address */}
                      {form.address && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">Địa chỉ đã chọn</label>
                          <div className="p-3 bg-white border rounded-md text-sm">
                            <p>{form.address}</p>
                            {form.latitude && form.longitude && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">Tọa độ:</span> {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Manual override */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-1">Chỉnh sửa địa chỉ (nếu cần)</label>
                        <Input 
                          name="address" 
                          value={form.address} 
                          onChange={handleChange} 
                          required 
                          placeholder="Địa chỉ cửa hàng" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          *Bạn có thể chỉnh sửa địa chỉ nếu dữ liệu từ bản đồ không chính xác
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Giờ mở cửa</label>
                      <Input 
                        type="time" 
                        name="openTime" 
                        value={form.openTime} 
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Giờ đóng cửa</label>
                      <Input 
                        type="time" 
                        name="closeTime" 
                        value={form.closeTime} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Mã giấy phép kinh doanh</label>
                    <Input 
                      name="licenseCode" 
                      value={form.licenseCode} 
                      onChange={handleChange}
                      placeholder="Mã giấy phép kinh doanh"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Mô tả cửa hàng</label>
                    <textarea 
                      name="description" 
                      value={form.description} 
                      onChange={handleChange} 
                      placeholder="Mô tả về cửa hàng của bạn" 
                      className="w-full border rounded px-3 py-2 text-sm min-h-[100px]" 
                    />
                  </div>
                </div>
                
                {/* Image Upload Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-3">Hình ảnh cửa hàng</h3>
                  
                  <div className="space-y-4">
                    {/* Avatar upload */}
                    <div className="p-4 bg-gray-50 rounded">
                      <label className="block text-sm font-medium mb-2">Logo cửa hàng</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input 
                            ref={avatarInputRef}
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setAvatarFile, setAvatarPreview)}
                            className="flex-1"
                          />
                        </div>
                        {avatarPreview && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleRemoveFile(setAvatarFile, setAvatarPreview, avatarInputRef)}
                            className="shrink-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      {avatarPreview && (
                        <ImagePreview 
                          src={avatarPreview} 
                          alt="Logo Preview" 
                          className="mt-2 relative w-20 h-20 rounded-full overflow-hidden border"
                        />
                      )}
                    </div>
                    
                    {/* Background image upload */}
                    <div className="p-4 bg-gray-50 rounded">
                      <label className="block text-sm font-medium mb-2">Ảnh bìa</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input 
                            ref={backgroundInputRef}
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setBackgroundFile, setBackgroundPreview)}
                            className="flex-1"
                          />
                        </div>
                        {backgroundPreview && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleRemoveFile(setBackgroundFile, setBackgroundPreview, backgroundInputRef)}
                            className="shrink-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      {backgroundPreview && (
                        <ImagePreview 
                          src={backgroundPreview} 
                          alt="Background Preview" 
                          className="mt-2 relative w-full h-24 rounded overflow-hidden border"
                        />
                      )}
                    </div>
                    
                    {/* Certificate image upload */}
                    <div className="p-4 bg-gray-50 rounded">
                      <label className="block text-sm font-medium mb-2">Ảnh giấy phép kinh doanh</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input 
                            ref={certificateInputRef}
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setCertificateFile, setCertificatePreview)}
                            className="flex-1"
                          />
                        </div>
                        {certificatePreview && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleRemoveFile(setCertificateFile, setCertificatePreview, certificateInputRef)}
                            className="shrink-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      {certificatePreview && (
                        <ImagePreview 
                          src={certificatePreview} 
                          alt="Certificate Preview" 
                          className="mt-2 relative w-full h-40 rounded overflow-hidden border"
                          objectFit="contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg mt-6" 
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? "Đang xử lý..." : "Gửi yêu cầu tạo cửa hàng"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Optionally: handle other statuses if needed
}

// Memoize image previews to prevent unnecessary renders
interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  [key: string]: unknown;
}

const ImagePreview = memo(({ src, alt, ...props }: ImagePreviewProps) => (
  <div className={props.className || "relative w-20 h-20 rounded-full overflow-hidden border"}>
    <Image 
      src={src} 
      alt={alt} 
      fill 
      style={{objectFit: props.objectFit || 'cover'}}
      sizes={props.sizes || "96px"}
    />
  </div>
));
ImagePreview.displayName = 'ImagePreview';
