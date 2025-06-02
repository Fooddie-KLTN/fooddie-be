/* eslint-disable @typescript-eslint/no-explicit-any */
import { Restaurant, FoodDetail, UserProfile, Order } from "@/interface";
import { apiRequest } from "./base-api";
import { CalculateOrderResponse, OrderResponse, PaginatedResponse } from "./response.interface";

/**
 * Interface for updating user information
 * Matches the backend UpdateUserDto structure
 */
interface UpdateUserDto {
  username?: string;
  password?: string;
  email?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  birthday?: Date;
  // Remove address as string since it's an entity relationship in backend
}

/**
 * Interface for restaurant response
 */
export interface RestaurantResponse {
  data: Restaurant | null;
  message?: string;
  statusCode?: number;
}



/**
 * Dịch vụ API cho người dùng đã xác thực
 * 
 * Cung cấp các phương thức để thực hiện các thao tác liên quan đến tài khoản người dùng
 * như lấy thông tin và cập nhật thông tin cá nhân.
 * 
 * @namespace
 */
export const userApi = {
  /**
   * Lấy thông tin của người dùng hiện tại (AuthGuard)
   */
  async getMe(token: string): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>('/users/me', 'GET', { token });
    if (res && (res as any).data) return (res as any).data as UserProfile;
    return res as UserProfile;
  },

  /**
   * Cập nhật thông tin của người dùng hiện tại (AuthGuard)
   */
  async updateMe(token: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>('/users/me', 'PUT', { token, data });
    if (res && (res as any).data) return (res as any).data as UserProfile;
    return res as UserProfile;
  },
  /**
   * Lấy danh sách tất cả người dùng (chỉ admin)
   * 
   * @param {string} token - Token xác thực của admin
   * @returns {Promise<any>} Danh sách người dùng
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền
   */
  async getAll(token: string) {
    try {
      return await apiRequest('users', 'GET', { token });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết của một người dùng theo ID (chỉ admin)
   * 
   * @param {string} token - Token xác thực của admin
   * @param {string} id - ID của người dùng cần xem
   * @returns {Promise<any>} Thông tin chi tiết của người dùng
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền
   */
  async getUserById(token: string, id: string) {
    try {
      return await apiRequest(`users/${id}`, 'GET', { token });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  /**
   * Tạo người dùng mới (chỉ admin)
   * 
   * @param {string} token - Token xác thực của admin
   * @param {UpdateUserDto} data - Thông tin người dùng mới
   * @returns {Promise<any>} Thông tin người dùng đã tạo
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền
   */
  async createUser(token: string, data: UpdateUserDto) {
    try {
      return await apiRequest('users', 'POST', { token, data });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin người dùng (chỉ admin)
   * 
   * @param {string} token - Token xác thực của admin
   * @param {string} id - ID của người dùng cần cập nhật
   * @param {UpdateUserDto} data - Thông tin cần cập nhật
   * @returns {Promise<any>} Thông tin người dùng sau khi cập nhật
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền
   */
  async updateUser(token: string, id: string, data: UpdateUserDto) {
    try {
      return await apiRequest(`users/${id}`, 'PUT', { token, data });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  /**
   * Xóa người dùng (chỉ admin)
   * 
   * @param {string} token - Token xác thực của admin
   * @param {string} id - ID của người dùng cần xóa
   * @returns {Promise<any>} Kết quả xóa
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền
   */
  async deleteUser(token: string, id: string) {
    try {
      return await apiRequest(`/users/${id}`, 'DELETE', { token });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  restaurant: {
    async getMyRestaurant(token: string): Promise<Restaurant> {
      try {
        const response = await apiRequest("/restaurants/my", "GET", { token });
        return response as Restaurant;
      } catch (error) {
        console.error('Restaurant API error:', error);
        throw error;
      }
    },

    async createRestaurant(token: string, data: any) {
      try {
        return await apiRequest("/restaurants/request", "POST", { token, data });
      } catch (error) {
        console.error('Restaurant API error:', error);
        throw error;
      }
    },

    async createRestaurantWithFiles(token: string, formData: FormData) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/restaurants/request`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type with FormData - browser will set it with boundary
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to create restaurant');
        }

        return await response.json();
      } catch (error) {
        console.error('Restaurant API error:', error);
        throw error;
      }
    },

    async updateRestaurant(token: string, id: string, formData: FormData) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/restaurants/${id}/files`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to update restaurant');
        }

        return await response.json();
      } catch (error) {
        console.error('Restaurant API error:', error);
        throw error;
      }
    },
    async getOrderCountByMonth(token: string, month?: string) {
      return await apiRequest<number>(
        "/restaurants/my/order-count-by-month",
        "GET",
        {
          token,
          query: month ? { month } : undefined,
        }
      );
    },

    async getRevenueByMonth(token: string, month?: string) {
      return await apiRequest<number>(
        "/restaurants/my/revenue-by-month",
        "GET",
        {
          token,
          query: month ? { month } : undefined,
        }
      );
    },

    async getTopFoods(restaurantId: string) {
      // You need to implement this endpoint in your backend!
      const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/foods/top?restaurantId=${restaurantId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch top foods");
      return await res.json();
    },
  },
  food: {
    async getFoodsByRestaurant(restaurantId: string) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/foods/restaurant/${restaurantId}?page=1&pageSize=50`
      );
      if (!res.ok) throw new Error("Failed to fetch foods");
      const data = await res.json();
      return data.items;
    },

    async createFood(token: string, data: any) {
      try {
        return await apiRequest("/foods", "POST", { token, data });
      } catch (error) {
        console.error("Food API error:", error);
        throw error;
      }
    },

    async updateFood(token: string, id: string, data: any) {
      try {
        return await apiRequest(`/foods/${id}`, "PUT", { token, data });
      } catch (error) {
        console.error("Food API error:", error);
        throw error;
      }
    },

    async getFoodById(token: string, foodId: string): Promise<FoodDetail> {
      try {
        return await apiRequest<FoodDetail>(`/foods/${foodId}`, "GET", { token });
      } catch (error) {
        console.error("Food API error:", error);
        throw error;
      }
    },

    async deleteFood(token: string, id: string) {
      try {
        return await apiRequest(`/foods/${id}`, "DELETE", { token });
      } catch (error) {
        console.error("Food API error:", error);
        throw error;
      }
    },

    async updateFoodStatus(token: string, id: string, status: string) {
      try {
        return await apiRequest(`/foods/${id}/status`, "PUT", { token, data: { status } });
      } catch (error) {
        console.error("Food API error:", error);
        throw error;
      }
    },
  },
  order: {
    /**
     * Tạo đơn hàng mới
     * @param {string} token - Token xác thực
     * @param {any} data - Dữ liệu đơn hàng (Order)
     */
    async createOrder(token: string, data: any): Promise<OrderResponse> {
      try {
        return await apiRequest<OrderResponse>('/orders', 'POST', { token, data });
      } catch (error) {
        console.error('Order API error:', error);
        throw error;
      }
    },
    /**
     * Tinhs toán tổng giá trị đơn hàng
     * @param {string} addressId - Dịa chỉ giao hàng
     * @param {string} restaurantId - ID của nhà hàng
     * @param {string} items : { foodId: string, quantity: number }[] - Danh sách các món ăn trong đơn hàng
     * @return {Promise<CalculateOrderResponse>} - Kết quả tính toán tổng giá trị đơn hàng
     */
    async calculateOrder(addressId: string, restaurantId: string, items: { foodId: string, quantity: number }[]): Promise<any> {
      try {
        return await apiRequest<CalculateOrderResponse>('/orders/calculate', 'POST', { data: { addressId, restaurantId, items } });
      } catch (error) {
        console.error('Order API error:', error);
        throw error;
      }
    },
    /**
     * Lấy danh sách đơn hàng của người dùng
     * @param {string} token - Token xác thực
     * @param {number} page - Số trang (mặc định 1)
     * @param {number} pageSize - Số lượng đơn hàng trên mỗi trang (mặc định 10)
     * @param {string} status - Trạng thái đơn hàng (tùy chọn)
     * @return {Promise<PaginatedResponse>} - Danh sách đơn hàng
     */
    async getMyOrders(token: string, page: number = 1, pageSize: number = 10, status?: string): Promise<PaginatedResponse<Order>> {
      try {
        return await apiRequest<PaginatedResponse<Order>>(`/orders/my?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`, 'GET', { token });
      } catch (error) {
        console.error('Order API error:', error);
        throw error;
      }
    },
    /**
     * Lấy tất cả đơn hàng của nhà hàng do user sở hữu
     * @param {string} token - Token xác thực
     * @param {number} page - Số trang (mặc định 1)
     * @param {number} pageSize - Số lượng đơn hàng trên mỗi trang (mặc định 10)
     * @param {string} status - Trạng thái đơn hàng (tùy chọn)
     * @return {Promise<PaginatedResponse<Order>>} - Danh sách đơn hàng của nhà hàng
     */
    async getOrdersByMyRestaurant(
      token: string, 
      page: number = 1, 
      pageSize: number = 10, 
      status?: string
    ): Promise<PaginatedResponse<Order>> {
      try {
        const queryString = `page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`;
        return await apiRequest<PaginatedResponse<Order>>(
          `/orders/restaurant/my?${queryString}`, 
          'GET', 
          { token }
        );
      } catch (error) {
        console.error('Get orders by restaurant API error:', error);
        throw error;
      }
    },
    /**
     * Cập nhật trạng thái đơn hàng (chỉ owner nhà hàng)
     * @param {string} token - Token xác thực
     * @param {string} orderId - ID đơn hàng
     * @param {string} status - Trạng thái mới ('confirmed', 'delivering', 'completed', 'canceled')
     * @return {Promise<Order>} - Đơn hàng đã được cập nhật
     */
    async updateOrderStatus(token: string, orderId: string, status: string): Promise<Order> {
      try {
        return await apiRequest<Order>(`/orders/${orderId}/status`, 'PUT', { 
          token, 
          data: { status } 
        });
      } catch (error) {
        console.error('Update order status API error:', error);
        throw error;
      }
    },
  }

};