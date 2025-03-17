

/**
 * @component Page
 * @description Trang "Về chúng tôi" của ứng dụng, hiển thị thông tin chi tiết về tổ chức.
 * Trang này bao gồm nhiều thành phần khác nhau để thể hiện các khía cạnh của tổ chức.
 * 
 * Các thành phần được hiển thị bao gồm:
 * - AboutHero: Phần giới thiệu chính
 * - Message: Thông điệp từ tổ chức
 * - CoreValueAbout: Giá trị cốt lõi của tổ chức
 * - TeamAbout: Giới thiệu về đội ngũ
 * - HighlightAbout: Những điểm nổi bật
 * - EventAbout: Các sự kiện của tổ chức
 * 
 * @returns {JSX.Element} Trả về một Fragment chứa tất cả các thành phần của trang About
 */
export default function Page() {
  return (
    <>
      <div className="container mx-auto">
        <span className="text-2xl font-bold">Về chúng tôi</span>
      </div>
    </>
  );
}
