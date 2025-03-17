interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
    pageSizeOptions?: number[];
  }
  
/**
 * Component hiển thị phân trang cho các danh sách.
 * 
 * @component Pagination
 * @param {Object} props - Props của component phân trang
 * @param {number} props.currentPage - Trang hiện tại đang được hiển thị
 * @param {number} props.totalPages - Tổng số trang có sẵn
 * @param {number} props.pageSize - Số lượng mục hiển thị trên mỗi trang
 * @param {function} props.onPageChange - Hàm callback được gọi khi người dùng chuyển trang, nhận vào số trang mới
 * @param {function} props.onPageSizeChange - Hàm callback được gọi khi người dùng thay đổi kích thước trang, nhận vào kích thước trang mới
 * @param {number[]} [props.pageSizeOptions=[10, 20, 50]] - Danh sách các tùy chọn kích thước trang có sẵn để người dùng lựa chọn
 * 
 * @returns {JSX.Element} Component phân trang với nút Previous/Next và dropdown lựa chọn kích thước trang
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   pageSize={20}
 *   onPageChange={(newPage) => setPage(newPage)}
 *   onPageSizeChange={(newSize) => setPageSize(newSize)}
 * />
 * ```
 */
  const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50],
  }) => (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4">
      <div className="flex items-center gap-2 mb-2 md:mb-0">
        <span className="text-md text-gray-500">Show</span>
        <select
            title="Select page size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
  
  export default Pagination;