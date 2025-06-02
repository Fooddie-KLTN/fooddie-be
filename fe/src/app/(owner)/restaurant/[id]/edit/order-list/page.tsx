'use client';

import { useState, useEffect } from 'react';
import { useOrderCreatedSubscription } from '@/hooks/use-order-subscription';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { Order } from '@/interface';

export default function OrderListPage() {
  const { getToken } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  // Tách việc lấy restaurant ID ra một effect riêng
  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const token = getToken();
        if (token) {
          const res = await userApi.restaurant.getMyRestaurant(token);
          if (res && res.id) {
            setRestaurantId(res.id);
          } else {
            console.error('Không tìm thấy nhà hàng');
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin nhà hàng:', error);
      }
    };

    fetchRestaurantId();
  }, [getToken]); // Thêm getToken vào dependency array
  
  const { newOrders, loading, error, clearNewOrders } = useOrderCreatedSubscription(
    restaurantId || ''
  );
  
  // Đơn hàng hiện tại (có thể được tải từ API riêng)
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Khi có đơn hàng mới, cập nhật danh sách và hiện thông báo
  useEffect(() => {
    if (newOrders && newOrders.length > 0) {
      // Cập nhật danh sách đơn hàng
      setOrders(prev => [...newOrders, ...prev]);
      
      // Có thể thêm âm thanh thông báo ở đây
      
      // Xóa danh sách thông báo mới sau khi đã xử lý
      clearNewOrders();
    }
  }, [newOrders, clearNewOrders]);
  
  if (!restaurantId) return <div>Đang tải thông tin nhà hàng...</div>;
  
  return (
    <div>
      <h1>Đơn hàng mới</h1>
      
      {error && <div className="error">Lỗi kết nối: {error.message}</div>}
      {loading && <div>Đang kết nối đến server...</div>}
      
      {/* Hiển thị đơn hàng */}
      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order.id} className="order-item">
              <h3>Đơn hàng #{order.id}</h3>
              <p>Khách hàng: {order.user?.name || 'Không có tên'}</p>
              <p>Tổng tiền: {(order.total || 0).toLocaleString()}đ</p>
              <p>Trạng thái: {order.status || 'Chưa xác định'}</p>
              <button>Xem chi tiết</button>
            </div>
          ))
        ) : (
          <p>Chưa có đơn hàng nào</p>
        )}
      </div>
    </div>
  );
}