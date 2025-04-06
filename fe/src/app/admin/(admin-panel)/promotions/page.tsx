"use client";

import { useEffect, useState } from "react";
import { CloudUploadIcon, FilterIcon, PlusIcon, SortAscIcon, Edit2Icon, TrashIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

import Header from "@/app/admin/(admin-panel)/_components/header";
import NavigationBar from "@/app/admin/(admin-panel)/_components/tab";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import AddPromotionForm from "./_components/add-promotion-modal";

type SortDirection = 'asc' | 'desc' | null;

interface Promotion {
  id: string;
  description: string;
  discountPercent: number;
  code: string;
  orders: any[];
}

const PromotionsAdminPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Promotion | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotions, setSelectedPromotions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const data = localStorage.getItem("promotions");
    const parsed = data ? JSON.parse(data) : [];
    setPromotions(parsed);
    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(parsed.length / prev.pageSize),
    }));
  }, []);

  const filteredPromotions = promotions.filter((promo) =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPromotions = [...filteredPromotions];
  if (sortField && sortDirection) {
    sortedPromotions.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
  
      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
  
      // Handle number comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
  
      // Handle array length comparison (e.g. orders)
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        return sortDirection === "asc"
          ? aValue.length - bValue.length
          : bValue.length - aValue.length;
      }
  
      return 0; // fallback for unsupported types
    });
  }
  

  const paginatedData = sortedPromotions.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      setSelectedPromotions(paginatedData.map((p) => p.id));
    } else {
      setSelectedPromotions([]);
    }
  };

  const handleCheckPromotion = (id: string, checked: boolean) => {
    setSelectedPromotions((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id)
    );
  };

  const handleSort = (field: keyof Promotion, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({
      currentPage: 1,
      pageSize: size,
      totalPages: Math.ceil(promotions.length / size),
    });
  };

  const handleDelete = (id: string) => {
    const updated = promotions.filter((promo) => promo.id !== id);
    localStorage.setItem("promotions", JSON.stringify(updated));
    setPromotions(updated);
  };

  const promotionColumns: Column<Promotion>[] = [
    { header: "Code", accessor: "code", sortable: true },
    { header: "Description", accessor: "description", sortable: true },
    { header: "Discount (%)", accessor: "discountPercent", sortable: true },
    {
      header: "Order Count",
      accessor: "orders",
      sortable: false,
      renderCell: (_, row) => row.orders.length,
    },
  ];
  

  const promotionActions: Action[] = [
    {
      label: "Edit",
      icon: <Edit2Icon className="h-4 w-4" />,
      onClick: (id) => console.log("Edit", id),
    },
    {
      label: "Delete",
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: (id) => handleDelete(id),
    },
  ];

  const filterControls = (
    <>
      <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <SortAscIcon className="w-5 h-5" />
        <span>Sort</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <FilterIcon className="w-5 h-5" />
        <span>Filter</span>
      </button>
    </>
  );

  const headerActions = [
    {
      label: "Thêm nhiều",
      icon: <CloudUploadIcon className="w-5 h-5" />,
      onClick: () => setIsCsvModalOpen(true),
      variant: "secondary" as const,
    },
    {
      label: "Thêm mã",
      icon: <PlusIcon className="w-5 h-5" />,
      onClick: () => setIsAddModalOpen(true),
      variant: "primary" as const,
    },
  ];

  return (
    <div className="p-4">
      <Header
        title="Quản lý mã giảm giá"
        description="Theo dõi, tạo và chỉnh sửa các mã giảm giá"
        actions={headerActions}
      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm theo mã code"
        additionalFilters={filterControls}
      />

      <div className="overflow-x-auto">
        <Table
          columns={promotionColumns}
          data={paginatedData}
          selectable={true}
          selectedItems={selectedPromotions}
          onSelectItem={handleCheckPromotion}
          onSelectAll={handleCheckAll}
          showActions={true}
          actions={promotionActions}
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

      {/* Modal Thêm mã */}
      {isDesktop ? (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="p-0 h-screen w-screen overflow-auto">
            <DialogTitle className="sr-only">Thêm mã mới</DialogTitle>
            <AddPromotionForm onClose={() => setIsAddModalOpen(false)} />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DrawerContent className="h-screen p-0 overflow-auto">
            <DialogTitle className="sr-only">Thêm mã mới</DialogTitle>
            <AddPromotionForm onClose={() => setIsAddModalOpen(false)} />
          </DrawerContent>
        </Drawer>
      )}

      {/* Modal Thêm nhiều */}
      
    </div>
  );
};

export default PromotionsAdminPage;
