"use client";

import { authService } from "@/api/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BellRingIcon,
  ChartNoAxesColumnIcon,
  ChevronDownIcon,
  FileTextIcon,
  GraduationCapIcon,
  LibraryBigIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareMoreIcon,
  SettingsIcon,
  TicketPercentIcon,
  UserPenIcon,
  UsersIcon,
  XIcon,
  StoreIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import "../../styles/globals.css";
import NavbarBrand from "./navigation/navbar-brand";

// Interface for navigation tabs
interface Tab {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
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
  },
  {
    label: "Quản lý mã giảm giá",
    icon: TicketPercentIcon,
    path: "/promotions",
  },
  {
    label: "Quản lý cửa hàng",
    icon: StoreIcon,
    path: "/stores",
  },
  {
    label: "Quản lý danh mục",
    icon: LibraryBigIcon,
    path: "/categories",
  },
  {
    label: "Quản lý đơn hàng",
    icon: FileTextIcon,
    path: "/orders",
  },
  {
    label: "Quản lý shipper",
    icon: UsersIcon,
    path: "/shippers",
  },
  {
    label: "Sự kiện",
    icon: MessageSquareMoreIcon,
    path: "/events",
  },
  {
    label: "Hệ thống",
    icon: GraduationCapIcon,
    path: "/rules",
  },
];

const additionalTabs: PublicTab[] = [
  { label: "Cài đặt", icon: SettingsIcon, path: "/settings" },
];

/**
 * Sidebar component for the admin dashboard.
 */
