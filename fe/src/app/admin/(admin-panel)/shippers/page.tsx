"use client";

import { useEffect, useState } from "react";
import {
  EyeIcon,
  PlusIcon,
  SortAscIcon,
  FilterIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import Header from "@/app/admin/(admin-panel)/_components/header";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import NavigationBar from "@/app/admin/(admin-panel)/_components/tab";
import AddShipperForm from "./_components/add-shipper-modal";
import { useShippers } from "@/hooks/use-shipper";

interface Shipper {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    orders?: any[];
  };
  cccd: string;
  driverLicense: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

const ShipperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"list" | "requests">("list");
  const [selectedShippers, setSelectedShippers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Shipper | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Shipper | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<Shipper | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState<string>('');

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const {
    activeShippers,
    pendingShippers,
    approveShipper,
    rejectShipper,
    refresh,
  } = useShippers();

  const filtered = (activeShippers as Shipper[]).filter((s) =>
  s.user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
  (statusFilter ? s.status === statusFilter : true)
);


  const sorted = [...filtered];
  if (sortField && sortDirection) {
    sorted.sort((a, b) => {
      const aVal = a[sortField] as string;
      const bVal = b[sortField] as string;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }

  const paginatedData: Shipper[] = sorted.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );
  
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [searchQuery, statusFilter]);

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
    { header: "CCCD", accessor: "cccd", sortable: true },
    { header: "GPLX", accessor: "driverLicense", sortable: true },
    {
      header: "Trạng thái",
      accessor: "status",
      sortable: true,
      renderCell: (value: unknown) => {
        const status = value as Shipper["status"];
        const colorMap: Record<Shipper["status"], string> = {
          APPROVED: "text-green-600",
          PENDING: "text-yellow-600",
          REJECTED: "text-red-600",
        };
        return <span className={`font-medium ${colorMap[status]}`}>{status}</span>;
      },
    },
    {
      header: "Đơn đã giao",
      accessor: (row) => row.user.orders?.length || 0,
      sortable: true,
    },
  ];

  return (
    <div className="p-4">
      <Header
        title="Quản lý Shipper"
        description="Theo dõi, thêm, xoá và quản lý shipper"
        actions={[{
          label: "Thêm shipper",
          icon: <PlusIcon className="w-5 h-5" />,
          onClick: () => setIsAddModalOpen(true),
          variant: "primary",
        }]}
      />

      <NavigationBar
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab as "list" | "requests")}
        tabs={[
          { key: "list", label: "Danh sách shipper" },
          { key: "requests", label: `Yêu cầu duyệt (${pendingShippers.length})` },
        ]}
      />

      {activeTab === "list" && (
        <>
          <SearchAndFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Tìm shipper theo tên"
            additionalFilters={
              <>
                <select
                  value={sortField ?? ''}
                  onChange={(e) => {
                    const field = e.target.value as keyof Shipper;
                    setSortField(field || null);
                    setSortDirection('asc'); // mặc định asc khi chọn mới
                  }}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Sắp xếp theo...</option>
                  <option value="cccd">CCCD</option>
                  <option value="driverLicense">GPLX</option>
                  <option value="status">Trạng thái</option>
                </select>
            
                <select
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
            
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </>
            }
            
          />
          <Table
            columns={shipperColumns}
            data={paginatedData}
            selectable={true}
            selectedItems={selectedShippers}
            onSelectItem={(id, checked) =>
              setSelectedShippers((prev) =>
                checked ? [...prev, id] : prev.filter((sid) => sid !== id)
              )
            }
            onSelectAll={(checked) =>
              setSelectedShippers(checked ? paginatedData.map((s) => s.id) : [])
            }
            showActions
            actions={[
              {
                label: "Xem chi tiết",
                icon: <EyeIcon className="h-4 w-4" />,
                onClick: (id: string) => {
                  const found = (activeShippers as Shipper[]).find((s) => s.id === id);
                  setSelectedDetail(found || null);
                },
              },
              {
                label: "Xoá",
                icon: <TrashIcon className="h-4 w-4" />,
                onClick: (id: string) => {
                  alert(`Bạn đang xoá shipper ${id}`);
                },
              },
            ]}
            onSort={(field, dir) => {
              setSortField(field as keyof Shipper);
              setSortDirection(dir);
            }}
            sortField={sortField}
            sortDirection={sortDirection}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={Math.ceil(filtered.length / pagination.pageSize)}
            pageSize={pagination.pageSize}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
            onPageSizeChange={(size) =>
              setPagination({ currentPage: 1, pageSize: size, totalPages: Math.ceil(filtered.length / size) })
            }
            pageSizeOptions={[10, 20, 50]}
          />
        </>
      )}

      {selectedDetail && (
        <Dialog open={true} onOpenChange={() => setSelectedDetail(null)}>
          <DialogContent>
            <DialogTitle>Chi tiết shipper</DialogTitle>
            <div className="space-y-2">
              <p><strong>Họ tên:</strong> {selectedDetail.user.name}</p>
              <p><strong>Email:</strong> {selectedDetail.user.email}</p>
              <p><strong>Điện thoại:</strong> {selectedDetail.user.phone}</p>
              <p><strong>CCCD:</strong> {selectedDetail.cccd}</p>
              <p><strong>GPLX:</strong> {selectedDetail.driverLicense}</p>
              <p><strong>Trạng thái:</strong> {selectedDetail.status}</p>
              <p><strong>Đơn đã giao:</strong> {selectedDetail.user.orders?.length || 0}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

{activeTab === "requests" && (
  <div className="overflow-x-auto">
    <Table
      columns={shipperColumns}
      data={pendingShippers}
      showActions
      actions={[
        {
          label: "Xem chi tiết",
          icon: <EyeIcon className="h-4 w-4" />,
          onClick: (id: string) => {
            const found = (pendingShippers as Shipper[]).find((s) => s.id === id);
            setSelectedRequestDetail(found || null);
          },
        },
        {
          label: "Duyệt",
          icon: <CheckIcon className="h-4 w-4" />,
          onClick: (id: string) => {
            const shipper = pendingShippers.find((s) => s.id === id);
            if (shipper && shipper.user?.id) {
              approveShipper(shipper.user.id);
            } else {
              console.warn("Không tìm thấy user.id để duyệt");
            }
          },
        },
        {
          label: "Từ chối",
          icon: <XIcon className="h-4 w-4" />,
          onClick: (id: string) => {
            const shipper = pendingShippers.find((s) => s.id === id);
            if (shipper && shipper.user?.id) {
              rejectShipper(shipper.user.id);
            } else {
              console.warn("Không tìm thấy user.id để từ chối");
            }
          },
        }
        
      ]}
    />
  </div>
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
        <p><strong>Đơn đã giao:</strong> {selectedRequestDetail.user.orders?.length || 0}</p>
        <div className="flex gap-3 pt-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={async () => {
              console.log("👉 Approving shipper ID:", selectedRequestDetail?.id);

              await approveShipper(selectedRequestDetail.user.id);
              setSelectedRequestDetail(null);
            }}
          >
            Duyệt
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={async () => {
              await rejectShipper(selectedRequestDetail.user.id);
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

    </div>
  );
};

export default ShipperAdminPage;
