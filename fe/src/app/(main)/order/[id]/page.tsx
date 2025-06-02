"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Import đúng type từ API
import type { OrderResponse } from "@/api/admin";

// Map chỉ load khi client-side
const Map = dynamic(() => import("@/components/common/map"), { ssr: false });

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      const token = await getToken();
      if (!token || !orderId) return;

      try {
        const res = await adminService.Order.getOrderById(token, orderId);
        setOrder(res);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, getToken]);

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
          {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "--"}
        </div>
        <div>
          <strong>Khách hàng:</strong> {order.address?.fullName || "Ẩn danh"}
        </div>
        <div>
          <strong>Nhà hàng:</strong> {order.restaurant?.name || "--"}
        </div>
        <div>
          <strong>Địa chỉ nhà hàng:</strong> {order.restaurant?.location || "--"}
        </div>
        <div>
          <strong>Giao tới:</strong> {order.address?.location || "--"}
        </div>
        {order.note && (
          <div>
            <strong>Ghi chú:</strong> {order.note}
          </div>
        )}
        <div>
          <strong>Chi tiết món ăn:</strong>
          <ul className="list-disc ml-5 space-y-2">
            {order.orderDetails?.map((od, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div>
                  <div>
                    <span className="font-semibold">{od.food?.name}</span>
                  </div>
                  <div>
                    Số lượng: <span className="font-semibold">{od.quantity}</span>
                    {" | "}
                    Đơn giá:{" "}
                    <span className="font-semibold">
                      {Number(od.price).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {od.note && (
                    <div className="text-xs text-gray-500">Ghi chú: {od.note}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Tổng tiền:</strong>{" "}
          <span className="text-lg font-bold text-primary">
            {Number(order.total).toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Theo dõi bản đồ</h3>
        <div className="w-full h-[300px] overflow-hidden rounded-xl">
          <Map
            from={order.restaurant?.location || ""}
            to={order.address?.location || ""}
          />
        </div>
      </div>

      <Button variant="outline" onClick={() => router.back()}>
        Quay lại
      </Button>
    </div>
  );
}