const Sidebar = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(max-width: 1023px)");
  const { getToken, user, logout } = useAuth();

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, setState] = useState(false);
  const [searchQuery, ] = useState(""); // State for search query

  const handleLogout = async () => {
    try {
      await logout();
      const token = await getToken();
      if (token) {
        await authService.logout();
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
        : [...prev, label]
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

  // Function to filter tabs based on search query only (no permissions check)
  const filterTabs = (tabs: Tab[], query: string): Tab[] => {
    const lowerQuery = query.toLowerCase();
    return tabs
      .filter((tab) => {
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

  // Compute filtered tabs (only by search, no permissions)
  const renderedTabs = filterTabs(tabs, searchQuery);
  const filteredAdditionalTabs = additionalTabs.filter((tab) =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const shouldShowDashboard = dashboardTab.label
    .toLowerCase()
    .includes(searchQuery.toLowerCase());

  // Helper to highlight active tab
  const isPathActive = (tabPath: string, currentPath: string): boolean => {
    if (!tabPath) return false;

    // Special case for dashboard
    if (tabPath === "/admin") {
      return currentPath === "/admin";
    }

    // For other paths
    const normalizedTabPath = tabPath.replace(/\/$/, "");
    const normalizedCurrentPath = currentPath.replace(/\/$/, "");
    if (normalizedTabPath === "/admin" && normalizedCurrentPath !== "/admin") return false;
    return normalizedCurrentPath.startsWith(normalizedTabPath);
  };

  return (
    <>
      {(isMobile || isTablet) && !sidebarOpen && !state && (
        <button
          title="open menu"
          className="fixed top-1/2 -left-1 z-50 p-2 bg-primary text-white rounded-md shadow-md hover:bg-primary/80 transition-colors"
          onClick={handleToggle}
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      )}

      <aside
        className={`
    fixed h-screen z-50 flex flex-col bg-primary shadow-lg text-white
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
        <div className="flex items-center justify-between p-4 border-b border-primary/50">
          <NavbarBrand state={state} setState={setState} showButton={false} />
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-primary-100 hover:text-white hover:bg-primary/50 rounded-full transition-colors"
              title="notification"
            >
              <BellRingIcon className="h-5 w-5" />
            </button>
            {(isMobile || isTablet) && (
              <button
                className="p-2 text-primary-100 hover:text-white hover:bg-primary/50 rounded-full transition-colors"
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
          {/* Search Bar could be added here if needed */}

          <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            <ul>
              {shouldShowDashboard && (
                <li className="mb-1">
                  <Link
                    href={dashboardTab.path}
                    onClick={handleNavigation}
                    className={`flex items-center p-2 rounded-md transition-colors ${
                      pathname === "/admin"
                        ? "bg-primary/70 text-white"
                        : "text-primary-100 hover:bg-primary/50 hover:text-white"
                    }`}
                  >
                    {dashboardTab.icon && (
                      <dashboardTab.icon
                        className={`w-5 h-5 min-w-[1.25rem] mr-2 ${
                          pathname === "/admin"
                            ? "text-white"
                            : "text-primary-200"
                        }`}
                      />
                    )}
                    <span className="truncate">{dashboardTab.label}</span>
                  </Link>
                </li>
              )}
              {renderedTabs.map((tab) => {
                const isActive =
                  tab.path && isPathActive(`/admin${tab.path}`, pathname);
                const hasChildren = tab.children && tab.children.length > 0;

                return (
                  <li key={tab.label} className="mb-1">
                    <div className="flex items-center justify-between">
                      {tab.path ? (
                        <Link
                          href={`/admin${tab.path}`}
                          onClick={handleNavigation}
                          className={`flex items-center p-2 rounded-md flex-1 transition-colors ${
                            isActive
                              ? "bg-primary/70 text-white"
                              : "text-primary-100 hover:bg-primary/50 hover:text-white"
                          }`}
                        >
                          {tab.icon && (
                            <tab.icon
                              className={`w-5 h-5 min-w-[1.25rem] mr-2 ${
                                isActive ? "text-white" : "text-primary-200"
                              }`}
                            />
                          )}
                          <span className="truncate">{tab.label}</span>
                        </Link>
                      ) : (
                        <span
                          className={`flex items-center p-2 rounded-md text-primary-100 flex-1 cursor-pointer hover:bg-primary/50 hover:text-white ${
                            openTabs.includes(tab.label) ? "bg-primary/50" : ""
                          }`}
                          onClick={() =>
                            hasChildren && toggleTab(tab.label)
                          }
                        >
                          {tab.icon && (
                            <tab.icon className="w-5 h-5 min-w-[1.25rem] mr-2 text-primary-200" />
                          )}
                          <span className="truncate">{tab.label}</span>
                        </span>
                      )}
                      {hasChildren && (
                        <ChevronDownIcon
                          className={`w-5 h-5 transform transition-transform text-primary-200 ${
                            openTabs.includes(tab.label) ? "rotate-180" : ""
                          }`}
                          onClick={() => toggleTab(tab.label)}
                        />
                      )}
                    </div>
                    {hasChildren && openTabs.includes(tab.label) && (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          openTabs.includes(tab.label) ? "max-h-96" : "max-h-0"
                        }`}
                      >
                        <ul className="ml-7 mt-1 overflow-hidden">
                          {tab.children?.map((child) => {
                            const isChildActive = isPathActive(
                              `/admin${child.path}`,
                              pathname
                            );
                            return (
                              <li key={child.path} className="mb-1">
                                {child.path && (
                                  <Link
                                    href={`/admin${child.path}`}
                                    onClick={handleNavigation}
                                    className={`flex items-center p-2 rounded-md transition-colors ${
                                      isChildActive
                                        ? "bg-primary/70 text-white"
                                        : "text-primary-100 hover:bg-primary/50 hover:text-white"
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
                const isActive = isPathActive(`/admin${tab.path}`, pathname);
                return (
                  <li key={tab.label} className="mb-1">
                    <Link
                      href={`/admin${tab.path}`}
                      onClick={handleNavigation}
                      className={`flex items-center p-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary/70 text-white"
                          : "text-primary-100 hover:bg-primary/50 hover:text-white"
                      }`}
                    >
                      {tab.icon && (
                        <tab.icon
                          className={`w-5 h-5 min-w-[1.25rem] mr-2 ${
                            isActive ? "text-white" : "text-primary-200"
                          }`}
                        />
                      )}
                      <span className="truncate">{tab.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="p-4 border-t border-primary/50">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user?.avatar ?? ""} />
              <AvatarFallback className="bg-primary/40 text-white">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="ml-2 overflow-hidden">
              <p className="font-medium text-white truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-sm text-primary-200 truncate">
                {user?.email || "admin@example.com"}
              </p>
            </div>
            <button
              name="logout"
              title="logout"
              onClick={handleLogout}
              className="p-2 ml-5 text-primary-100 hover:text-white hover:bg-primary/50 rounded-full transition-colors"
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
