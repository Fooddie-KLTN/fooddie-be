"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { OrderDetail } from "@/interface";

// Map chỉ load khi client-side
const Map = dynamic(() => import("@/components/common/map"), { ssr: false });

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      const token = await getToken();
      if (!token || !orderId) return;

      try {
        const res = await adminService.Order.getOrderById(token, orderId);

        // const transformedOrder: OrderDetail = {
        //   id: res.id,
        //   status: res.status,
        //   createdAt: res.createdAt,
        //   totalAmount: Number(res.total),
        //   restaurant: {
        //     name: res.restaurant?.name || "Không rõ",
        //     location: res.restaurant?.location || "Không rõ",
        //   },
        //   shippingAddress: res.address?.location || "Không rõ địa chỉ",
        //   foodDetails: res.orderDetails.map((item) => ({
        //     name: item.food?.name || "Món ăn",
        //     quantity: Number(item.quantity),
        //     price: Number(item.price),
        //   })),
        // };

        // setOrder(transformedOrder);

        const fakeOrder: OrderDetail = {
          id: "test123",
          status: "delivering",
          createdAt: new Date().toISOString(),
          totalAmount: 128000,
          restaurant: {
            name: "Bánh Mì PewPew",
            location: "10.762622,106.660172", // fake tọa độ (TPHCM)
          },
          shippingAddress: "10.776889,106.700806", // fake tọa độ (Quận 1)
          foodDetails: [
            { name: "Bánh mì chả cá", quantity: 2, price: 30000 },
            { name: "Bánh mì đặc biệt", quantity: 1, price: 38000 },
            { name: "Trà tắc", quantity: 1, price: 30000 },
          ],
        };
        
        setOrder(fakeOrder);
        
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!order) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Không tìm thấy đơn hàng.
      </p>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Chi tiết đơn hàng #{order.id}</h2>
      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <div>
          <strong>Trạng thái:</strong> {order.status}
        </div>
        <div>
          <strong>Ngày đặt:</strong>{" "}
          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
        </div>
        <div>
          <strong>Nhà hàng:</strong> {order.restaurant.name}
        </div>
        <div>
          <strong>Giao tới:</strong> {order.shippingAddress}
        </div>
        <div>
          <strong>Tổng tiền:</strong> {order.totalAmount.toLocaleString()}đ
        </div>
        <div>
          <strong>Chi tiết món ăn:</strong>
          <ul className="list-disc ml-5">
            {order.foodDetails.map((f, idx) => (
              <li key={idx}>
                {f.name} × {f.quantity} — {f.price.toLocaleString()}đ
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Theo dõi bản đồ</h3>
        <div className="w-full h-[300px] overflow-hidden rounded-xl">
          <Map from={order.restaurant.location} to={order.shippingAddress} />
        </div>
      </div>

      <Button variant="outline" onClick={() => router.back()}>
        Quay lại
      </Button>
    </div>
  );
}
