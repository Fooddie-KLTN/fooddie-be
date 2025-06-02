'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation'; // Add this import
import { useOrderCreatedSubscription } from '@/hooks/use-order-subscription';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { Order } from '@/interface';
import { Bell, Clock, User, MapPin, CheckCircle, Package, XCircle, History, Filter } from 'lucide-react';

export default function OrderListPage() {
  const { getToken } = useAuth();
  const params = useParams(); // Get params from URL
  const restaurantId = params.id as string; // Get restaurant ID directly from URL params
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/receive.mp3');
      audioRef.current.volume = 0.7;
    }
  }, []);

  // Fetch all orders for the restaurant
  useEffect(() => {
    const fetchAllOrders = async () => {
      if (!restaurantId) return;
      
      try {
        setLoading(true);
        const token = getToken();
        if (token) {
          // Use the new API that gets orders by authenticated user's restaurant
          const response = await userApi.order.getOrdersByMyRestaurant(token, 1, 50);
          console.log('Fetched orders:', response);
          setAllOrders(response.items || []);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [restaurantId, getToken]); // Now depend on both restaurantId and getToken
  
  const { newOrders, loading: subscriptionLoading, error, clearNewOrders } = useOrderCreatedSubscription(
    restaurantId || ''
  );
  
  // Handle new orders with notification sound
  useEffect(() => {
    if (newOrders && newOrders.length > 0) {
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Could not play sound:', e));
      }

      // Update orders list and avoid duplicates
      setOrders(prev => {
        const existingIds = new Set(prev.map(order => order.id));
        const uniqueNewOrders = newOrders.filter(order => !existingIds.has(order.id));
        return [...uniqueNewOrders, ...prev];
      });

      // Also update allOrders list
      setAllOrders(prev => {
        const existingIds = new Set(prev.map(order => order.id));
        const uniqueNewOrders = newOrders.filter(order => !existingIds.has(order.id));
        return [...uniqueNewOrders, ...prev];
      });
      
      clearNewOrders();
    }
  }, [newOrders, clearNewOrders]);

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId));
      
      const token = getToken();
      if (!token) {
        throw new Error('Không có token xác thực');
      }

      await userApi.order.updateOrderStatus(token, orderId, newStatus);
      
      // Update local state for both lists
      const updateOrderInList = (orderList: Order[]) => 
        orderList.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        );

      setOrders(updateOrderInList);
      setAllOrders(updateOrderInList);

      console.log(`Đã cập nhật trạng thái đơn hàng thành: ${newStatus}`);
      
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Filter orders based on status
  const filteredOrders = allOrders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'confirmed': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'delivering': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-600 border-green-200';
      case 'canceled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusButton = (order: Order) => {
    const isUpdating = updatingOrders.has(order.id);
    
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button 
              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1"
            >
              <CheckCircle className="h-3 w-3" />
              <span>{isUpdating ? 'Đang xử lý...' : 'Xác nhận'}</span>
            </button>
            <button 
              onClick={() => handleUpdateOrderStatus(order.id, 'canceled')}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1"
            >
              <XCircle className="h-3 w-3" />
              <span>Hủy</span>
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <span className="text-xs text-gray-500 italic flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-blue-600" />
            <span>Đã xác nhận</span>
          </span>
        );
      case 'delivering':
        return (
          <button 
            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1"
          >
            <Package className="h-3 w-3" />
            <span>{isUpdating ? 'Đang xử lý...' : 'Hoàn thành'}</span>
          </button>
        );
      default:
        return (
          <span className="text-xs text-gray-500 italic">
            Đã hoàn tất
          </span>
        );
    }
  };

  const OrderCard = ({ order, isNewOrder = false }: { order: Order; isNewOrder?: boolean }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${isNewOrder ? 'ring-2 ring-orange-200' : ''}`}>
      {/* Order Header */}
      <div className={`${isNewOrder ? 'bg-gradient-to-r from-orange-50 to-red-50' : 'bg-gray-50'} px-4 py-3 border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded shadow-sm">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">#{order.id.slice(-8)}</h3>
              <p className="text-xs text-gray-600">{formatDate(order.createdAt)} - {formatTime(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status || 'pending')}`}>
              {order.status?.toUpperCase() || 'PENDING'}
            </span>
            {getStatusButton(order)}
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer & Address */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-sm">{order.user?.name || 'Ẩn danh'}</span>
              {order.user?.phone && (
                <span className="text-xs text-gray-500">({order.user.phone})</span>
              )}
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-600 line-clamp-2">
                {order.address ? 
                  [order.address.street, order.address.ward, order.address.district, order.address.city]
                    .filter(Boolean)
                    .join(', ') 
                  : 'Chưa có địa chỉ'
                }
              </p>
            </div>
          </div>

          {/* Order Details & Total */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tổng tiền:</span>
              <span className="text-lg font-bold text-orange-600">
                {(order.total || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {order.orderDetails?.length || 0} món
            </div>
            
            {/* Order Items Preview */}
            {order.orderDetails && order.orderDetails.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {order.orderDetails.slice(0, 2).map((item, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                    {item.quantity}x {item.food?.name}
                  </span>
                ))}
                {order.orderDetails.length > 2 && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                    +{order.orderDetails.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải thông tin nhà hàng...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* NEW ORDERS SECTION */}
        <div>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Đơn hàng mới</h1>
                  <p className="text-gray-600">Đơn hàng vừa nhận được từ khách hàng</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{orders.length}</div>
                <div className="text-sm text-gray-500">Đơn hàng chờ xử lý</div>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">Lỗi kết nối: {error.message}</span>
              </div>
            </div>
          )}

          {subscriptionLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium">Đang đợi đơn hàng mới...</span>
              </div>
            </div>
          )}

          {/* New Orders List */}
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map(order => (
                <OrderCard key={order.id} order={order} isNewOrder={true} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng mới</h3>
                <p className="text-gray-600">Các đơn hàng mới sẽ xuất hiện ở đây khi khách hàng đặt</p>
              </div>
            )}
          </div>
        </div>

        {/* ALL ORDERS SECTION */}
        <div>
          {/* Header with Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <History className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tất cả đơn hàng</h2>
                  <p className="text-gray-600">Lịch sử đơn hàng của nhà hàng</p>
                </div>
              </div>
              
              {/* Filter */}
              <div className="flex items-center space-x-3">
                <Filter className="h-4 w-4 text-gray-400" />
                <select 
                  title='Lọc theo trạng thái'
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="delivering">Đang giao</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="canceled">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* All Orders List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng nào</h3>
                  <p className="text-gray-600">
                    {statusFilter === 'all' 
                      ? 'Chưa có đơn hàng nào trong hệ thống'
                      : `Không có đơn hàng nào với trạng thái "${statusFilter}"`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}