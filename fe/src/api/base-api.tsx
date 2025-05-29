/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Thực hiện yêu cầu HTTP đến API backend và xử lý phản hồi.
 * 
 * Hàm này cung cấp một lớp trừu tượng để thực hiện các yêu cầu HTTP đến API backend
 * với khả năng xử lý token xác thực, tham số truy vấn và dữ liệu gửi đi.
 * Hàm sử dụng kiểu dữ liệu generic để đảm bảo tính chính xác của dữ liệu trả về.
 * 
 * @template T - Kiểu dữ liệu mà API sẽ trả về sau khi xử lý thành công.
 * 
 * @param {string} endpoint - Đường dẫn tương đối của API (không bao gồm URL cơ sở).
 *                           Ví dụ: '/users', '/courses/123', '/auth/login'.
 * 
 * @param {string} method - Phương thức HTTP cần sử dụng.
 *                         Các giá trị hợp lệ: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'.
 * 
 * @param {object} [options] - Tùy chọn cấu hình cho yêu cầu HTTP.
 * 
 * @param {object|null} [options.data] - Dữ liệu sẽ được gửi trong phần thân của yêu cầu.
 *                                      Chủ yếu được sử dụng cho các phương thức 'POST', 'PUT', 'PATCH'.
 *                                      Dữ liệu này sẽ được chuyển đổi thành chuỗi JSON trước khi gửi.
 * 
 * @param {string} [options.token] - Token xác thực JWT sẽ được gửi trong header 'Authorization'.
 *                                  Nếu được cung cấp, header sẽ có định dạng: 'Bearer {token}'.
 * 
 * @param {FormData} [options.formData] - Dữ liệu FormData sẽ được gửi trong phần thân của yêu cầu.
 *                                       Chủ yếu được sử dụng cho các phương thức 'POST', 'PUT', 'PATCH'.
 *                                       Không cần đặt Content-Type, trình duyệt sẽ tự động xử lý.
 * 
 * @returns {Promise<T>} Promise giải quyết thành dữ liệu trả về từ API sau khi đã được phân tích từ JSON.
 *                       Kiểu dữ liệu trả về được chỉ định bởi tham số kiểu T.
 * 
 * @throws {Error} Ném ra lỗi nếu yêu cầu không thành công (mã phản hồi ngoài phạm vi 200-299)
 *                 hoặc nếu có lỗi xảy ra trong quá trình thực hiện yêu cầu.
 *                 Thông báo lỗi sẽ là message từ API hoặc 'Yêu cầu thất bại' nếu không có.
 * 
 * @example
 * // Ví dụ 1: GET yêu cầu đơn giản
 * const users = await apiRequest<User[]>('/users', 'GET');
 * 
 * @example
 * // Ví dụ 2: GET với tham số truy vấn và token
 * const paginatedUsers = await apiRequest<PaginatedResponse<User>>('/users', 'GET', {
 *   token: 'jwt-token-here',
 *   query: { page: 1, limit: 10, sortBy: 'name' }
 * });
 * 
 * @example
 * // Ví dụ 3: POST với dữ liệu và token
 * const newUser = await apiRequest<User>('/users', 'POST', {
 *   token: 'jwt-token-here',
 *   data: {
 *     name: 'Nguyễn Văn A',
 *     email: 'nguyenvana@example.com',
 *     age: 30
 *   }
 * });
 * 
 * @example
 * // Ví dụ 4: PUT để cập nhật tài nguyên
 * const updatedUser = await apiRequest<User>('/users/123', 'PUT', {
 *   token: 'jwt-token-here',
 *   data: { name: 'Nguyễn Văn B' }
 * });
 * 
 * @example
 * // Ví dụ 5: DELETE để xóa tài nguyên
 * await apiRequest('/users/123', 'DELETE', { token: 'jwt-token-here' });
 */
export async function apiRequest<T>(
  endpoint: string,
  method: string,
  options?: {
    /**
     * Dữ liệu được gửi trong phần thân của yêu cầu.
     * Sẽ được chuyển đổi thành chuỗi JSON trước khi gửi.
     */
    data?: object | null;
    
    /**
     * Token xác thực JWT.
     * Sẽ được thêm vào header 'Authorization' với định dạng 'Bearer {token}'.
     */
    token?: string;
    
    /**
     * Các tham số truy vấn sẽ được thêm vào URL.
     * Ví dụ: { page: 1, size: 10 } → '?page=1&size=10'
     */
    query?: Record<string, string | number>;

    /**
     * Dữ liệu FormData sẽ được gửi trong phần thân của yêu cầu.
     * Không cần đặt Content-Type, trình duyệt sẽ tự động xử lý.
     */
    formData?: FormData;
  }
): Promise<T> {
  const { token, data, formData } = options || {};

  // Tạo URL đầy đủ cho yêu cầu
  let url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

  // Tạo headers cho yêu cầu
  const headers: HeadersInit = {};

  // Thêm token vào headers nếu có
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Tạo body cho yêu cầu
  let body: any = undefined;

  if (formData) {
    // Đối với FormData, không cần đặt Content-Type
    body = formData;
  } else if (data) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(data);
  }

  // Thêm tham số query vào URL nếu có
  if (options?.query) {
    const queryString = new URLSearchParams(
      Object.fromEntries(
        Object.entries(options.query).map(([key, value]) => [key, value.toString()])
      )
    ).toString();
    url += `?${queryString}`;
  }

  // Thực hiện yêu cầu
  const response = await fetch(url, {
    method,
    headers,
    body,
  });


  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API request failed with status ${response.status}`);
  }

  // Trả về dữ liệu trả về
  return response.json() as Promise<T>;
}