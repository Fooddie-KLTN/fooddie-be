"use client";

import { useEffect, useState } from "react";
import { EyeIcon, SortAscIcon, FilterIcon } from "lucide-react";
import Header from "@/app/admin/(admin-panel)/_components/header";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Order {
  id: string;
  user: string;
  restaurant: string;
  total: number;
  note?: string;
  promotionCode?: string;
  state: string;
  date: string;
  address: string;
  createdAt: string;
}

type SortDirection = "asc" | "desc" | null;

const OrdersAdminPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Order | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedDetail, setSelectedDetail] = useState<Order | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  useEffect(() => {
    const stored = localStorage.getItem("orders");
    const parsed = stored ? JSON.parse(stored) : [];
    setOrders(parsed);
    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(parsed.length / prev.pageSize),
    }));
  }, []);

  const filtered = orders.filter((o) =>
    o.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered];
  if (sortField && sortDirection) {
    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }

  const paginatedData = sorted.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );

  const handleSort = (field: keyof Order, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: size,
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / size),
    }));
  };

  const columns: Column<Order>[] = [
    { header: "Mã đơn", accessor: "id", sortable: true },
    { header: "Người đặt", accessor: "user", sortable: true },
    { header: "Nhà hàng", accessor: "restaurant", sortable: true },
    { header: "Tổng tiền", accessor: "total", sortable: true },
    { header: "Trạng thái", accessor: "state", sortable: true },
    { header: "Ngày đặt", accessor: "date", sortable: true },
  ];

  const actions: Action[] = [
    {
      label: "Xem chi tiết",
      icon: <EyeIcon className="h-4 w-4" />,
      onClick: (id) => {
        const found = orders.find((o) => o.id === id);
        setSelectedDetail(found || null);
      },
    },
  ];

  return (
    <div className="p-4">
      <Header
              title="Lịch sử đơn hàng"
              description="Xem lại lịch sử các đơn hàng đã đặt" actions={[]}      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm theo tên người đặt"
        additionalFilters={
          <>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <SortAscIcon className="w-5 h-5" />
              <span>Sắp xếp</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <FilterIcon className="w-5 h-5" />
              <span>Lọc</span>
            </button>
          </>
        }
      />

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={paginatedData}
          showActions={true}
          actions={actions}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 50]}
      />

      {selectedDetail && (
        <Dialog open={true} onOpenChange={() => setSelectedDetail(null)}>
          <DialogContent>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
            <div className="space-y-2">
              <p><strong>Mã đơn:</strong> {selectedDetail.id}</p>
              <p><strong>Người đặt:</strong> {selectedDetail.user}</p>
              <p><strong>Nhà hàng:</strong> {selectedDetail.restaurant}</p>
              <p><strong>Tổng tiền:</strong> {selectedDetail.total}</p>
              <p><strong>Khuyến mãi:</strong> {selectedDetail.promotionCode || "Không có"}</p>
              <p><strong>Trạng thái:</strong> {selectedDetail.state}</p>
              <p><strong>Ngày đặt:</strong> {selectedDetail.date}</p>
              <p><strong>Địa chỉ:</strong> {selectedDetail.address}</p>
              <p><strong>Ghi chú:</strong> {selectedDetail.note || "Không có"}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OrdersAdminPage;