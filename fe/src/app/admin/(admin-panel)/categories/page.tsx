"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Edit2Icon, TrashIcon, FilterIcon, SortAscIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

import Header from "@/app/admin/(admin-panel)/_components/header";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import AddCategoryForm from "./_components/add-category-modal";
import EditCategoryForm from "./_components/edit-category-modal";
import { adminService, CategoryResponse } from "@/api/admin";
import { useAuth } from "@/context/auth-context";

type SortDirection = 'asc' | 'desc' | null;

const CategoryAdminPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof CategoryResponse | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryResponse | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await adminService.Category.getCategories(token, pagination.currentPage, pagination.pageSize);
        setCategories(res.items);
        setPagination((prev) => ({
          ...prev,
          totalPages: res.totalPages,
        }));
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchData();
  }, [pagination.currentPage, pagination.pageSize]);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCategories = [...filteredCategories];
  if (sortField && sortDirection) {
    sortedCategories.sort((a, b) => {
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

      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        return sortDirection === "asc"
          ? aValue.length - bValue.length
          : bValue.length - aValue.length;
      }

      return 0;
    });
  }

  const paginatedData = sortedCategories.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );

  const handleSort = (field: keyof CategoryResponse, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(paginatedData.map(c => c.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleCheckCategory = (id: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, id] : prev.filter((cid) => cid !== id)
    );
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
      pageSize: size,
    }));
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    if (!token) return;

    await adminService.Category.deleteCategory(token, id);
    const res = await adminService.Category.getCategories(token, pagination.currentPage, pagination.pageSize);
    setCategories(res.items);
  };

  const categoryColumns: Column<CategoryResponse>[] = [
    { header: "Tên danh mục", accessor: "name", sortable: true },
    {
      header: "Hình ảnh",
      accessor: (row) => (
        <img src={row.image} alt={row.name} className="w-12 h-12 object-cover rounded" />
      ),
      sortable: false,
    },
    {
      header: "Số món ăn",
      accessor: "foodCount",
      sortable: false,
      renderCell: (_, row) => row.foodCount,
    }
  ];

  const categoryActions: Action[] = [
    {
      label: "Chỉnh sửa",
      icon: <Edit2Icon className="h-4 w-4" />,
      onClick: (id) => {
        const cat = categories.find(c => c.id === id);
        if (cat) setEditCategory(cat);
      },
    },
    {
      label: "Xóa",
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: (id) => handleDelete(id),
    }
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
        title="Quản lý danh mục"
        description="Danh mục các món ăn, thức uống trong hệ thống"
        actions={[
          {
            label: "Thêm danh mục",
            icon: <PlusIcon className="w-5 h-5" />,
            onClick: () => setIsAddModalOpen(true),
            variant: "primary",
          }
        ]}
      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm danh mục theo tên"
        additionalFilters={filterControls}
      />

      <div className="overflow-x-auto">
        <Table
          columns={categoryColumns}
          data={paginatedData}
          selectable={true}
          selectedItems={selectedCategories}
          onSelectItem={handleCheckCategory}
          onSelectAll={handleCheckAll}
          showActions={true}
          actions={categoryActions}
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

      {/* Edit Category Modal */}
      {editCategory && (
        isDesktop ? (
          <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
            <DialogContent className="p-0 h-screen w-screen overflow-auto">
              <DialogTitle className="sr-only">Chỉnh sửa danh mục</DialogTitle>
              <EditCategoryForm
                category={editCategory}
                onClose={() => setEditCategory(null)}
                onUpdated={async () => {
                  const token = await getToken();
                  if (!token) return;
                  const res = await adminService.Category.getCategories(token, pagination.currentPage, pagination.pageSize);
                  setCategories(res.items);
                  setEditCategory(null);
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
            <DrawerContent className="h-screen p-0 overflow-auto">
              <DialogTitle className="sr-only">Chỉnh sửa danh mục</DialogTitle>
              <EditCategoryForm
                category={editCategory}
                onClose={() => setEditCategory(null)}
                onUpdated={async () => {
                  const token = await getToken();
                  if (!token) return;
                  const res = await adminService.Category.getCategories(token, pagination.currentPage, pagination.pageSize);
                  setCategories(res.items);
                  setEditCategory(null);
                }}
              />
            </DrawerContent>
          </Drawer>
        )
      )}

      {isDesktop ? (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="p-0 h-screen w-screen overflow-auto">
            <DialogTitle className="sr-only">Thêm danh mục</DialogTitle>
            <AddCategoryForm
              onClose={() => setIsAddModalOpen(false)}
              onCreated={(newList) => {
                setCategories(newList);
                setPagination((prev) => ({
                  ...prev,
                  totalPages: Math.ceil(newList.length / prev.pageSize),
                }));
              }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DrawerContent className="h-screen p-0 overflow-auto">
            <DialogTitle className="sr-only">Thêm danh mục</DialogTitle>
            <AddCategoryForm
              onClose={() => setIsAddModalOpen(false)}
              onCreated={(newList) => {
                setCategories(newList);
                setPagination((prev) => ({
                  ...prev,
                  totalPages: Math.ceil(newList.length / prev.pageSize),
                }));
              }}
            />
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default CategoryAdminPage;
