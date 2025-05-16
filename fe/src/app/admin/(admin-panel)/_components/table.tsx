
import { ReactNode, useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  sortable?: boolean;
  renderCell?: (value: unknown, row: T) => ReactNode;
}

interface Action {
  label: string;
  onClick: (id: string) => void;
  icon?: ReactNode;
}

interface TableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  renderRow?: (row: T, index: number) => ReactNode;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectItem?: (id: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  showActions?: boolean;
  actions?: Action[];
  coloredStatus?: boolean;
  onSort?: (field: keyof T, direction: SortDirection) => void;
  sortField?: keyof T | null;
  sortDirection?: SortDirection;
}

/**
 * Component bảng dữ liệu tùy chỉnh với nhiều tính năng nâng cao.
 * 
 * @template T - Kiểu dữ liệu của mỗi hàng, phải bao gồm thuộc tính 'id' kiểu string
 * 
 * @param {Object} props - Props của component Table
 * @param {Column<T>[]} props.columns - Mảng định nghĩa các cột trong bảng
 * @param {T[]} props.data - Mảng dữ liệu để hiển thị trong bảng
 * @param {function} [props.renderRow] - Hàm tùy chỉnh để render mỗi hàng, nhận tham số là dữ liệu hàng và chỉ số
 * @param {boolean} [props.selectable=false] - Cho phép chọn các hàng bằng checkbox
 * @param {string[]} [props.selectedItems=[]] - Mảng ID của các hàng đang được chọn
 * @param {function} [props.onSelectItem] - Handler khi một hàng được chọn/bỏ chọn
 * @param {function} [props.onSelectAll] - Handler khi nút chọn tất cả được kích hoạt
 * @param {boolean} [props.showActions=false] - Hiển thị menu hành động cho mỗi hàng
 * @param {Action[]} [props.actions=[]] - Mảng các hành động có thể thực hiện trên mỗi hàng
 * @param {boolean} [props.coloredStatus=false] - Tự động tô màu cho các giá trị trạng thái
 * @param {function} [props.onSort] - Handler khi người dùng thực hiện sắp xếp, để kiểm soát sắp xếp từ bên ngoài
 * @param {keyof T | null} [props.sortField=null] - Trường đang được sắp xếp (sử dụng cho kiểm soát bên ngoài)
 * @param {SortDirection} [props.sortDirection=null] - Hướng sắp xếp: 'asc', 'desc' hoặc null
 * 
 * @returns {JSX.Element} Component Table có khả năng tùy biến cao
 * 
 * @example
 * // Bảng cơ bản
 * <Table 
 *   columns={[
 *     { header: "Tên", accessor: "name" },
 *     { header: "Email", accessor: "email" }
 *   ]}
 *   data={users}
 * />
 * 
 * @example
 * // Bảng với chức năng chọn và menu hành động
 * <Table 
 *   columns={columns}
 *   data={users}
 *   selectable
 *   selectedItems={selectedUsers}
 *   onSelectItem={handleSelectUser}
 *   onSelectAll={handleSelectAll}
 *   showActions
 *   actions={[
 *     { 
 *       label: "Chỉnh sửa", 
 *       onClick: (id) => handleEdit(id),
 *       icon: <PencilIcon className="w-4 h-4" />
 *     }
 *   ]}
 *   coloredStatus={true}
 * />
 */
