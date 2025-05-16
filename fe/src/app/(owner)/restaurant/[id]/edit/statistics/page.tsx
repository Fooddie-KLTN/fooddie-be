"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { BarChart as BarChartIcon, Trophy, ShoppingBag } from "lucide-react";
import { userApi } from "@/api/user";
import { useAuth } from "@/context/auth-context";
import LineChart from "@/components/ui/chart/line-chart";
import BarChart from "@/components/ui/chart/bar-chart";

interface TopFood {
  id: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

export default function StatisticsPage() {
  const params = useParams();
  const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [topFoods, setTopFoods] = useState<TopFood[]>([]);

  // Example: Generate labels for days in month (1-30)
  const labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);

  // TODO: Replace these with real API data
  const orderData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 1);
  const revenueData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000000) + 100000);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);

    const token = getToken();
    if (!token) {
        setLoading(false);
        return;
        }

    // Replace these with your actual API calls
    Promise.all([
      userApi.restaurant.getOrderCountByMonth(token,restaurantId),
      userApi.restaurant.getRevenueByMonth(token,restaurantId),
      userApi.restaurant.getTopFoods(restaurantId),
    ])
      .then(([orderCount, revenue, topFoods]) => {
        setOrderCount(orderCount);
        setRevenue(revenue);
        setTopFoods(topFoods);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loader" />
        <span className="ml-3 text-primary">Đang tải thống kê...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Thống kê nhà hàng</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="flex flex-col items-center p-6">
          <ShoppingBag className="text-blue-500 mb-2" size={32} />
          <div className="text-lg font-semibold">{orderCount}</div>
          <div className="text-gray-500">Đơn hàng trong tháng</div>
        </Card>
        <Card className="flex flex-col items-center p-6">
          <BarChartIcon className="text-green-500 mb-2" size={32} />
          <div className="text-lg font-semibold">
            {revenue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
          </div>
          <div className="text-gray-500">Doanh thu trong tháng</div>
        </Card>
        <Card className="flex flex-col items-center p-6">
          <Trophy className="text-yellow-500 mb-2" size={32} />
          <div className="text-lg font-semibold">{topFoods[0]?.name || "--"}</div>
          <div className="text-gray-500">Món bán chạy nhất</div>
        </Card>
      </div>

      {/* Chart section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Đơn hàng theo ngày</h3>
          <LineChart data={orderData} labels={labels} label="Đơn hàng" color="#3b82f6" fillColor="rgba(59, 130, 246, 0.2)" />
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-4">Doanh thu theo ngày</h3>
          <BarChart data={revenueData} labels={labels} label="Doanh thu" backgroundColor="#22c55e" />
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">Top món ăn bán chạy</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topFoods.map((food) => (
          <Card key={food.id} className="flex items-center p-4">
            <img
              src={food.image}
              alt={food.name}
              className="w-16 h-16 object-cover rounded-lg mr-4"
            />
            <div>
              <div className="font-semibold">{food.name}</div>
              <div className="text-gray-500 text-sm">
                Đã bán: {food.soldCount} | Doanh thu:{" "}
                {food.revenue.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}