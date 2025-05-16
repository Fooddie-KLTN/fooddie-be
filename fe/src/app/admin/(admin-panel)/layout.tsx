"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { UserProvider, Permission } from "@/context/user-context";
import { adminService } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {  HomeIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";



// Path mapping for breadcrumbs
const pathMap: Record<string, { label: string; parent?: string }> = {
  "/admin": { label: "Trang chủ" },
  "/admin/users": { label: "Quản lý người dùng" },
  "/admin/groups": { label: "Quản lý nhóm học" },
  "/admin/course-library": { label: "Thư viện khóa học" },
  "/admin/content": { label: "Quản lý nội dung" },
  "/admin/quizzes": { label: "Thi trắc nghiệm" },
  "/admin/feedback": { label: "Quản lý phản hồi" },
  "/admin/promotions": { label: "Quản lý mã giảm giá" },
  "/admin/roles": { label: "Vai trò & Phân quyền" },
};


/**
 * AdminLayout wraps the admin dashboard with a sidebar and breadcrumb
 * and handles permission loading and unauthenticated cases.
 *
 * @param {React.ReactNode} children The content to be rendered inside
 * the main section of the admin layout
 * @returns {React.ReactElement} The AdminLayout component
 */
/**
 * Layout component dành cho trang admin.
 * 
 * Component này xử lý:
 * - Tải và quản lý quyền người dùng từ API
 * - Hiển thị trạng thái loading trong quá trình tải quyền
 * - Xác thực người dùng và chuyển hướng nếu cần
 * - Cung cấp UserProvider để chia sẻ quyền với các component con
 * - Hiển thị sidebar điều hướng
 * - Hiển thị breadcrumb để định vị vị trí hiện tại
 * - Bao bọc nội dung trang admin trong một layout nhất quán
 * 
 * @component
 * @param {Object} props - Props của component
 * @param {React.ReactNode} props.children - Các component con sẽ được hiển thị trong layout
 * @returns {JSX.Element} Layout admin với sidebar, breadcrumb và nội dung chính
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(true); // New loading state

  const { getToken, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        console.log(
          "User not authenticated, skipping permission fetch",
        );
        setPermissions([]);
        setIsPermissionsLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.error("Token not found");
          setPermissions([]);
          setIsPermissionsLoading(false);
          return;
        }

        const response = await adminService.getMyRole(token);
        const data = response as {
          role: string;
          permissions: string[];
        };
        setPermissions(data.permissions as Permission[]);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setPermissions([]);
      } finally {
        setIsPermissionsLoading(false); // Always resolve loading state
      }
    };

    fetchPermissions();
  }, [getToken, user]);

  // Show a loading indicator until permissions are fetched
  if (isPermissionsLoading) {
    
    return <div>Loading permissions...</div>;
  }

  // Optional: Handle unauthenticated case
  if (!user) {
    return <div>User not authenticated. Please log in.</div>;}
    return (
      <UserProvider permissions={permissions}>
      <div className="flex h-screen ">
        <Sidebar />
        <main className="flex-1 bg-gray-50 p-6 scrollbar-stable">
          <div className="space-y-4 ">
            {/* Breadcrumb with border and radius */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <button 
                        title="dashboard" 
                        onClick={() => router.push('/admin')}
                        className="hover:text-primary transition-colors"
                      >
                        <HomeIcon className="w-5 h-5" />
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  { pathMap[pathname] && (
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {pathMap[pathname].label}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Main content with border and radius */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm 
            ">
              {children}
            </div>
          </div>
        </main>
      </div>
    </UserProvider>
  );
}
