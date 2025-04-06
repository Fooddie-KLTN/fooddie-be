"use client";

import { useEffect, useState } from "react";
import {
  EyeIcon,
  PlusIcon,
  TrashIcon,
  SortAscIcon,
  FilterIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import Header from "@/app/admin/(admin-panel)/_components/header";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import NavigationBar from "@/app/admin/(admin-panel)/_components/tab";
import AddShipperForm from "./_components/add-shipper-modal";

interface Shipper {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  cccd: string;
  driverLicense: string;
  status: "active" | "inactive" | "pending";
  orders: any[];
}

type SortDirection = "asc" | "desc" | null;

const ShipperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"list" | "requests">("list");
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [shipperRequests, setShipperRequests] = useState<Shipper[]>([]);
  const [selectedShippers, setSelectedShippers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Shipper | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Shipper | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<Shipper | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const stored = localStorage.getItem("shippers");
    const parsed = stored ? JSON.parse(stored) : [];
    setShippers(parsed);

    const requests = localStorage.getItem("shipperRequests");
    const parsedRequests = requests ? JSON.parse(requests) : [];
    setShipperRequests(parsedRequests);

    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(parsed.length / prev.pageSize),
    }));
  }, []);

  const filtered = shippers.filter((s) =>
    s.user.name.toLowerCase().includes(searchQuery.toLowerCase())
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

      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        return sortDirection === "asc"
          ? aValue.length - bValue.length
          : bValue.length - aValue.length;
      }

      return 0;
    });
  }

  const paginatedData = sorted.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );

  const handleSort = (field: keyof Shipper, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      setSelectedShippers(paginatedData.map((s) => s.id));
    } else {
      setSelectedShippers([]);
    }
  };

  const handleCheck = (id: string, checked: boolean) => {
    setSelectedShippers((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({
      currentPage: 1,
      pageSize: size,
      totalPages: Math.ceil(shippers.length / size),
    });
  };

  const handleDelete = (id: string) => {
    const updated = shippers.filter((s) => s.id !== id);
    localStorage.setItem("shippers", JSON.stringify(updated));
    setShippers(updated);
  };

  const shipperColumns: Column<Shipper>[] = [
    {
      header: "Shipper",
      accessor: (row) => (
        <div>
          <p className="font-semibold">{row.user.name}</p>
          <p className="text-sm text-gray-500">{row.user.email}</p>
        </div>
      ),
      sortable: false,
    },
    { header: "CCCD", accessor: "cccd", sortable: false },
    { header: "GPLX", accessor: "driverLicense", sortable: false },
    {
      header: "Trạng thái",
      accessor: "status",
      sortable: true,
      renderCell: (value: unknown) => {
        const status = value as "active" | "inactive" | "pending";
        const colorMap: Record<typeof status, string> = {
          active: "text-green-600",
          inactive: "text-gray-500",
          pending: "text-yellow-600",
        };

        return <span className={`font-medium ${colorMap[status]}`}>{status}</span>;
      },
    },
    {
      header: "Đơn đã giao",
      accessor: "orders",
      sortable: true,
      renderCell: (_, row) => row.orders.length,
    },
  ];

  const tabs = [
    { key: "list", label: "Danh sách shipper" },
    { key: "requests", label: `Yêu cầu duyệt (${shipperRequests.length})` },
  ];

  return (
    <div className="p-4">
      <Header
        title="Quản lý Shipper"
        description="Theo dõi, thêm, xoá và quản lý shipper"
        actions={[
          {
            label: "Thêm shipper",
            icon: <PlusIcon className="w-5 h-5" />,
            onClick: () => setIsAddModalOpen(true),
            variant: "primary",
          },
        ]}
      />

      <NavigationBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "list" | "requests")}
        tabs={tabs}
      />

      {activeTab === "requests" ? (
        <div className="overflow-x-auto">
          <Table
            columns={shipperColumns}
            data={shipperRequests}
            showActions={true}
            actions={[
              {
                label: "Xem chi tiết",
                icon: <EyeIcon className="h-4 w-4" />,
                onClick: (id) => {
                  const found = shipperRequests.find((s) => s.id === id);
                  setSelectedRequestDetail(found || null);
                },
              },
              {
                label: "Duyệt",
                icon: <CheckIcon className="h-4 w-4" />,
                onClick: (id) => {
                  const request = shipperRequests.find((r) => r.id === id);
                  if (request) {
                    const updatedList = [...shippers, { ...request, status: "active" as "active" }];
                    const updatedRequests = shipperRequests.filter((r) => r.id !== id);
                    localStorage.setItem("shippers", JSON.stringify(updatedList));
                    localStorage.setItem("shipperRequests", JSON.stringify(updatedRequests));
                    setShippers(updatedList);
                    setShipperRequests(updatedRequests);
                  }
                },
              },
              
              {
                label: "Từ chối",
                icon: <XIcon className="h-4 w-4" />,
                onClick: (id) => {
                  const updatedRequests = shipperRequests.filter((r) => r.id !== id);
                  localStorage.setItem("shipperRequests", JSON.stringify(updatedRequests));
                  setShipperRequests(updatedRequests);
                },
              },
            ]}
          />
        </div>
      ) : (
        <>
          <SearchAndFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Tìm shipper theo tên"
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
              columns={shipperColumns}
              data={paginatedData}
              selectable={true}
              selectedItems={selectedShippers}
              onSelectItem={handleCheck}
              onSelectAll={handleCheckAll}
              showActions={true}
              actions={[
                {
                  label: "Xem chi tiết",
                  icon: <EyeIcon className="h-4 w-4" />,
                  onClick: (id) => {
                    const found = shippers.find((s) => s.id === id);
                    setSelectedDetail(found || null);
                  },
                },
                {
                  label: "Xóa",
                  icon: <TrashIcon className="h-4 w-4" />,
                  onClick: (id) => handleDelete(id),
                },
              ]}
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
        </>
      )}

      {isDesktop ? (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="p-0 h-screen w-screen overflow-auto">
            <DialogTitle className="sr-only">Thêm shipper</DialogTitle>
            <AddShipperForm onClose={() => setIsAddModalOpen(false)} />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DrawerContent className="h-screen p-0 overflow-auto">
            <DialogTitle className="sr-only">Thêm shipper</DialogTitle>
            <AddShipperForm onClose={() => setIsAddModalOpen(false)} />
          </DrawerContent>
        </Drawer>
      )}

      {selectedDetail && (
        <Dialog open={true} onOpenChange={() => setSelectedDetail(null)}>
          <DialogContent>
            <DialogTitle>Thông tin chi tiết</DialogTitle>
            <div className="space-y-2">
              <p><strong>Tên:</strong> {selectedDetail.user.name}</p>
              <p><strong>Email:</strong> {selectedDetail.user.email}</p>
              <p><strong>Số điện thoại:</strong> {selectedDetail.user.phone}</p>
              <p><strong>CCCD:</strong> {selectedDetail.cccd}</p>
              <p><strong>Giấy phép lái xe:</strong> {selectedDetail.driverLicense}</p>
              <p><strong>Trạng thái:</strong> {selectedDetail.status}</p>
              <p><strong>Số đơn đã giao:</strong> {selectedDetail.orders.length}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedRequestDetail && (
        <Dialog open={true} onOpenChange={() => setSelectedRequestDetail(null)}>
          <DialogContent>
            <DialogTitle>Chi tiết yêu cầu shipper</DialogTitle>
            <div className="space-y-2">
              <p><strong>Họ tên:</strong> {selectedRequestDetail.user.name}</p>
              <p><strong>Email:</strong> {selectedRequestDetail.user.email}</p>
              <p><strong>Điện thoại:</strong> {selectedRequestDetail.user.phone}</p>
              <p><strong>CCCD:</strong> {selectedRequestDetail.cccd}</p>
              <p><strong>GPLX:</strong> {selectedRequestDetail.driverLicense}</p>
              <p><strong>Trạng thái:</strong> {selectedRequestDetail.status}</p>
              <p><strong>Đơn đã giao:</strong> {selectedRequestDetail.orders.length}</p>
              <div className="flex gap-3 pt-2">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded"
                  onClick={() => {
                    const updated = [...shippers, { ...selectedRequestDetail, status: "active" as "active" }];
                    const filtered = shipperRequests.filter((s) => s.id !== selectedRequestDetail.id);
                    localStorage.setItem("shippers", JSON.stringify(updated));
                    localStorage.setItem("shipperRequests", JSON.stringify(filtered));
                    setShippers(updated);
                    setShipperRequests(filtered);
                    setSelectedRequestDetail(null);
                  }}
                >
                  Duyệt
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  onClick={() => {
                    const filtered = shipperRequests.filter((s) => s.id !== selectedRequestDetail.id);
                    localStorage.setItem("shipperRequests", JSON.stringify(filtered));
                    setShipperRequests(filtered);
                    setSelectedRequestDetail(null);
                  }}
                >
                  Từ chối
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ShipperAdminPage;