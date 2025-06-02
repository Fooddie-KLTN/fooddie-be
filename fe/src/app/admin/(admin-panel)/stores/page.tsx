/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/admin/(admin-panel)/store/page.tsx
"use client";

import { useState, useEffect } from "react";
import {  TrashIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";

import Header from "@/app/admin/(admin-panel)/_components/header";
import NavigationBar from "@/app/admin/(admin-panel)/_components/tab";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import ApproveStoreModal from "./_components/approve-store-modal";
import ViewStoreModal from "./_components/view-store-modal";
import { apiRequest } from "@/api/base-api";

export interface Store {
  id: string;
  name: string;
  phoneNumber: string;
  backgroundImage?: string;
  certificateImage?: string;
  avatar?: string;
  description?: string;
  openTime?: string;
  closeTime?: string;
  licenseCode?: string;
  status: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    [key: string]: any;
  };
  address: {
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    [key: string]: any;
  };
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}


const StoreAdminPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
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
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const { getToken } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    fetchStores();
  }, [isMounted, pagination.currentPage, pagination.pageSize, activeTab]);

  const [statusFilter, setStatusFilter] = useState('');

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await adminService.Store.getStores(
        token,
        pagination.currentPage,
        pagination.pageSize,
        activeTab === 'pending' ? 'pending' : undefined
      );

      setStores(
        Array.isArray(response.items)
          ? response.items.map((item) => ({
              ...item,
              owner: typeof item.owner === 'object' ? item.owner : {
                id: '',
                name: 'Chưa rõ',
                email: '',
              },
              address: typeof item.address === 'object' ? item.address : {
                street: '',
                ward: '',
                district: '',
                city: '',
              },
            }))
          : []
      );
      

      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(response.totalItems / pagination.pageSize)
      }));
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStores = Array.isArray(stores)
  ? stores
      .filter((store) => store.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((store) =>
        activeTab === 'pending'
          ? store.status === 'pending'
          : statusFilter
          ? store.status === statusFilter
          : true
      )
  : [];


  const sortedStores = [...filteredStores];

  if (sortField && sortDirection) {
    sortedStores.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue && bValue && typeof aValue === 'object' && typeof bValue === 'object') {
        const aStr = aValue.name || aValue.street || aValue.id || '';
        const bStr = bValue.name || bValue.street || bValue.id || '';

        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      return 0;
    });
  }

  const handleApprove = async (storeId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
  
      await apiRequest(`/restaurants/${storeId}/approve`, 'PUT', { token });
      alert("✅ Cửa hàng đã được duyệt");
      fetchStores();
    } catch (error) {
      console.error("❌ Duyệt thất bại:", error);
      alert("❌ Duyệt thất bại");
    } finally {
      setSelectedStoreDetail(null);
    }
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

  if (!isMounted) return null;

  const pendingCount = stores.filter(s => s.status === 'pending').length;

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
    {
      header: "Chủ cửa hàng",
      accessor: "owner",
      sortable: false,
      renderCell: (_, store) => store.owner?.name || "Không rõ",
    },
    {
      header: "Địa điểm",
      accessor: "address",
      sortable: false,
      renderCell: (_, store) => {
        const address = store.address;
    
        if (!address) return 'Chưa có địa chỉ';
    
        // ✅ Nếu address.street là object → truy cập từng trường
        if (typeof address.street === 'object') {
          const streetData = address.street as {
            street?: string;
            ward?: string;
            district?: string;
            city?: string;
          };
        
          const street = streetData.street;
          const ward = streetData.ward || address.ward;
          const district = streetData.district || address.district;
          const city = streetData.city || address.city;
        
          return [street, ward, district, city].filter(Boolean).join(', ');
        }
        
    
        // ✅ Nếu address.street là chuỗi thì in thẳng ra + các phần khác
        return [address.street, address.ward, address.district, address.city]
          .filter(Boolean)
          .join(', ');
      }
    },
    
    {
      header: "Ngày tạo",
      accessor: "createdAt",
      sortable: true,
      renderCell: (_, store) => {
        const date = new Date(store.createdAt);
        return date.toLocaleString('vi-VN'); // hoặc dùng dayjs/format lib
      }
    },
    
    {
      header: "Trạng thái",
      accessor: "status",
      sortable: true,
      renderCell: (_, store) => {
        const baseClass = "px-2 py-1 rounded text-xs font-semibold w-fit";
        const statusClass =
          store.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
          store.status === 'approved' ? "bg-green-100 text-green-700" :
          store.status === 'rejected' ? "bg-red-100 text-red-700" : "";

        return <span className={`${baseClass} ${statusClass}`}>{store.status.toUpperCase()}</span>;
      }
    },
  ];

  const storeActions: Action[] = [
    {
      label: "Xoá",
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: (id) => console.log("Delete store", id),
    },
  ];

  const filterControls = (
    <div className="flex items-center gap-4">
      {/* Sort dropdown */}
      <select
        title="Sắp xếp theo"
        value={sortField ?? ''}
        onChange={(e) => {
          const field = e.target.value as keyof Store;
          setSortField(field || null);
          setSortDirection('asc'); // mặc định asc khi chọn mới
        }}
        className="border border-gray-300 rounded px-3 py-2 text-sm"
      >
        <option value="">Sắp xếp theo...</option>
        <option value="name">Tên cửa hàng</option>
        <option value="createdAt">Ngày tạo</option>
        <option value="status">Trạng thái</option>
      </select>
  
      {/* Direction */}
      <select
      title="Sắp xếp theo"
        value={sortDirection ?? ''}
        onChange={(e) => {
          const dir = e.target.value as 'asc' | 'desc';
          setSortDirection(dir || null);
        }}
        className="border border-gray-300 rounded px-3 py-2 text-sm"
      >
        <option value="">Chiều</option>
        <option value="asc">Tăng dần</option>
        <option value="desc">Giảm dần</option>
      </select>
  
      {/* Filter by status */}
      <select
        title="Lọc theo trạng thái"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="pending">Đang chờ</option>
        <option value="approved">Đã duyệt</option>
        <option value="rejected">Từ chối</option>
      </select>
    </div>
  );
  

  return (
    <div className="p-4">
      <Header
        title="Duyệt cửa hàng"
        description="Danh sách các cửa hàng trong hệ thống"
        actions={[]}
      />

      <NavigationBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'all' | 'pending')}
        tabs={[
          { key: 'all', label: 'Tất cả cửa hàng' },
          { key: 'pending', label: `Cửa hàng chờ duyệt (${pendingCount})` },
        ]}
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
        activeTab === 'pending' ? (
          <ApproveStoreModal
            store={selectedStoreDetail}
            onClose={() => setSelectedStoreDetail(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <ViewStoreModal
            store={selectedStoreDetail}
            onClose={() => setSelectedStoreDetail(null)}
          />
        )
      )}
    </div>
  );
};

export default StoreAdminPage;
