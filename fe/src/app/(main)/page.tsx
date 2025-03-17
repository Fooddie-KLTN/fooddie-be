/**
 * @component Home
 * @description Trang chủ của ứng dụng LMS, hiển thị các phần chính của giao diện người dùng.
 * 
 * Trang chủ bao gồm nhiều thành phần con được sắp xếp theo thứ tự hiển thị:
 * - HomeSwiper: Trình chiếu hình ảnh chính
 * - Cta: Phần kêu gọi hành động
 * - Incoming: Hiển thị thông tin sắp tới
 * - Collection: Hiển thị bộ sưu tập
 * - Combo: Hiển thị các gói combo
 * - Promotion: Hiển thị các chương trình khuyến mãi
 * - Timeline: Hiển thị dòng thời gian
 * - Benefits: Hiển thị lợi ích của dịch vụ
 * - Blog: Hiển thị các bài viết blog
 * - Coaching: Hiển thị thông tin về dịch vụ coaching
 * - Experience: Hiển thị thông tin về trải nghiệm
 * - Testimonial: Hiển thị đánh giá từ khách hàng
 * - ContactPage: Hiển thị thông tin liên hệ
 * 
 * @returns {JSX.Element} Thành phần React hiển thị trang chủ
 */

export default function Home() {
  return (
    <>
      <div className="container mx-auto">
        <span className="text-2xl font-bold">Trang chủ</span>
      </div>
    </>
  );
}
