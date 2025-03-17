import { apiRequest } from "./base-api";

/**
 * Dịch vụ xác thực người dùng
 *
 * Cung cấp các phương thức để thực hiện các chức năng liên quan đến xác thực người dùng
 * như đăng nhập, đăng xuất, đăng ký và quên mật khẩu.
 *
 * @namespace
 */
export const authService = {
  /**
   * Đăng nhập vào hệ thống
   *
   * @param {string} token - Token xác thực từ Firebase hoặc dịch vụ xác thực khác
   * @returns {Promise<any>} Thông tin người dùng sau khi đăng nhập thành công
   * @throws {Error} Khi xác thực thất bại hoặc không thể kết nối với máy chủ
   * 
   * @example
   * // Đăng nhập với token
   * try {
   *   const userInfo = await authService.login(firebaseToken);
   *   console.log('Đăng nhập thành công:', userInfo);
   * } catch (error) {
   *   console.error('Lỗi đăng nhập:', error);
   * }
   */
  async login(token: string) {
    try {
      return await apiRequest('/auth/login', 'POST', { token });
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
  },

  /**
   * Đăng xuất khỏi hệ thống
   *
   * @param {string} token - Token xác thực hiện tại của người dùng
   * @returns {Promise<any>} Kết quả của quá trình đăng xuất
   * @throws {Error} Khi đăng xuất thất bại hoặc không thể kết nối với máy chủ
   * 
   * @example
   * // Đăng xuất người dùng hiện tại
   * try {
   *   await authService.logout(currentToken);
   *   console.log('Đăng xuất thành công');
   * } catch (error) {
   *   console.error('Lỗi đăng xuất:', error);
   * }
   */
  async logout(token: string) {
    try {
      return await apiRequest('/auth/logout', 'POST', { token });
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
  },

  /**
   * Yêu cầu đặt lại mật khẩu cho tài khoản
   *
   * Gửi email với hướng dẫn đặt lại mật khẩu đến địa chỉ email được cung cấp
   *
   * @param {string} email - Địa chỉ email liên kết với tài khoản cần đặt lại mật khẩu
   * @returns {Promise<any>} Thông báo kết quả yêu cầu đặt lại mật khẩu
   * @throws {Error} Khi không tìm thấy tài khoản hoặc không thể gửi email
   * 
   * @example
   * // Yêu cầu đặt lại mật khẩu
   * try {
   *   const result = await authService.forgetPassword('nguoi.dung@example.com');
   *   console.log('Đã gửi email đặt lại mật khẩu');
   * } catch (error) {
   *   console.error('Không thể yêu cầu đặt lại mật khẩu:', error);
   * }
   */
  async forgetPassword(email: string) {
    try {
      return await apiRequest('/auth/forgot-password', 'POST', { data: { email } });
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
  },

  /**
   * Đăng ký tài khoản mới
   *
   * @param {Object} userData - Thông tin người dùng cần đăng ký
   * @param {string} userData.email - Địa chỉ email
   * @param {string} userData.password - Mật khẩu
   * @param {string} userData.name - Họ tên người dùng
   * @returns {Promise<any>} Thông tin tài khoản sau khi đăng ký thành công
   * @throws {Error} Khi thông tin đăng ký không hợp lệ hoặc email đã được sử dụng
   * 
   * @example
   * // Đăng ký tài khoản mới
   * try {
   *   const newUser = await authService.register({
   *     email: 'nguoi.dung.moi@example.com',
   *     password: 'mat_khau_bao_mat',
   *     name: 'Nguyễn Văn A'
   *   });
   *   console.log('Đăng ký thành công:', newUser);
   * } catch (error) {
   *   console.error('Lỗi đăng ký:', error);
   * }
   */
  async register(userData: { email: string; password: string; name: string }) {
    try {
      return await apiRequest('/guest/register', 'POST', { data: userData });
    } catch (error) {
      console.error('Guest API error:', error);
      throw error;
    }
  },
};