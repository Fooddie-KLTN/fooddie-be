"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { userApi } from "@/api/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  avatar?: string;
  description?: string;
  status?: string;
  phoneNumber?: string;
  openTime?: string;
  closeTime?: string;
  licenseCode?: string;
  certificateImage?: string;
  backgroundImage?: string;
}

interface RestaurantFormData {
  name: string;
  address: string;
  description: string;
  phoneNumber: string;
  openTime: string;
  closeTime: string;
  licenseCode: string;
}

export default function MyShopPage() {
  const { user, getToken } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RestaurantFormData>({
    name: "",
    address: "",
    description: "",
    phoneNumber: "",
    openTime: "",
    closeTime: "",
    licenseCode: "",
  });
  
  // File upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  
  // Image previews
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // References for file inputs
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const certificateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchMyShop = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token || !user) return;
        const res = await userApi.restaurant.getMyRestaurant(token) as { data: Restaurant | null };
        setRestaurant(res.data || null);
      } catch {
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMyShop();
  }, [user, getToken]);
  
  // Navigation effect - redirect to restaurant management when restaurant is found
  useEffect(() => {
    if (restaurant && restaurant.id) {
      router.push(`/restaurant/${restaurant.id}/edit`);
    }
  }, [restaurant, router]);

  const handleOpen = () => setOpen(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
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
        if (value) formData.append(key, value);
      });
      
      // Add owner ID
      formData.append("ownerId", user.id);
      
      // Add files if they exist
      if (avatarFile) formData.append("avatar", avatarFile);
      if (backgroundFile) formData.append("backgroundImage", backgroundFile);
      if (certificateFile) formData.append("certificateImage", certificateFile);
      
      await userApi.restaurant.createRestaurantWithFiles(token, formData);
      
      toast.success("Tạo cửa hàng thành công! Hệ thống sẽ duyệt trong thời gian sớm nhất.");
      setOpen(false);
      
      // Refresh restaurant data
      const res = await userApi.restaurant.getMyRestaurant(token) as { data: Restaurant | null };
      setRestaurant(res.data || null);
    } catch (err) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-lg text-muted-foreground">Đang tải thông tin cửa hàng...</div>
    );
  }

  // Only show this UI if the restaurant is not found
  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <Card className="p-8 shadow-lg border border-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-2">Cửa hàng của tôi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="text-gray-500 mb-2">Bạn chưa có cửa hàng nào.</div>
            <Button className="w-full" size="lg" onClick={handleOpen}>
              + Tạo cửa hàng mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Modal for creating shop */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogTitle className="text-xl font-semibold mb-2">Tạo cửa hàng mới</DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic information - Left column */}
              <div className="space-y-4">
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
                
                <div>
                  <label className="block text-sm font-medium mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                  <Input 
                    name="address" 
                    value={form.address} 
                    onChange={handleChange} 
                    required 
                    placeholder="Địa chỉ cửa hàng" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
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
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mã giấy phép kinh doanh</label>
                  <Input 
                    name="licenseCode" 
                    value={form.licenseCode} 
                    onChange={handleChange}
                    placeholder="Mã giấy phép kinh doanh"
                  />
                </div>
              </div>
              
              {/* Images & Description - Right column */}
              <div className="space-y-4">
                {/* Avatar upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Logo cửa hàng</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={avatarInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAvatarFile, setAvatarPreview)}
                      className="flex-1"
                    />
                    {avatarPreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleRemoveFile(setAvatarFile, setAvatarPreview, avatarInputRef)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  {avatarPreview && (
                    <div className="mt-2 relative w-20 h-20 rounded-full overflow-hidden border">
                      <Image 
                        src={avatarPreview} 
                        alt="Logo Preview" 
                        fill 
                        style={{objectFit: 'cover'}}
                      />
                    </div>
                  )}
                </div>
                
                {/* Background image upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Ảnh bìa</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={backgroundInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setBackgroundFile, setBackgroundPreview)}
                      className="flex-1"
                    />
                    {backgroundPreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleRemoveFile(setBackgroundFile, setBackgroundPreview, backgroundInputRef)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  {backgroundPreview && (
                    <div className="mt-2 relative w-full h-24 rounded overflow-hidden border">
                      <Image 
                        src={backgroundPreview} 
                        alt="Background Preview" 
                        fill 
                        style={{objectFit: 'cover'}}
                      />
                    </div>
                  )}
                </div>
                
                {/* Certificate image upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Ảnh giấy phép kinh doanh</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={certificateInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setCertificateFile, setCertificatePreview)}
                      className="flex-1"
                    />
                    {certificatePreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleRemoveFile(setCertificateFile, setCertificatePreview, certificateInputRef)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  {certificatePreview && (
                    <div className="mt-2 relative w-full h-40 rounded overflow-hidden border">
                      <Image 
                        src={certificatePreview} 
                        alt="Certificate Preview" 
                        fill 
                        style={{objectFit: 'contain'}}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Description - Full width */}
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả cửa hàng</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Mô tả về cửa hàng của bạn" 
                className="w-full border rounded px-3 py-2 text-sm min-h-[100px]" 
              />
            </div>
            
            <Button type="submit" className="w-full mt-6" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Gửi yêu cầu tạo cửa hàng"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
