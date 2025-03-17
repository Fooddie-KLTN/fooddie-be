"use client";

import { useState, useEffect } from "react";
import { CloudUploadIcon, FilterIcon, PlusIcon, SortAscIcon, Edit2Icon, TrashIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { adminService } from "@/api/admin";

// Import the components
import Header from "@/app/admin/(admin-panel)/_components/header";
import NavigationBar from "@/app/admin/(admin-panel)/_components/tab";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import AddUserForm from "./_components/add-user-modal";
import UploadMultipleUsersForm from "./_components/add-csv-modal";


type SortDirection = 'asc' | 'desc' | null;
//type SortField = 'name' | 'group' | 'courses' | 'createdAt' | 'status' | null;

interface User {
    id: string;
    name: string;
    email: string;
    group: string;
    courses: number;
    createdAt: string;
    status: string;
}
interface UserHistory {
    id: string;
    name: string;
    email: string;
    phone: string;
    username: string;
    notificationType: 'email' | 'none';
    createdAt: string;
    status: 'complete' | 'pending' | 'error';
}
interface PaginationState {
    currentPage: number;
    totalPages: number;
    pageSize: number;
}

/**
 * @fileoverview Trang quản lý người dùng dành cho quản trị viên
 * 
 * @module AdminUserPage
 * 
 * @typedef {Object} User - Đối tượng thông tin người dùng
 * @property {string} id - ID của người dùng
 * @property {string} name - Tên người dùng
 * @property {string} email - Email của người dùng
 * @property {string} group - Nhóm của người dùng
 * @property {number} courses - Số lượng khóa học đã đăng ký
 * @property {string} createdAt - Ngày tạo tài khoản
 * @property {string} status - Trạng thái tài khoản
 * 
 * @typedef {Object} UserHistory - Đối tượng lịch sử thêm người dùng
 * @property {string} id - ID bản ghi lịch sử
 * @property {string} name - Tên người dùng
 * @property {string} email - Email của người dùng
 * @property {string} phone - Số điện thoại
 * @property {string} username - Tên đăng nhập
 * @property {'email'|'none'} notificationType - Loại thông báo
 * @property {string} createdAt - Thời gian tạo
 * @property {'complete'|'pending'|'error'} status - Trạng thái thêm người dùng
 * 
 * @typedef {Object} PaginationState - Trạng thái phân trang
 * @property {number} currentPage - Trang hiện tại
 * @property {number} totalPages - Tổng số trang
 * @property {number} pageSize - Số lượng mục trên mỗi trang
 * 
 * @typedef {'asc'|'desc'|null} SortDirection - Hướng sắp xếp
 * @typedef {'name'|'group'|'courses'|'createdAt'|'status'|null} SortField - Trường sắp xếp
 * 
 * @component UserAdminPage
 * @description Trang quản lý người dùng với các chức năng: xem danh sách, tìm kiếm, lọc,
 * sắp xếp, phân trang và thêm mới người dùng. Bao gồm hai tab: danh sách người dùng và
 * lịch sử thêm người dùng.
 * 
 * @returns {React.ReactElement} Component trang quản lý người dùng
 */
const UserAdminPage: React.FC = () => {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup,] = useState('all');
    const [sortField, setSortField] = useState<keyof User | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [userHistory,] = useState<UserHistory[]>([
        {
            id: '1',
            name: 'Nguyen Van A',
            email: 'nguyenvana@example.com',
            phone: '0912345678',
            username: 'nguyenvana',
            notificationType: 'email',
            createdAt: '2024-03-07',
            status: 'complete'
        },
        {
            id: '2',
            name: 'Tran Thi B',
            email: 'tranthib@example.com',
            phone: '0987654321',
            username: 'tranthib',
            notificationType: 'none',
            createdAt: '2024-03-06',
            status: 'pending'
        }
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10
    });
    const [activeTab, setActiveTab] = useState<'user' | 'history'>('user');

    const { getToken } = useAuth();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const filteredUsers =
        users
            ?.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
            ?.filter((user) => filterGroup === 'all' || user.group === filterGroup) ?? [];

    // Updated sorting logic - make sure it works correctly
    const sortedUsers = [...filteredUsers];
    if (sortField && sortDirection) {
        sortedUsers.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            // Handle different types of values
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                // For numbers and other types
                if (sortDirection === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            }
        });
    }

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const token = await getToken();
            if (!token) {
                console.error("No token available");
                return;
            }
            const response = await adminService.User.getUsers(
                token,
                pagination.currentPage,
                pagination.pageSize
            );
            setUsers(response.data);
            setPagination((prev) => ({
                ...prev,
                totalPages: Math.ceil(response.total / pagination.pageSize)
            }));
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({
            ...prev,
            currentPage: newPage
        }));
    };

    const handlePageSizeChange = (newSize: number) => {
        setPagination((prev) => ({
            ...prev,
            pageSize: newSize,
            currentPage: 1
        }));
    };

    const handleCheckAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(sortedUsers.map(user => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleCheckUser = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        }
    };

    // Handle sorting changes
    const handleSort = (field: keyof User, direction: SortDirection) => {
        console.log(`Sorting by ${String(field)} in ${direction} order`);
        setSortField(field);
        setSortDirection(direction);
    };

    useEffect(() => {
        fetchUsers();
    }, [pagination.currentPage, pagination.pageSize]);

    // Function to switch from add user modal to CSV upload modal
    const switchToUploadModal = () => {
        setIsAddUserModalOpen(false);
        setIsCsvModalOpen(true);
    };

    // Header actions configuration
    const headerActions = [
        {
            label: "Thêm nhiều",
            icon: <CloudUploadIcon className="w-5 h-5" />,
            onClick: () => setIsCsvModalOpen(true),
            variant: 'secondary' as const,
        },
        {
            label: "Thêm tài khoản",
            icon: <PlusIcon className="w-5 h-5" />,
            onClick: () => setIsAddUserModalOpen(true),
            variant: 'primary' as const,
        },
    ];

    // Tab configuration
    const tabs = [
        {
            key: 'user',
            label: 'Danh sách người dùng'
        },
        {
            key: 'history',
            label: 'Lịch sử thêm người dùng'
        }
    ];

    // User table columns configuration
    const userColumns: Column<User>[] = [
        { header: "User", accessor: "name" as keyof User, sortable: true },
        { header: "Group", accessor: "group" as keyof User, sortable: true },
        { header: "Courses", accessor: "courses" as keyof User, sortable: true },
        { header: "Created At", accessor: "createdAt" as keyof User, sortable: true },
        { header: "Status", accessor: "status" as keyof User, sortable: true }
    ];

    // User history table columns configuration
    const historyColumns: Column<UserHistory>[] = [
        { header: "Name", accessor: "name" as keyof UserHistory },
        { header: "Phone", accessor: "phone" as keyof UserHistory },
        { header: "Username", accessor: "username" as keyof UserHistory },
        { header: "Notification", accessor: "notificationType" as keyof UserHistory },
        { header: "Created At", accessor: "createdAt" as keyof UserHistory },
        { header: "Status", accessor: "status" as keyof UserHistory }
    ];

    // Actions for user rows
    const userActions: Action[] = [
        {
            label: "Edit User",
            icon: <Edit2Icon className="h-4 w-4" />,
            onClick: (id) => console.log(`Edit user ${id}`),
        },
        {
            label: "Delete User",
            icon: <TrashIcon className="h-4 w-4" />,
            onClick: (id) => console.log(`Delete user ${id}`),
        }
    ];

    // Actions for history rows
    const historyActions: Action[] = [
        {
            label: "View Details",
            icon: <Edit2Icon className="h-4 w-4" />,
            onClick: (id) => console.log(`View history details ${id}`),
        }
    ];

    const filterControls = (
        <>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <SortAscIcon className="w-5 h-5" />
                <span>Sort</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <FilterIcon className="w-5 h-5" />
                <span>Filter</span>
            </button>
        </>
    );



    return (
        <div className="p-4">
            {/* Header */}
            <Header
                title="Quản lý người dùng"
                description="Theo dõi, quản lý danh sách người dùng, học viên"
                actions={headerActions}
            />

            {/* Navigation Tabs */}
            <NavigationBar
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'user' | 'history')}
                tabs={tabs}
            />

            {/* Conditional Rendering Based on Active Tab */}
            {activeTab === 'history' ? (
                <div className="overflow-x-auto">
                    <SearchAndFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Tìm người dùng"
                    />

                    <Table
                        columns={historyColumns}
                        data={userHistory}
                        showActions={true}
                        actions={historyActions}
                        coloredStatus={true}
                    />
                </div>

            ) : (
                <>
                    <SearchAndFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Tìm người dùng"
                        additionalFilters={filterControls}
                    />

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <p>Loading...</p>
                            </div>
                        ) : (
                            <Table
                                columns={userColumns}
                                data={sortedUsers}
                                selectable={true}
                                selectedItems={selectedUsers}
                                onSelectItem={handleCheckUser}
                                onSelectAll={handleCheckAll}
                                showActions={true}
                                actions={userActions}
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
                        pageSizeOptions={[10, 20, 50, 100]}
                    />
                </>

            )}

            {/* Single User Modal */}
            {isDesktop ? (
                <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} modal={true}>
                    <DialogContent className="fixed left-0 top-0 right-0 bottom-0 w-screen h-screen max-w-none m-0 p-0 rounded-none overflow-auto bg-background z-[9999] data-[state=open]:animate-none data-[state=open]:transition-none" style={{ transform: 'none' }}>
                        <DialogTitle className="sr-only">Thêm người dùng mới</DialogTitle>
                        <div className="w-full h-full">
                            <AddUserForm
                                onClose={() => setIsAddUserModalOpen(false)}
                                onSwitchToUpload={switchToUploadModal}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} snapPoints={[1]}>
                    <DrawerContent className="h-screen p-0 rounded-t-lg z-[9999]">
                        <DialogTitle className="sr-only">Thêm người dùng mới</DialogTitle>
                        <div className="overflow-y-auto">
                            <AddUserForm
                                onClose={() => setIsAddUserModalOpen(false)}
                                onSwitchToUpload={switchToUploadModal}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            )}

            {/* CSV Upload Modal */}
            {isDesktop ? (
                <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen} modal={true}>
                    <DialogContent className="fixed left-0 top-0 right-0 bottom-0 w-screen h-screen max-w-none m-0 p-0 rounded-none overflow-auto bg-background z-[9999] data-[state=open]:animate-none data-[state=open]:transition-none" style={{ transform: 'none' }}>
                        <DialogTitle className="sr-only">Thêm nhiều người dùng</DialogTitle>
                        <div className="w-full h-full">
                            <UploadMultipleUsersForm
                                onClose={() => setIsCsvModalOpen(false)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen} snapPoints={[1]}>
                    <DrawerContent className="h-screen p-0 rounded-t-lg z-[9999]">
                        <DialogTitle className="sr-only">Thêm nhiều người dùng</DialogTitle>
                        <div className="overflow-y-auto">
                            <UploadMultipleUsersForm
                                onClose={() => setIsCsvModalOpen(false)}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    );
};

export default UserAdminPage;