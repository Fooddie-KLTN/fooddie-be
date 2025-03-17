"use client";

import { authService } from "@/api/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useUser } from "@/context/user-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BellRingIcon,
  ChartNoAxesColumnIcon,
  ChevronDownIcon,
  FileTextIcon,
  GraduationCapIcon,
  LibraryBigIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareMoreIcon,
  ServerIcon,
  SettingsIcon,
  TicketPercentIcon,
  UserPenIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { auth } from "../../../firebaseconfig";
import "../../styles/globals.css";
import NavbarBrand from "./navigation/navbar-brand";
import { SearchBar } from "./searchbar";

// Interface for navigation tabs
interface Tab {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  permission: string;
  children?: Tab[];
}

interface PublicTab {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
}

const dashboardTab = {
  label: "Thống kê",
  icon: ChartNoAxesColumnIcon,
  path: "/admin",
};

const tabs: Tab[] = [
  {
    label: "Quản lý người dùng",
    icon: UserPenIcon,
    path: "/users",
    permission: "read_user",
  },
  {
    label: "Quản lý nhóm học",
    icon: UsersIcon,
    path: "/groups",
    permission: "read_student_group",
  },
  {
    label: "Quản lý khóa học",
    icon: GraduationCapIcon,
    permission: "read_course",
    children: [
      {
        label: "Khóa cơ bản",
        path: "/courses",
        permission: "read_course",
      },
      {
        label: "Khóa lộ trình",
        path: "/course-path",
        permission: "read_course",
      }
    ],
  },
  {
    label: "Quản lý nội dung",
    icon: FileTextIcon,
    path: "/content",
    permission: "read_content",
  },
  {
    label: "Thi trắc nghiệm",
    icon: LibraryBigIcon,
    path: "/quizzes",
    permission: "read_exam",
  },
  {
    label: "Quản lý phản hồi",
    icon: MessageSquareMoreIcon,
    path: "/feedback",
    permission: "read_review",
  },
  {
    label: "Quản lý mã giảm giá",
    icon: TicketPercentIcon,
    path: "/promotions",
    permission: "read_promotion",
  },
  {
    label: "Vai trò & Phân quyền",
    icon: ServerIcon,
    path: "/roles",
    permission: "view_role",
  },
];

const additionalTabs: PublicTab[] = [
  { label: "Hỗ trợ", icon: LifeBuoyIcon, path: "/support" },
  { label: "Cài đặt", icon: SettingsIcon, path: "/settings" },
];

/**
 * Sidebar component for the admin dashboard.
 * 
 * This component renders a sidebar navigation with collapsible tab sections 
 * based on user permissions. It provides functionalities for searching, 
 * filtering, and navigating through tabs, as well as handling user logout.
 * 
 * State Management:
 * - `openTabs`: Manages which tab sections are expanded.
 * - `sidebarOpen` and `state`: Control the sidebar's visibility and animation state.
 * - `searchQuery`: Holds the current search input for filtering tabs.
 * 
 * Hooks:
 * - `useUser`: Retrieves user permissions.
 * - `usePathname`: Gets the current URL pathname for active link styling.
 * - `useIsMobile` and `useMediaQuery`: Determine device screen size for responsive design.
 * - `useAuth`: Provides authentication functionalities like token retrieval and user state.
 * 
 * Functions:
 * - `handleLogout`: Logs out the user and reloads the page.
 * - `toggleTab`: Toggles the open state of a tab section.
 * - `handleNavigation`: Closes the sidebar on mobile/tablet after navigation.
 * - `handleToggle`: Toggles the sidebar's open/close state.
 * - `filterTabs`: Filters tabs based on search query and permissions.
 * - `isPathActive`: Checks if a tab's path matches the current pathname.
 * 
 * Renders an overlay for mobile/tablet when the sidebar is open and a spacer 
 * for the desktop layout.
 */

