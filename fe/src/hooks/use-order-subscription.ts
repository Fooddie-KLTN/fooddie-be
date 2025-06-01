import {useState } from 'react';
import { useSubscription } from '@apollo/client';
import { ORDER_CREATED_SUBSCRIPTION } from '@/lib/graphql/subcriptions/orderSubcriptions';
import { Order } from '@/interface';

export function useOrderCreatedSubscription(restaurantId: string) {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  
  const {  loading, error } = useSubscription(ORDER_CREATED_SUBSCRIPTION, {
    variables: { restaurantId },
    onData: ({ data }) => {
      if (data?.data?.orderCreated) {
        // Thêm đơn hàng mới vào state
        setNewOrders(prev => [data.data.orderCreated, ...prev]);
        
        // Có thể phát thông báo âm thanh hoặc hiển thị toast notification ở đây
        // playNotificationSound();
        // showToast('Bạn có đơn hàng mới!');
      }
    },
  });

  return {
    newOrders,
    loading,
    error,
    clearNewOrders: () => setNewOrders([])
  };
}