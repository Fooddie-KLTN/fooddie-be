// adminApi.ts
import { apiRequest } from "./base-api";

/**
 * Dữ liệu để tạo khóa học mới
 * @interface
 * @property {string} name - Tên khóa học
 * @property {string} lecturerId - ID của giảng viên phụ trách
 * @property {string} [type] - Loại khóa học (tùy chọn)
 * @property {number} [duration] - Thời lượng khóa học tính bằng giờ (tùy chọn)
 * @property {string} [shortDescription] - Mô tả ngắn gọn về khóa học (tùy chọn)
 * @property {string} [description] - Mô tả chi tiết về khóa học (tùy chọn)
 * @property {number} [price] - Giá khóa học (tùy chọn)
 */
interface CreateCourseDto {
    name: string;
    lecturerId: string;
    type?: string;
    duration?: number;
    shortDescription?: string;
    description?: string;
    price?: number;
}

/**
 * Dữ liệu để cập nhật khóa học
 * @interface
 * @property {string} [name] - Tên khóa học
 * @property {string} [lecturerId] - ID của giảng viên phụ trách
 * @property {string} [type] - Loại khóa học
 * @property {number} [duration] - Thời lượng khóa học tính bằng giờ
 * @property {string} [shortDescription] - Mô tả ngắn gọn về khóa học
 * @property {string} [description] - Mô tả chi tiết về khóa học
 * @property {number} [price] - Giá khóa học
 */
interface UpdateCourseDto {
    name?: string;
    lecturerId?: string;
    type?: string;
    duration?: number;
    shortDescription?: string;
    description?: string;
    price?: number;
}

/**
 * Thông tin người dùng trả về từ API
 * @interface
 * @property {string} id - Mã định danh của người dùng
 * @property {string} name - Tên người dùng
 * @property {string} email - Địa chỉ email của người dùng
 * @property {string} group - Nhóm học của người dùng
 * @property {number} courses - Số khóa học đã đăng ký
 * @property {string} createdAt - Ngày tạo tài khoản (đã định dạng)
 * @property {string} status - Trạng thái tài khoản (Active/Inactive)
 */
interface UserResponse {
    id: string;
    name: string;
    email: string;
    group: string;
    courses: number;
    createdAt: string;
    status: string;
}

/**
 * Kết quả trả về khi lấy danh sách người dùng
 * @interface
 * @property {UserResponse[]} data - Danh sách thông tin người dùng
 * @property {number} total - Tổng số người dùng trong hệ thống
 */
interface GetUsersResponse {
    data: UserResponse[]; 
    total: number;
}

/**
 * Thông tin về vai trò và quyền hạn
 * @interface
 * @property {string} role - Tên vai trò của người dùng
 * @property {string[]} permissions - Danh sách quyền hạn được cấp
 */
interface RoleResponse {
    role: string;
    permissions: string[];
}

/**
 * Thông tin khóa học trả về từ API
 * @interface
 * @property {string} id - Mã định danh của khóa học
 * @property {string} name - Tên khóa học
 * @property {string} lecturerId - ID của giảng viên phụ trách
 * @property {string} [type] - Loại khóa học
 * @property {number} [duration] - Thời lượng khóa học tính bằng giờ
 * @property {string} [shortDescription] - Mô tả ngắn gọn về khóa học
 * @property {string} [description] - Mô tả chi tiết về khóa học
 * @property {number} [price] - Giá khóa học
 */
interface CourseResponse {
    id: string;
    name: string;
    lecturerId: string;
    type?: string;
    duration?: number;
    shortDescription?: string;
    description?: string;
    price?: number;
}

