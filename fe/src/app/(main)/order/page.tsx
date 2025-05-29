// src/app/(main)/order/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, ClockIcon } from "lucide-react";
import { AddressList } from '@/app/(main)/profile/_components/address-list';

const OrderPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const { getToken, user } = useAuth(); 

//   useEffect(() => {
//     const fetchOrders = async () => {
//       const token = await getToken();
//       if (!token) return;
  
//       try {
//         const res = await adminService.Order.getMyOrders(token); // token thôi, không cần userId
//         setOrders(res);
//       } catch (err) {
//         console.error("Failed to fetch orders", err);
//       }
//     };
  
//     fetchOrders();
//   }, []);

useEffect(() => {
    const fakeData = [
      {
        id: "order1",
        restaurant: {
          name: "Trà Sữa Mộc",
        },
        createdAt: new Date().toISOString(),
        status: "delivering",
        total: "95000",
      },
      {
        id: "order2",
        restaurant: {
          name: "Cơm Tấm Nguyễn Văn Cừ",
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // hôm qua
        status: "completed",
        total: "65000",
      },
      {
        id: "order3",
        restaurant: {
          name: "Bún Bò Huế Ông Già",
        },
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 ngày trước
        status: "canceled",
        total: "80000",
      },
    ];
  
    setOrders(fakeData);
  }, []);
  
  
  

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Đơn hàng đã đặt</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
      ) : (
        orders.map((order) => (
          <Link href={`/order/${order.id}`} key={order.id}>
            <Card className="hover:shadow-lg transition">
              <CardContent className="p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{order.restaurant?.name}</h3>
                  <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {order.status === 'delivering' ? (
                    <div className="flex items-center gap-1 text-blue-500">
                      <ClockIcon className="w-4 h-4" /> Đang giao
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-green-500">
                      <BadgeCheck className="w-4 h-4" /> {order.status}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium">Tổng: {formatPrice(order.total)}</div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
};

export default OrderPage;
