import { apiRequest } from "./base-api";

 
interface UpdateUserDto {
  username?: string;
  password?: string;
  email?: string;
  name?: string;
  address?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  birthday?: Date;

}

/**
 * Dịch vụ API cho người dùng đã xác thực
 * 
 * Cung cấp các phương thức để thực hiện các thao tác liên quan đến tài khoản người dùng
 * và tương tác với nội dung khóa học như cập nhật thông tin cá nhân, theo dõi tiến độ học tập,
 * đánh dấu hoàn thành bài học, và truy cập chi tiết khóa học.
 * 
 * @namespace
 */
export const userApi = {
  /**
   * Lấy thông tin của người dùng hiện tại
   * 
   * @param {string} token - Token xác thực của người dùng
   * @returns {Promise<any>} Thông tin chi tiết của người dùng đã đăng nhập
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc token không hợp lệ
   * 
   * @example
   * // Lấy thông tin của người dùng đang đăng nhập
   * try {
   *   const userInfo = await userApi.getMe(currentToken);
   *   console.log('Thông tin người dùng:', userInfo);
   * } catch (error) {
   *   console.error('Không thể lấy thông tin người dùng:', error);
   * }
   */
  async getMe(token: string) {
    try {
      return await apiRequest('users/me', 'GET', { token });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin của người dùng hiện tại
   * 
   * @param {string} token - Token xác thực của người dùng
   * @param {UpdateUserDto} data - Thông tin cần cập nhật
   * @returns {Promise<any>} Thông tin người dùng sau khi cập nhật
   * @throws {Error} Khi không thể kết nối với máy chủ, token không hợp lệ hoặc dữ liệu không hợp lệ
   * 
   * @example
   * // Cập nhật họ tên và số điện thoại của người dùng
   * try {
   *   const updatedUser = await userApi.updateMe(currentToken, {
   *     name: 'Nguyễn Văn A',
   *     phone: '0987654321'
   *   });
   *   console.log('Cập nhật thành công:', updatedUser);
   * } catch (error) {
   *   console.error('Không thể cập nhật thông tin:', error);
   * }
   */
  async updateMe(token: string, data: UpdateUserDto) {
    try {
      return await apiRequest('users/me', 'PUT', { token, data });
    } catch (error) {
      console.error('User API error:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu một nội dung khóa học là đã hoàn thành
   * 
   * @param {string} token - Token xác thực của người dùng
   * @param {string} courseId - Mã định danh của khóa học
   * @param {string} contentId - Mã định danh của nội dung cần đánh dấu hoàn thành
   * @returns {Promise<any>} Thông tin tiến độ sau khi cập nhật
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc token không hợp lệ
   * 
   * @example
   * // Đánh dấu một bài học là đã hoàn thành
   * try {
   *   const progress = await userApi.completeContent(
   *     currentToken,
   *     'course-123',
   *     'content-456'
   *   );
   *   console.log('Đã hoàn thành nội dung:', progress);
   * } catch (error) {
   *   console.error('Không thể đánh dấu hoàn thành:', error);
   * }
   */
  async completeContent(token: string, courseId: string, contentId: string) {
    try {
      return await apiRequest(`/courses/${courseId}/content/${contentId}/complete`, 'POST', { token });
    } catch (error) {
      console.error('Course API error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin tiến độ học tập của người dùng trong một khóa học
   * 
   * @param {string} token - Token xác thực của người dùng
   * @param {string} courseId - Mã định danh của khóa học cần kiểm tra tiến độ
   * @returns {Promise<any>} Chi tiết tiến độ học tập của người dùng trong khóa học
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc token không hợp lệ
   * 
   * @example
   * // Kiểm tra tiến độ của người dùng trong một khóa học
   * try {
   *   const progressInfo = await userApi.getProgress(currentToken, 'course-123');
   *   console.log('Tiến độ học tập:', progressInfo);
   * } catch (error) {
   *   console.error('Không thể lấy tiến độ học tập:', error);
   * }
   */
  async getProgress(token: string, courseId: string) {
    try {
      return await apiRequest(`/courses/${courseId}/progress`, 'GET', { token });
    } catch (error) {
      console.error('Course API error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết của khóa học bao gồm các chương và nội dung
   * 
   * @param {string} token - Token xác thực của người dùng
   * @param {string} id - Mã định danh của khóa học cần lấy chi tiết
   * @returns {Promise<any>} Thông tin chi tiết của khóa học bao gồm danh sách chương và nội dung
   * @throws {Error} Khi không thể kết nối với máy chủ hoặc token không hợp lệ
   * 
   * @example
   * // Lấy chi tiết đầy đủ của một khóa học
   * try {
   *   const courseDetails = await userApi.getCourseDetails(currentToken, 'course-123');
   *   console.log('Chi tiết khóa học:', courseDetails);
   * } catch (error) {
   *   console.error('Không thể lấy chi tiết khóa học:', error);
   * }
   */
  async getCourseDetails(token: string, id: string) {
    try {
      return await apiRequest(`/courses/${id}/details`, 'GET', { token });
    } catch (error) {
      console.error('Course API error:', error);
      throw error;
    }
  },
};