/**
 * @fileoverview Layout chính của ứng dụng bao quanh tất cả các trang trong đường dẫn (main).
 *
 * @module RootLayout
 * @description Component bố cục gốc cho ứng dụng web Project Beauty Academy.
 * Cung cấp cấu trúc chung cho tất cả các trang bao gồm banner cố định, thanh điều hướng và chân trang.
 * Bao bọc các thành phần con bên trong các providers cần thiết cho giỏ hàng và xác thực.
 *
 * @property {React.ReactNode} children - Các thành phần con được hiển thị bên trong layout.
 *
 * @exports metadata - Cung cấp metadata cho SEO với tiêu đề và mô tả trang.
 * @exports RootLayout - Component layout chính của ứng dụng.
 *
 * @notes
 * - Có code bị comment liên quan đến việc kiểm tra đường dẫn admin.
 * - Sử dụng AuthModalProvider để quản lý trạng thái modal xác thực.
 * - Sử dụng CartProvider để quản lý trạng thái giỏ hàng xuyên suốt ứng dụng.
 */
import Footer from "@/components/footer";
import Navbar from "@/components/ui/navigation/navbar";
import { CartProvider } from "@/context/cart-context";
import { AuthModalProvider } from "@/context/modal-context";
import type { Metadata } from "next";
import React from "react";
import "../../styles/globals.css";
import { GeoLocationProvider } from "@/context/geolocation-context";

export const metadata: Metadata = {
  title: "Project Beauty Academy",
  description: "Khóa học làm đẹp, số học",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const pathname = usePathname();
  // const isAdminPanel = pathname.startsWith("/admin");
  return (
    <>
      <AuthModalProvider>
        <CartProvider>
          <GeoLocationProvider>
            {<Navbar />}
            {children}
          </GeoLocationProvider>

        </CartProvider>
      </AuthModalProvider>
      <Footer />
    </>
  );
}