const Sidebar = () => {
  const { permissions }: { permissions: string[] } = useUser();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(max-width: 1023px)');
  const { getToken, user } = useAuth();

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, setState] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  const handleLogout = async () => {
    try {
      await auth.signOut();
      const token = await getToken();
      if (token) {
        await authService.logout(token);
      }
      window.location.reload();
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  const toggleTab = (label: string) => {
    setOpenTabs((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label],
    );
  };

  const handleNavigation = () => {
    if (isMobile || isTablet) {
      setSidebarOpen(false);
      setState(false);
    }
  };

  const handleToggle = () => {
    setSidebarOpen(!sidebarOpen);
    setState(!state);
  };

  // Function to filter tabs based on search query and permissions
  const filterTabs = (tabs: Tab[], query: string): Tab[] => {
    const lowerQuery = query.toLowerCase();
    return tabs
      .filter((tab) => {
        if (!permissions.includes(tab.permission)) return false;
        const matches = tab.label.toLowerCase().includes(lowerQuery);
        if (!tab.children) {
          return matches;
        } else {
          const filteredChildren = filterTabs(tab.children, query);
          return matches || filteredChildren.length > 0;
        }
      })
      .map((tab) => {
        if (tab.children) {
          return {
            ...tab,
            children: filterTabs(tab.children, query),
          };
        }
        return tab;
      });
  };

  // Compute filtered tabs
  const renderedTabs = filterTabs(tabs, searchQuery);
  const filteredAdditionalTabs = additionalTabs.filter((tab) =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const shouldShowDashboard = dashboardTab.label
    .toLowerCase()
    .includes(searchQuery.toLowerCase());
  // Helper to highlight tab
  // Update the isPathActive function to handle the dashboard path specially
  const isPathActive = (
    tabPath: string,
    currentPath: string,
  ): boolean => {
    if (!tabPath) return false;

    // Special case for dashboard
    if (tabPath === "/admin") {
      return currentPath === "/admin";
    }

    // For other paths
    const normalizedTabPath = tabPath.replace(/\/$/, "");
    const normalizedCurrentPath = currentPath.replace(/\/$/, "");
    return normalizedCurrentPath.startsWith(normalizedTabPath);
  };
  return (
    <>
      {(isMobile || isTablet) && !sidebarOpen && !state && (
        <button
          title="close"
          className="fixed top-1/2 -left-1 z-50 p-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"
          onClick={handleToggle}
        >
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>
      )}

      <aside
        className={`
    fixed h-screen z-50 flex flex-col bg-white shadow-lg
    transition-all duration-300 ease-in-out
    ${
      isMobile || isTablet
        ? sidebarOpen
          ? "left-0 w-[280px] sm:w-[320px]"
          : "-left-full w-[280px] sm:w-[320px]"
        : "left-0 w-[280px]"
    }
  `}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <NavbarBrand
            state={state}
            setState={setState}
            showButton={false}
          />
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="notification"
            >
              <BellRingIcon className="h-5 w-5" />
            </button>
            {(isMobile || isTablet) && (
              <button
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => {
                  setSidebarOpen(false);
                  setState(false);
                }}
                title="Close sidebar"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Rest of the sidebar content */}
        <div className="flex-1 overflow-y-hidden p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm menu..."
            />
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            <ul>
              {shouldShowDashboard && (
                <li className="mb-1">
                  <Link
                    href={dashboardTab.path}
                    onClick={handleNavigation}
                    className={`flex items-center p-2 rounded-md transition-colors ${
                      pathname === "/admin" // Direct comparison for dashboard
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {dashboardTab.icon && (
                      <dashboardTab.icon
                        className={`w-5 h-5 min-w-[1.25rem] mr-2 ${
                          pathname === "/admin"
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      />
                    )}
                    <span className="truncate">
                      {dashboardTab.label}
                    </span>
                  </Link>
                </li>
              )}{" "}
              {renderedTabs.map((tab) => {
                const isActive =
                  tab.path &&
                  isPathActive(`/admin${tab.path}`, pathname);
                const hasChildren =
                  tab.children && tab.children.length > 0;

                return (
                  <li key={tab.label} className="mb-1">
                    <div className="flex items-center justify-between">
                      {tab.path ? (
                        <Link
                          href={`/admin${tab.path}`}
                          onClick={handleNavigation}
                          className={`flex items-center p-2 rounded-md flex-1 transition-colors ${
                            isActive
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {tab.icon && (
                            <tab.icon
                              className={`w-5 h-5 min-w-[1.25rem] mr-2 ${
                                isActive
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            />
                          )}
                          <span className="truncate">
                            {tab.label}
                          </span>
                        </Link>
                      ) : (
                        <span
                          className={`flex items-center p-2 rounded-md text-gray-700 flex-1 cursor-pointer hover:bg-gray-100 ${
                            openTabs.includes(tab.label)
                              ? "bg-gray-50"
                              : ""
                          }`}
                          onClick={() =>
                            hasChildren && toggleTab(tab.label)
                          }
                        >
                          {tab.icon && (
                            <tab.icon className="w-5 h-5 min-w-[1.25rem] mr-2 text-gray-500" />
                          )}
                          <span className="truncate">
                            {tab.label}
                          </span>
                        </span>
                      )}
                      {hasChildren && (
                        <ChevronDownIcon
                          className={`w-5 h-5 transform transition-transform text-gray-500 ${
                            openTabs.includes(tab.label)
                              ? "rotate-180"
                              : ""
                          }`}
                          onClick={() => toggleTab(tab.label)}
                        />
                      )}
                    </div>
                    {hasChildren && openTabs.includes(tab.label) && (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          openTabs.includes(tab.label)
                            ? "max-h-96"
                            : "max-h-0"
                        }`}
                      >
                        <ul className="ml-7 mt-1 overflow-hidden">
                          {tab.children?.map((child) => {
                            const isChildActive = isPathActive(
                              `/admin${child.path}`,
                              pathname,
                            );
                            return (
                              <li key={child.path} className="mb-1">
                                {child.path && (
                                  <Link
                                    href={`/admin${child.path}`}
                                    onClick={handleNavigation}
                                    className={`flex items-center p-2 rounded-md transition-colors ${
                                      isChildActive
                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {child.label}
                                    </span>
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-4">
            <ul>
              {filteredAdditionalTabs.map((tab) => {
                const isActive = isPathActive(
                  `/admin${tab.path}`,
                  pathname,
                );
                return (
                  <li key={tab.label} className="mb-1">
                    <Link
                      href={`/admin${tab.path}`}
                      onClick={handleNavigation}
                      className={`flex items-center p-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {tab.icon && (
                        <tab.icon
                          className={`w-5 h-5 min-w-[1.25rem] mr-2 ${
                            isActive ? "text-white" : "text-gray-500"
                          }`}
                        />
                      )}
                      <span className="truncate">{tab.label}</span>
                    </Link>
                  </li>
                );
              })}{" "}
            </ul>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user?.photoURL ?? ""} />
              <AvatarFallback>ED</AvatarFallback>
            </Avatar>
            <div className="ml-2 overflow-hidden">
              <p className="font-medium text-gray-800 truncate">
                Olivia Rhyne
              </p>
              <p className="text-sm text-gray-500 truncate">
                olivia@unitlead.com
              </p>
            </div>
            <button
              name="logout"
              title="logout"
              onClick={handleLogout}
              className="p-2 ml-5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (isMobile || isTablet) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => {
            setSidebarOpen(false);
            setState(false);
          }}
        />
      )}

      {/* Spacer for desktop layout */}
      {!isMobile && !isTablet && (
        <div className="w-[280px] flex-shrink-0" />
      )}
    </>
  );
};

export default Sidebar;
