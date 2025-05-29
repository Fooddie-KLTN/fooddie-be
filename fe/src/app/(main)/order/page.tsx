"use client";

import { JSX, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  BadgeCheck,
  ClockIcon,
  Store,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { Order } from "@/interface";
import { userApi } from "@/api/user";
import { PaginatedResponse } from "@/api/response.interface";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  canceled: "Đã hủy",
  processing_payment: "Đang xử lý thanh toán", // NEW
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivering: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-700",
  processing_payment: "bg-purple-100 text-purple-700", // NEW
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  pending: <ClockIcon className="w-4 h-4" />,
  confirmed: <Package className="w-4 h-4" />,
  delivering: <Truck className="w-4 h-4" />,
  completed: <BadgeCheck className="w-4 h-4" />,
  canceled: <XCircle className="w-4 h-4" />,
  processing_payment: <ClockIcon className="w-4 h-4" />, // NEW (choose icon as you like)
};

//const CURRENT_STATUSES = ["pending", "confirmed", "delivering", "processing_payment"];
const HISTORY_STATUSES = ["completed", "canceled"];
const PAGE_SIZE = 5;

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-xl shadow border p-4 mb-4">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
    <div className="h-3 bg-gray-100 rounded w-1/4 mb-2"></div>
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  </div>
);

const OrderPage = () => {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyStatus, setHistoryStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // Fetch current orders (not completed/canceled)
  useEffect(() => {
    if (tab !== "current") return;
    setLoading(true);
    const fetchCurrentOrders = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await userApi.order.getMyOrders(token, 1, 50);
        setCurrentOrders(
          res.items.filter(
            (order) =>
              order.status !== "completed" && order.status !== "canceled"
          )
        );
      } catch {
        setCurrentOrders([]);
      }
      setLoading(false);
    };
    fetchCurrentOrders();
  }, [tab, getToken]);

  // Fetch history orders (paginated, filtered)
  useEffect(() => {
    if (tab !== "history") return;
    setLoading(true);
    const fetchHistoryOrders = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const statusParam = historyStatus ? historyStatus : undefined;
        const res: PaginatedResponse<Order> = await userApi.order.getMyOrders(
          token,
          historyPage,
          PAGE_SIZE,
          statusParam
        );
        setHistoryOrders(
          res.items.filter((order) =>
            HISTORY_STATUSES.includes(order.status || "")
          )
        );
        setHistoryTotalPages(res.totalPages || 1);
      } catch {
        setHistoryOrders([]);
        setHistoryTotalPages(1);
      }
      setLoading(false);
    };
    fetchHistoryOrders();
  }, [tab, historyPage, historyStatus, getToken]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Đơn hàng của tôi</h2>
      <div className="flex border-b mb-6">
        <button
          className={`flex-1 py-3 text-center font-medium transition ${
            tab === "current"
              ? "border-b-2 border-green-500 text-green-600 bg-white"
              : "text-gray-500 bg-gray-50 hover:bg-gray-100"
          }`}
          onClick={() => setTab("current")}
        >
          Đang xử lý
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium transition ${
            tab === "history"
              ? "border-b-2 border-green-500 text-green-600 bg-white"
              : "text-gray-500 bg-gray-50 hover:bg-gray-100"
          }`}
          onClick={() => setTab("history")}
        >
          Lịch sử
        </button>
      </div>

      {tab === "current" && (
        <div>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : currentOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Store className="mx-auto mb-2 w-10 h-10 opacity-40" />
              Không có đơn hàng đang xử lý.
            </div>
          ) : (
            <div className="grid gap-4">
              {currentOrders.map((order) => (
                <Link href={`/order/${order.id}`} key={order.id}>
                  <Card className="rounded-xl shadow border hover:shadow-lg transition cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">
                          {order.restaurant?.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {order.createdAt ? formatDate(order.createdAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[
                            order.status || "pending"
                          ]}`}
                        >
                          {STATUS_ICONS[order.status || "pending"]}
                          <span className="ml-1">
                            {
                              STATUS_LABELS[order.status || ""] ||
                              order.status ||
                              ""
                            }
                          </span>
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Tổng:{" "}
                        <span className="text-green-600">
                          {formatPrice(order.total || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Lọc theo trạng thái:</span>
            <Select
              value={historyStatus || "all"}
              onValueChange={(value) => {
                setHistoryStatus(value === "all" ? "" : value);
                setHistoryPage(1);
              }}
            >
              <SelectTrigger className="w-40" aria-label="Lọc theo trạng thái">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="canceled">Đã hủy</SelectItem>
                <SelectItem value="processing_payment">Đang xử lý thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : historyOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Store className="mx-auto mb-2 w-10 h-10 opacity-40" />
              Không có đơn hàng lịch sử.
            </div>
          ) : (
            <div className="grid gap-4">
              {historyOrders.map((order) => (
                <Link href={`/order/${order.id}`} key={order.id}>
                  <Card className="rounded-xl shadow border hover:shadow-lg transition cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">
                          {order.restaurant?.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {order.createdAt ? formatDate(order.createdAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[
                            order.status || "pending"
                          ]}`}
                        >
                          {STATUS_ICONS[order.status || "pending"]}
                          <span className="ml-1">
                            {
                              STATUS_LABELS[order.status || ""] ||
                              order.status ||
                              ""
                            }
                          </span>
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Tổng:{" "}
                        <span className="text-green-600">
                          {formatPrice(order.total || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-4 py-2 rounded border bg-white shadow-sm hover:bg-green-50 disabled:opacity-50"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang{" "}
              <span className="font-semibold">{historyPage}</span> /{" "}
              {historyTotalPages}
            </span>
            <button
              className="px-4 py-2 rounded border bg-white shadow-sm hover:bg-green-50 disabled:opacity-50"
              disabled={historyPage >= historyTotalPages}
              onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;