import type { Metadata } from "next";
import { NextFont } from "next/dist/compiled/@next/font";
import { Montserrat } from "next/font/google";
import React from "react";
import "../styles/globals.css";
import { AuthProvider } from "@/context/auth-context";

const montserrat: NextFont = Montserrat({ 
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat"
});
export const metadata: Metadata = {
  title: "Fooddie - Food Delivery App",
  description: "Ứng dụng giao đồ ăn trực tuyến, nhanh chóng và tiện lợi.",
  keywords: "giao đồ ăn, đặt món online, ứng dụng giao hàng, đồ ăn nhanh, dịch vụ giao đồ ăn",
};

/**
 * The root layout wraps the entire app and provides the HTML structure
 * and fonts, as well as the authentication provider.
 * @param {{ children: React.ReactNode }} props The children of the layout
 * @returns {JSX.Element} The root layout element
 */
/**
 * @component RootLayout
 * @description 
 * Component bố cục gốc cho ứng dụng.
 * Bố cục này bao bọc toàn bộ ứng dụng và thiết lập các cấu hình HTML cơ bản,
 * bao gồm ngôn ngữ trang, phông chữ Montserrat và AuthProvider.
 * 
 * @param {object} props - Props của component
 * @param {React.ReactNode} props.children - Các component con sẽ được render bên trong bố cục
 * 
 * @returns {JSX.Element} Element HTML gốc bao gồm AuthProvider và nội dung con
 * 
 * @example
 * // Sử dụng trong Next.js app router
 * // Tự động được sử dụng bởi Next.js
 * 
 * @note
 * Hiện tại có code bị comment liên quan đến kiểm tra đường dẫn admin
 * // const pathname = usePathname();
 * // const isAdminPanel = pathname.startsWith("/admin");
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const pathname = usePathname();
  // const isAdminPanel = pathname.startsWith("/admin");
  return (
    <html lang="vi">
      <body className={`${montserrat.className} antialiased`}>
        <AuthProvider>{children}
        </AuthProvider>
      </body>
    </html>
  );
}
