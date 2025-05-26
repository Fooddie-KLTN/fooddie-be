import { ChangeEvent, FormEvent } from 'react';
import { Restaurant, RestaurantStatus } from '@/interface';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import dynamic from 'next/dynamic';

// Import MapboxSearch component dynamically to prevent SSR issues
const MapboxSearch = dynamic(() => import('@/components/mapbox-search'), {
  ssr: false,
  loading: () => <div className="h-12 rounded-md bg-gray-100 animate-pulse"></div>
});

interface CommonInfoFormProps {
    restaurant: Partial<Restaurant>;
    handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    saving: boolean;
    loading: boolean;
    authLoading: boolean;
    hideAddressInput?: boolean;
    handleAddressSelect?: (address: { full: string; latitude: number; longitude: number }) => void;
    addressSelects?: React.ReactNode; // <-- Add this line
}

export function CommonInfoForm({
    restaurant,
    handleInputChange,
    handleSubmit,
    saving,
    loading,
    authLoading,
    hideAddressInput = false,
    handleAddressSelect
}: CommonInfoFormProps) {
    return (
        <form onSubmit={handleSubmit}>
            <Card className="shadow-lg border border-gray-100">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Chỉnh Sửa Thông Tin Chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {/* Tên nhà hàng */}
                    <div>
                        <Label htmlFor="name" className="text-sm font-medium">Tên Nhà Hàng *</Label>
                        <Input
                            id="name"
                            name="name"
                            value={restaurant.name ?? ''}
                            onChange={handleInputChange}
                            placeholder="Tên nhà hàng của bạn"
                            className="mt-1"
                            required
                            disabled={saving}
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-medium">Mô Tả</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={restaurant.description ?? ''}
                            onChange={handleInputChange}
                            placeholder="Giới thiệu về nhà hàng của bạn"
                            className="mt-1"
                            rows={4}
                            disabled={saving}
                        />
                    </div>

                    {/* Phần Địa Chỉ */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium">Địa Chỉ Nhà Hàng *</Label>
                        
                        {/* MapboxSearch khi được bật */}
                        {hideAddressInput && handleAddressSelect && !loading && !authLoading && (
                            <div className="mt-3">
                                <MapboxSearch
                                    key="common-info-mapbox-search" 
                                    onAddressSelect={handleAddressSelect}
                                    initialAddress={restaurant.address?.street || ''}
                                    initialLatitude={restaurant.latitude}
                                    initialLongitude={restaurant.longitude}
                                    height="350px"
                                    className="rounded-md border border-gray-300"
                                    placeholder="Tìm địa chỉ của bạn..."
                                />
                                
                                {/* Hiển thị vị trí đã chọn */}
                                <div className="mt-4 p-4 bg-white border rounded-md shadow-sm">
                                    <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        Vị Trí Đã Chọn
                                    </h4>
                                    
                                    {restaurant.address ? (
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="font-medium">Địa chỉ:</span> {restaurant.address.street}</p>
                                            <p className="text-sm"><span className="font-medium">Khu vực:</span> {restaurant.address.ward}, {restaurant.address.district}, {restaurant.address.city}</p>
                                            {restaurant.latitude && restaurant.longitude && (
                                                <p className="text-sm"><span className="font-medium">Tọa độ:</span> {restaurant.latitude}, {restaurant.longitude}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Chưa chọn vị trí. Hãy tìm kiếm địa chỉ hoặc nhấp vào bản đồ để chọn vị trí.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Nhập địa chỉ thông thường khi bản đồ bị tắt */}
                        {!hideAddressInput && (
                            <Input
                                id="address"
                                name="address"
                                value={typeof restaurant.address === 'string' ? restaurant.address : 
                                      restaurant.address ? `${restaurant.address.street}, ${restaurant.address.ward}, ${restaurant.address.district}, ${restaurant.address.city}` : ''}
                                onChange={handleInputChange}
                                placeholder="Đường, Phường, Quận, Thành phố"
                                className="mt-1"
                                required
                                disabled={saving}
                            />
                        )}
                    </div>

                    {/* Thời gian hoạt động và liên hệ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Số điện thoại */}
                        <div>
                            <Label htmlFor="phoneNumber" className="text-sm font-medium">Số Điện Thoại</Label>
                            <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={restaurant.phoneNumber ?? ''}
                                onChange={handleInputChange}
                                placeholder="Số điện thoại liên hệ"
                                className="mt-1"
                                disabled={saving}
                            />
                        </div>
                        
                        {/* Giờ mở cửa */}
                        <div>
                            <Label htmlFor="openTime" className="text-sm font-medium">Giờ Mở Cửa</Label>
                            <Input
                                id="openTime"
                                name="openTime"
                                type="time"
                                value={restaurant.openTime ?? ''}
                                onChange={handleInputChange}
                                className="mt-1"
                                disabled={saving}
                            />
                        </div>
                        
                        {/* Giờ đóng cửa */}
                        <div>
                            <Label htmlFor="closeTime" className="text-sm font-medium">Giờ Đóng Cửa</Label>
                            <Input
                                id="closeTime"
                                name="closeTime"
                                type="time"
                                value={restaurant.closeTime ?? ''}
                                onChange={handleInputChange}
                                className="mt-1"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Phần hình ảnh */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        {/* Ảnh đại diện */}
                        <div>
                            <Label htmlFor="avatar" className="text-sm font-medium">Ảnh Đại Diện</Label>
                            {restaurant.avatar && (
                                <div className="mt-2 flex justify-center">
                                    <img 
                                        src={restaurant.avatar} 
                                        alt="Xem trước ảnh đại diện" 
                                        width={80} 
                                        height={80}
                                        className="h-24 w-24 rounded-full object-cover border shadow-sm" 
                                    />
                                </div>
                            )}
                            <Input
                                id="avatar"
                                name="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="mt-3"
                                disabled={saving}
                            />
                            <p className="text-xs text-gray-500 mt-1">Tải lên ảnh vuông để có kết quả tốt nhất.</p>
                        </div>

                        {/* Ảnh nền */}
                        <div>
                            <Label htmlFor="backgroundImage" className="text-sm font-medium">Ảnh Nền</Label>
                            {restaurant.backgroundImage && (
                                <div className="mt-2">
                                    <img 
                                        src={restaurant.backgroundImage} 
                                        alt="Xem trước ảnh nền" 
                                        width={400}
                                        height={150}
                                        className="h-36 w-full object-cover rounded border shadow-sm" 
                                    />
                                </div>
                            )}
                            <Input
                                id="backgroundImage"
                                name="background-upload"
                                type="file"
                                accept="image/*"
                                className="mt-3"
                                disabled={saving}
                            />
                            <p className="text-xs text-gray-500 mt-1">Tải lên ảnh ngang (ví dụ: 1200x400).</p>
                        </div>
                    </div>

                    {/* Hiển thị Trạng thái (Chỉ đọc) */}
                    {restaurant.status && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-sm font-medium">Trạng Thái Hiện Tại</Label>
                            <p className={`mt-2 text-sm font-semibold px-3 py-1 rounded-full inline-block ${
                                restaurant.status === RestaurantStatus.APPROVED ? 'bg-green-100 text-green-800' :
                                restaurant.status === RestaurantStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {restaurant.status === RestaurantStatus.APPROVED ? 'ĐÃ DUYỆT' :
                                 restaurant.status === RestaurantStatus.PENDING ? 'ĐANG CHỜ DUYỆT' :
                                 'BỊ TỪ CHỐI'}
                            </p>
                            {restaurant.status === RestaurantStatus.PENDING && <p className="text-xs text-gray-500 mt-2">Nhà hàng của bạn đang chờ được phê duyệt.</p>}
                            {restaurant.status === RestaurantStatus.REJECTED && <p className="text-xs text-gray-500 mt-2">Yêu cầu nhà hàng của bạn đã bị từ chối. Liên hệ hỗ trợ để biết thêm chi tiết.</p>}
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-end pt-6 border-t mt-6">
                    <Button type="submit" disabled={saving || loading || authLoading} className="px-6">
                        {saving ? "Đang lưu..." : "Lưu Thông Tin"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}