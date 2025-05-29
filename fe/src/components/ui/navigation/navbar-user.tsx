"use client";

import { authService } from "@/api/auth";
import { CartIcon } from "@/components/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationMock } from "@/components/ui/navigation/notification-mock";
import { UserActionsProps } from "@/components/ui/navigation/types";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import {
  BellIcon,
  CreditCardIcon,
  HeartIcon,
  HelpCircleIcon,
  LanguagesIcon,
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserActions({ openModal }: UserActionsProps) {
  const router = useRouter();
  // Get cart context
  const { getToken, logout, user} = useAuth();
  const { cartItems } = useCart(); // Change 'cart' to 'cartItems'



  /**
   * Handle user logout
   * Signs out from Firebase and backend
   */
  const handleLogout = async () => {
    try {
      // Firebase signs out the user
      await logout();

      // Backend logout
      const token = await getToken();
      if (token) {
        await authService.logout();
      }

      // Refresh page to reset state
      window.location.reload();
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

return (
  <>
    {/* Favorite Button (left) */}
    <div className="flex-1">
      {user ? (
        <Button
          variant="ghost"
          className="w-full text-base border-primary hover:bg-primary/10 transition-colors"
        >
          <Link href="/learning">Món yêu thích</Link>
        </Button>
      ) : null}
    </div>

    {/* Action buttons (wishlist, cart, notifications) */}
    <div className="flex-1 flex gap-2 items-center justify-center">
      {user ? (
        <>
          {/* Wishlist */}
          <Button
            variant="ghost"
            className="bg-transparent hover:bg-primary/10 transition-colors"
            size="icon"
            aria-label="Wishlist"
          >
            <HeartIcon className="h-5 w-5" />
          </Button>

          {/* Cart */}
          <Link
            className="relative bg-transparent hover:bg-primary/10 p-2 rounded-full transition-colors"
            href="/checkout"
            aria-label={`Giỏ hàng (${cartItems.length})`}
          >
            <ShoppingCartIcon />
            {cartItems.length > 0 && (
              <span className="absolute flex items-center -top-2 -right-2 justify-center bg-primary h-5 w-5 rounded-full text-white text-xs font-bold shadow">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div className="relative hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative bg-transparent hover:bg-primary/10 border-none focus-visible:ring-0 transition-colors"
                  size="icon"
                  aria-label="Thông báo"
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute right-1.5 top-0.5 flex justify-center h-3 w-3 rounded-full bg-primary"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationMock.map((item, idx) => (
                  <div key={`notification-${idx}`}>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex gap-2 items-center">
                        <Avatar>
                          <AvatarImage src={item.avatar} alt="Avatar" />
                          <AvatarFallback>TE</AvatarFallback>
                        </Avatar>
                        <div className="px-2">
                          <p className="line-clamp-2 text-md font-medium">
                            {item.title}
                          </p>
                          <span className="text-gray-500 text-sm">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                ))}
                <DropdownMenuItem className="justify-center">
                  <Link
                    href="/notifications"
                    className="text-primary font-medium"
                  >
                    Xem tất cả
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <Button
          variant="ghost"
          className="bg-transparent hover:bg-primary/10 transition-colors"
          size="icon"
          aria-label="Giỏ hàng"
        >
          <CartIcon />
        </Button>
      )}
    </div>

    {/* User profile or login/register */}
    <div className="flex-none flex gap-2 mx-auto flex-col sm:flex-row items-center ml-2">
      {user ? (
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 focus-visible:ring-0 focus:outline-none">
              <span className="relative inline-block">
                <Avatar className="ring-2 ring-primary">
                  <AvatarImage src={user.avatar ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback>
                    {user.name?.substring(0, 2) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute right-0.5 -bottom-1 flex h-3 w-3 border-2 border-white rounded-full bg-green-600" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2">
              {/* User info */}
              <DropdownMenuItem className="text-base p-3 cursor-default">
                <Avatar>
                  <AvatarImage src={user.avatar ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback>
                    {user.name?.substring(0, 2) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex flex-col">
                  <p className="font-medium">{user.name ?? "User"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Overview section */}
              <DropdownMenuLabel className="text-base font-medium px-2 py-3">
                Tổng quan
              </DropdownMenuLabel>
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2" onClick={() => router.push("/order")}>
                <ShoppingBagIcon className="h-5 w-5" />
                <span>Đơn hàng của tôi</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2" onClick={() => router.push("/profile")}>
                <UserIcon className="h-5 w-5" />
                <span>Chỉnh sửa hồ sơ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Communication section */}
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <BellIcon className="h-5 w-5" />
                <span>Thông báo</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <MessageSquareIcon className="h-5 w-5" />
                <span>Tin nhắn</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Settings section */}
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <LanguagesIcon className="h-5 w-5" />
                <span>Ngôn ngữ</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Payment section */}
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <CreditCardIcon className="h-5 w-5" />
                <span>Phương thức thanh toán</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <ShoppingBagIcon className="h-5 w-5" />
                <span>Lịch sử mua</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Help and logout */}
              <DropdownMenuItem className="text-base px-2 py-3 flex gap-2">
                <HelpCircleIcon className="h-5 w-5" />
                <span>Trợ giúp và hỗ trợ</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-base px-2 py-3 flex gap-2 text-red-500"
                onClick={handleLogout}
              >
                <LogOutIcon className="h-5 w-5" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <>
          <Button
            variant="ghost"
            className="text-base border border-transparent hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => openModal("login")}
          >
            Đăng nhập
          </Button>
          <Button
            variant="default"
            className="text-base border hover:text-primary hover:border-primary transition-colors"
            onClick={() => openModal("register")}
          >
            Đăng ký
          </Button>
        </>
      )}
    </div>
  </>
);
}
