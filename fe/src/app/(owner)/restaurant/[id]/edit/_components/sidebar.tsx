'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, UtensilsCrossed, BarChart3, ShoppingBag, Tag, LogOut, ChefHat } from 'lucide-react'; // Đã thêm ChefHat cho logo

// Định nghĩa các mục điều hướng
const navItems = [
    { href: 'statistics', label: 'Thống kê', icon: BarChart3 },
    { href: 'basic-info', label: 'Thông tin cơ bản', icon: Home },
    { href: 'food-list', label: 'Thực đơn', icon: UtensilsCrossed }, // Đổi tên cho rõ ràng
    { href: 'order-list', label: 'Đơn hàng', icon: ShoppingBag },
    { href: 'promotions', label: 'Khuyến mãi', icon: Tag },
];

export function Sidebar() {
    const pathname = usePathname();
    const params = useParams();
    const restaurantId = params.id;

    // Tạo đường dẫn cơ sở cho các liên kết
    // Xử lý trường hợp params là mảng/chuỗi
    const currentRestaurantId = Array.isArray(restaurantId) ? restaurantId[0] : restaurantId;
    const basePath = currentRestaurantId ? `/restaurant/${currentRestaurantId}/edit` : '/'; // Cần dự phòng

    const handleLogout = () => {
        // TODO: Thực hiện logic đăng xuất thực tế bằng context xác thực của bạn
        console.log("Đã nhấn Đăng xuất");
        // Ví dụ: auth.logout(); router.push('/login');
    };

    return (
        // Sidebar hiện đại: Màu nền tối hơn, tăng padding, căn chỉnh khoảng cách
        <aside className="w-64 flex flex-col h-screen bg-primary text-primary-foreground p-6 border-r border-border/10 shadow-md">
            {/* Khu vực logo - căn giữa với icon */}
            <div className="mb-10 flex flex-col items-center">
                 <div className="bg-primary-foreground/10 p-3 rounded-full mb-3">
                     <ChefHat className="h-8 w-8 text-primary-foreground" />
                 </div>
                <Link href="/" className="text-xl font-semibold tracking-tight">
                    Fooddie Chủ quán
                </Link>
                <span className="text-xs text-primary-foreground/70 mt-1">Bảng điều khiển nhà hàng</span>
            </div>

            {/* Điều hướng - tăng padding, trạng thái active/hover rõ ràng hơn */}
            <nav className="flex-grow space-y-1.5">
                {navItems.map((item) => {
                    // Đảm bảo basePath hợp lệ trước khi tạo fullPath
                    const fullPath = basePath !== '/' ? `${basePath}/${item.href}` : `/${item.href}`; // Điều chỉnh nếu basePath chỉ là '/'
                    const isBasePathActive = item.href === 'basic-info' && pathname === basePath;
                    const isSubPathActive = pathname === fullPath;
                    const isActive = isBasePathActive || isSubPathActive;

                    return (
                        <Link
                            key={item.href}
                            href={fullPath}
                            className={cn(
                                "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out group",
                                isActive
                                    ? "bg-primary-foreground/20 text-primary-foreground shadow-inner"
                                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground hover:scale-[1.02] transform"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Nút đăng xuất - style đồng nhất */}
            <div className="mt-auto pt-4 border-t border-primary-foreground/10">
                <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2.5 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}