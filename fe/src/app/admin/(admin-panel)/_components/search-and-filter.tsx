import { Input } from '@/components/ui/input';
import { ReactNode } from 'react';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  additionalFilters?: ReactNode;
}

/**
 * Component hiển thị thanh tìm kiếm và bộ lọc bổ sung.
 * 
 * @component
 * @example
 * ```tsx
 * <SearchAndFilters
 *   searchQuery="example"
 *   onSearchChange={(value) => console.log(value)}
 *   searchPlaceholder="Tìm kiếm khóa học"
 *   additionalFilters={<Button>Lọc</Button>}
 * />
 * ```
 * 
 * @param props - Các props của component
 * @param props.searchQuery - Giá trị hiện tại của trường tìm kiếm
 * @param props.onSearchChange - Hàm callback được gọi khi giá trị tìm kiếm thay đổi
 * @param props.searchPlaceholder - Văn bản placeholder hiển thị trong ô tìm kiếm (mặc định là 'Search')
 * @param props.additionalFilters - Các thành phần lọc bổ sung sẽ được hiển thị bên phải thanh tìm kiếm
 * 
 * @returns Component React hiển thị giao diện tìm kiếm và lọc
 */
const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search',
  additionalFilters,
}) => (
  <div className="flex flex-col md:flex-row justify-between items-center mb-4">
    <div className="w-full md:w-1/3 mb-2 md:mb-0">
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />
    </div>
    <div className="flex flex-wrap gap-2">{additionalFilters}</div>
  </div>
);

export default SearchAndFilters;