interface StoreResponse {
    id: string;
    name: string;
    phoneNumber: string;
    address: string;
    status: 'pending' | 'approved' | 'rejected';
    location: string;
    createdAt: string;
    owner: string;
  }
  
  interface GetStoresResponse {
    items: StoreResponse[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }

  export interface CategoryResponse {
  id: string;
  name: string;
  image: string;
  foodCount: number; // Changed from foods: any[]
}
  
  interface GetCategoriesResponse {
    items: CategoryResponse[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  
  interface CreateCategoryDto {
    name: string;
    image: string;
  }

  export interface OrderResponse {
    id: string;
    status: string;
    createdAt: string;
    total: string;
    note: string;
    address: {
      location: string;
      fullName: string;
    };
    restaurant: {
      name: string;
      location: string;
    };
    orderDetails: {
      food: {
        name: string;
      };
      quantity: string;
      price: string;
      note: string;
    }[];
  }
  

/**
 * Các dịch vụ API cho phần quản trị hệ thống
 * 
 * Cung cấp các phương thức để tương tác với API backend cho các chức năng quản trị,
 * bao gồm quản lý người dùng, khóa học, và phân quyền.
 * 
 * @namespace
 */
export const adminService = {
    /**
     * Lấy thông tin vai trò và quyền hạn của người dùng hiện tại
     * 
     * @param {string} token - Token xác thực của admin
     * @returns {Promise<RoleResponse>} - Thông tin vai trò và danh sách quyền hạn
     * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền truy cập
     */
    async getMyRole(token: string): Promise<RoleResponse> {
        try {
            return await apiRequest<RoleResponse>('/role/user-role-and-permission', 'GET', { token });
        } catch (error) {
            console.error('Lỗi API quản trị:', error);
            throw error;
        }
    },

    /**
     * Các phương thức quản lý người dùng
     * 
     * @namespace
     */
    User: {
        /**
         * Lấy danh sách người dùng trong hệ thống
         * 
         * @param {string} token - Token xác thực của admin
         * @param {number} [page=1] - Số trang hiện tại
         * @param {number} [pageSize=10] - Số người dùng trên mỗi trang
         * @returns {Promise<GetUsersResponse>} - Danh sách người dùng và thông tin phân trang
         * @property {UserResponse[]} data - Danh sách thông tin người dùng
         * @property {number} total - Tổng số người dùng trong hệ thống
         * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền truy cập
         */
        async getUsers(token: string, page: number = 1, pageSize: number = 10): Promise<GetUsersResponse> {
            try {
                const response = await apiRequest<UserResponse[]>('/users', 'GET', { 
                    token,
                    query: { page, pageSize }
                });
                
                return {
                    data: response.map((user) => ({
                        id: user.id,
                        name: user.name || 'N/A',
                        email: user.email || 'N/A',
                        group: user.group || '-',
                        courses: user.courses || 0,
                        createdAt: new Date(user.createdAt).toLocaleDateString('vi-VN'),
                        status: user.status || 'Inactive'
                    })),
                    total: response.length // Hoặc sử dụng response.total nếu API cung cấp
                };
            } catch (error) {
                console.error('Lỗi API quản trị:', error);
                throw error;
            }
        },        
    },

    /**
     * Các phương thức quản lý khóa học
     * 
     * @namespace
     */
    Course: {
        /**
         * Tạo một khóa học mới
         * 
         * @param {string} token - Token xác thực của admin
         * @param {CreateCourseDto} data - Thông tin khóa học cần tạo
         * @returns {Promise<CourseResponse>} - Thông tin khóa học sau khi tạo
         * @throws {Error} Khi không thể kết nối với máy chủ hoặc dữ liệu không hợp lệ
         */
        async createCourse(token: string, data: CreateCourseDto): Promise<CourseResponse> {
            try {
                return await apiRequest<CourseResponse>('/courses', 'POST', { data, token });
            } catch (error) {
                console.error('Lỗi API quản trị:', error);
                throw error;
            }
        },

        /**
         * Cập nhật thông tin khóa học
         * 
         * @param {string} token - Token xác thực của admin
         * @param {string} id - ID của khóa học cần cập nhật
         * @param {UpdateCourseDto} data - Thông tin cần cập nhật
         * @returns {Promise<CourseResponse>} - Thông tin khóa học sau khi cập nhật
         * @throws {Error} Khi không thể kết nối với máy chủ hoặc không tìm thấy khóa học
         */
        async updateCourse(token: string, id: string, data: UpdateCourseDto): Promise<CourseResponse> {
            try {
                return await apiRequest<CourseResponse>(`/courses/${id}`, 'PUT', { data, token });
            } catch (error) {
                console.error('Lỗi API quản trị:', error);
                throw error;
            }
        },

        /**
         * Xóa một khóa học
         * 
         * @param {string} token - Token xác thực của admin
         * @param {string} id - ID của khóa học cần xóa
         * @returns {Promise<void>} - Không có dữ liệu trả về nếu thành công
         * @throws {Error} Khi không thể kết nối với máy chủ hoặc không tìm thấy khóa học
         */
        async deleteCourse(token: string, id: string): Promise<void> {
            try {
                return await apiRequest<void>(`/courses/${id}`, 'DELETE', { token });
            } catch (error) {
                console.error('Lỗi API quản trị:', error);
                throw error;
            }
        },
    },
    Store: {
      async getStores(
        token: string,
        page: number = 1,
        pageSize: number = 10,
        status?: string  // <-- thêm tham số lọc status
      ): Promise<GetStoresResponse> {
        try {
          return await apiRequest<GetStoresResponse>('/restaurants', 'GET', {
            token,
            query: {
              page,
              pageSize,
              ...(status ? { status } : {})  // chỉ thêm status nếu có
            }
          });
        } catch (error) {
          console.error("Lỗi API cửa hàng:", error);
          throw error;
        }
      }
    },
    

      Category: {
        async getCategories(
          token: string,
          page: number = 1,
          pageSize: number = 10
        ): Promise<GetCategoriesResponse> {
          try {
            return await apiRequest<GetCategoriesResponse>("/categories", "GET", {
              token,
              query: { page, pageSize },
            });
          } catch (error) {
            console.error("Lỗi API danh mục:", error);
            throw error;
          }
        },
    
        async createCategory(
          token: string,
          data: CreateCategoryDto
        ): Promise<CategoryResponse> {
          try {
            return await apiRequest<CategoryResponse>("/categories", "POST", {
              token,
              data,
            });
          } catch (error) {
            console.error("Lỗi tạo danh mục:", error);
            throw error;
          }
        },

        async updateCategory(
          token: string,
          id: string,
          data: Partial<{ name: string; image: string }>
        ): Promise<CategoryResponse> {
          try {
            return await apiRequest<CategoryResponse>(`/categories/${id}`, "PUT", {
              token,
              data,
            });
          } catch (error) {
            console.error("Lỗi cập nhật danh mục:", error);
            throw error;
          }
        },
    
        async deleteCategory(token: string, id: string): Promise<void> {
          try {
            await apiRequest<void>(`/categories/${id}`, "DELETE", {
              token,
            });
          } catch (error) {
            console.error("Lỗi xóa danh mục:", error);
            throw error;
          }
        },
      },
      Order: {
        async getOrdersByUser(token: string, userId: string): Promise<OrderResponse[]> {
          try {
            return await apiRequest<OrderResponse[]>(`/orders/user/${userId}`, 'GET', { token });
          } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng theo user:', error);
            throw error;
          }
        },
    
        async getOrderById(token: string, id: string): Promise<OrderResponse> {
          try {
            return await apiRequest<OrderResponse>(`/orders/${id}`, 'GET', { token });
          } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            throw error;
          }
        },

        async getMyOrders(token: string): Promise<OrderResponse[]> {
          return await apiRequest<OrderResponse[]>('/orders/my', 'GET', { token });
        },
      }
      
};