const Table = <T extends { id: string },>({
  columns,
  data,
  renderRow,
  selectable = false,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  showActions = false,
  actions = [],
  coloredStatus = false,
  onSort,
  sortField: externalSortField = null,
  sortDirection: externalSortDirection = null,
}: TableProps<T>) => {
  // Internal state for sorting if not controlled externally
  const [internalSortField, setInternalSortField] = useState<keyof T | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(null);
  // Animation state
  const [sortAnimation, setSortAnimation] = useState<string | null>(null);
  
  // Use external sort state if provided, otherwise use internal
  const sortField = externalSortField !== undefined ? externalSortField : internalSortField;
  const sortDirection = externalSortDirection !== undefined ? externalSortDirection : internalSortDirection;

  // Handle column header click for sorting
  const handleSort = (field: keyof T) => {
    // Trigger animation
    setSortAnimation(String(field));
    setTimeout(() => setSortAnimation(null), 300); // Reset animation after 300ms
    
    // Determine new sort direction (toggle between asc -> desc -> null)
    let newDirection: SortDirection = 'asc';
    if (sortField === field) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
    }
    
    // If external sort handler is provided, call it
    if (onSort) {
      onSort(field, newDirection);
    } else {
      // Otherwise, use internal state
      setInternalSortField(newDirection === null ? null : field);
      setInternalSortDirection(newDirection);
    }
  };

  // Sort data if using internal sorting
  const sortedData = [...data];
  if (!onSort && sortField && sortDirection) {
    sortedData.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Skip sorting for function accessors
      if (typeof aValue === 'function' || typeof bValue === 'function') {
        return 0;
      }
      
      // Compare values based on direction
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }
  
  // Check if all items are selected
  const allSelected = data.length > 0 && selectedItems.length === data.length;
  
  // Get status colors based on value
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
      case 'complete':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'in progress':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
      case 'failed':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'warning':
      case 'suspended':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get initial letter for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Default row rendering with checkbox and actions
  /**
   * Renders a row in a data table with various customizable features
   * 
   * @template T - Type của dữ liệu hàng (phải có thuộc tính 'id')
   * 
   * @param {T} row - Đối tượng dữ liệu của hàng cần render
   * @param {number} index - Vị trí của hàng trong bảng, dùng để xác định màu nền luân phiên
   * 
   * @returns {JSX.Element} - Phần tử React thể hiện hàng trong bảng
   * 
   * @description
   * Hàm này render một hàng trong bảng dữ liệu với các tính năng:
   * - Hỗ trợ chọn hàng với checkbox (nếu selectable=true)
   * - Hiển thị các cột dựa trên cấu hình columns đã định nghĩa
   * - Hỗ trợ tùy chỉnh việc hiển thị từng ô với renderCell
   * - Xử lý đặc biệt cho cột trạng thái với màu sắc tương ứng
   * - Định dạng riêng cho cột "User" hiển thị avatar và thông tin người dùng
   * - Thêm menu dropdown cho các hành động tương tác (nếu showActions=true)
   * 
   * Hàng được định dạng với màu nền luân phiên (trắng/xám) dựa vào chỉ số
   */
  const defaultRenderRow = (row: T, index: number) => {
    const isSelected = selectedItems.includes(row.id);
    
    return (
      <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        {selectable && (
          <td className="w-10 px-4 py-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectItem?.(row.id, !!checked)}
            />
          </td>
        )}
        
        {columns.map((column, colIndex) => {
          const value = typeof column.accessor === 'function' 
            ? column.accessor(row) 
            : row[column.accessor];
          
          // Use custom cell renderer if provided
          if (column.renderCell) {
            return (
              <td 
                key={colIndex} 
                className={`px-4 py-4 text-sm text-gray-700 ${column.className || ''}`}
              >
                {column.renderCell(value, row)}
              </td>
            );
          }
            
          let content = <>{value}</>;
          
          // Apply colored status if needed
          if (coloredStatus && column.header.toLowerCase().includes('status') && typeof value === 'string') {
            content = (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                {value}
              </span>
            );
          }

          // Special case for the User column - show avatar and name:email
          if (column.header === "User" && typeof value === 'string' && 'email' in row) {
            content = (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={value} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getInitials(value)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{value}</div>
                  <div className="text-xs text-gray-500">{String(row.email)}</div>
                </div>
              </div>
            );
          }
          
          return (
            <td 
              key={colIndex} 
              className={`px-4 py-4 text-sm text-gray-700 ${column.className || ''}`}
            >
              {content}
            </td>
          );
        })}
        
        {showActions && actions.length > 0 && (
          <td className="w-10 px-4 py-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" title='Actions' className="p-1 rounded-md hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, actionIndex) => (
                  <DropdownMenuItem 
                    key={actionIndex} 
                    onClick={() => action.onClick(row.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        )}
      </tr>
    );
  };

  return (
    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
      <thead>
        <tr className="bg-gray-50">
          {selectable && (
            <th className="w-10 px-4 py-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll?.(!!checked)}
              />
            </th>
          )}
          
          {columns.map((col, index) => {
            // Determine if this column is currently being sorted
            const isSortableColumn = col.sortable !== false && typeof col.accessor === 'string';
            const isActiveSortColumn = sortField === col.accessor;
            const isAnimating = sortAnimation === String(col.accessor);
            
            return (
              <th 
                key={index} 
                className={`px-4 py-2 text-left text-sm font-semibold text-gray-700 ${
                  isSortableColumn ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${col.className || ''} ${isAnimating ? 'bg-gray-200 transition-colors duration-300' : ''}`}
                onClick={() => isSortableColumn && handleSort(col.accessor as keyof T)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                  {isSortableColumn && (
                    <div className={`ml-1 transition-all duration-300 ${isAnimating ? 'scale-125' : ''}`}>
                      {isActiveSortColumn ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className={`h-3 w-3 ${isAnimating ? 'text-primary' : ''}`} />
                        ) : sortDirection === 'desc' ? (
                          <ArrowDown className={`h-3 w-3 ${isAnimating ? 'text-primary' : ''}`} />
                        ) : null
                      ) : (
                        <div className="h-3 w-3 opacity-0 group-hover:opacity-25">
                          <ArrowUp className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
            );
          })}
          
          {showActions && actions.length > 0 && (
            <th className="w-10 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {(onSort ? data : sortedData).length === 0 ? (
          <tr>
            <td 
              colSpan={(selectable ? 1 : 0) + columns.length + (showActions ? 1 : 0)} 
              className="px-4 py-4 text-center text-gray-500"
            >
              No data available
            </td>
          </tr>
        ) : (
          (onSort ? data : sortedData).map((row, index) => 
            renderRow ? renderRow(row, index) : defaultRenderRow(row, index)
          )
        )}
      </tbody>
    </table>
  );
};

export default Table;
export type { Column, Action, SortDirection };