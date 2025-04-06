"use client";

import { useState, useEffect } from "react";
import { FilterIcon, SortAscIcon, Edit2Icon, TrashIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { adminService } from "@/api/admin";

import Header from "@/app/admin/(admin-panel)/_components/header";
import NavigationBar from "@/app/admin/(admin-panel)/_components/tab";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import ApproveStoreModal from "./_components/approve-store-modal";

export interface Store {
  id: string;
  name: string;
  owner: string;
  location: string;
  createdAt: string;
  status: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

const StoreAdminPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Store | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedStoreDetail, setSelectedStoreDetail] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });

  const { getToken } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filteredStores =
    stores
      ?.filter((store) => store.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ?.filter((store) => store.status === 'pending') ?? [];

  const sortedStores = [...filteredStores];
  if (sortField && sortDirection) {
    sortedStores.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
          : aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await adminService.Store.getStores(
        token,
        pagination.currentPage,
        pagination.pageSize
      );

      setStores(response.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(response.total / pagination.pageSize)
      }));
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (storeId: string) => {
    console.log("Duyệt cửa hàng", storeId);
    setSelectedStoreDetail(null);
    fetchStores();
  };

  const handleReject = async (storeId: string) => {
    console.log("Từ chối cửa hàng", storeId);
    setSelectedStoreDetail(null);
    fetchStores();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newSize,
      currentPage: 1,
    }));
  };

  const handleCheckAll = (checked: boolean) => {
    setSelectedStores(checked ? sortedStores.map(s => s.id) : []);
  };

  const handleCheckStore = (storeId: string, checked: boolean) => {
    setSelectedStores(prev => checked ? [...prev, storeId] : prev.filter(id => id !== storeId));
  };

  const handleSort = (field: keyof Store, direction: 'asc' | 'desc' | null) => {
    setSortField(field);
    setSortDirection(direction);
  };

  useEffect(() => {
    fetchStores();
  }, [pagination.currentPage, pagination.pageSize]);

  const storeColumns: Column<Store>[] = [
    {
      header: "Tên cửa hàng",
      accessor: "name",
      sortable: true,
      renderCell: (_, store) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => setSelectedStoreDetail(store)}
        >
          {store.name}
        </button>
      ),
    },
    { header: "Chủ cửa hàng", accessor: "owner", sortable: true },
    { header: "Địa điểm", accessor: "location", sortable: true },
    { header: "Ngày tạo", accessor: "createdAt", sortable: true },
    { header: "Trạng thái", accessor: "status", sortable: true },
  ];

  const storeActions: Action[] = [
    {
      label: "Xoá",
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: (id) => console.log("Delete store", id),
    },
  ];

  const filterControls = (
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
  );

  return (
    <div className="p-4">
      <Header
        title="Duyệt cửa hàng"
        description="Danh sách các cửa hàng đang chờ duyệt"
        actions={[]}
      />

      <NavigationBar
        activeTab="store"
        onTabChange={() => {}}
        tabs={[{ key: 'store', label: 'Cửa hàng chờ duyệt' }]}
      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm cửa hàng"
        additionalFilters={filterControls}
      />

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
          </div>
        ) : (
          <Table
            columns={storeColumns}
            data={sortedStores}
            selectable={true}
            selectedItems={selectedStores}
            onSelectItem={handleCheckStore}
            onSelectAll={handleCheckAll}
            showActions={true}
            actions={storeActions}
            coloredStatus={true}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        )}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 50]}
      />

      {selectedStoreDetail && (
        <ApproveStoreModal
          store={selectedStoreDetail}
          onClose={() => setSelectedStoreDetail(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default StoreAdminPage;