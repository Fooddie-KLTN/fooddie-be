/**
 * Type definitions for the navigation system
 */

import { BackendUser } from "@/api/auth";
import { ReactNode } from "react";

/**
 * Represents a sub-navigation item
 */
export interface SubNavItem {
  title: string;
  desc: string;
  path: string;
  icon: ReactNode;
}

/**
 * Represents a main navigation item
 */
export interface NavItem {
  title: string;
  path: string;
  isDropdown: boolean;
  navs?: SubNavItem[];
}

/**
 * State for tracking dropdown open/close status
 */
export interface DropdownState {
  isActive: boolean;
  idx: number;
}

/**
 * Notification item structure
 */
export interface Notification {
  title: string;
  time: string;
  avatar: string;
}

/**
 * Props for the navbar component
 */
export interface NavbarProps {
  className?: string;
}

/**
 * Props for the navbar brand component
 */
export interface NavbarBrandProps {
  state: boolean;
  setState: (state: boolean) => void;
  showButton?: boolean;
}

/**
 * Props for the navbar menu component
 */
export interface NavbarMenuProps {
  state: boolean;
  navigation: NavItem[];
  dropdownState: DropdownState;
  setDropdownState: (state: DropdownState) => void;
  user: BackendUser | null;
  openModal: (type: "login" | "register" | "activate") => void;
  windowDimensions: { width: number; height: number };
}

/**
 * Props for the navigation items component
 */
export interface NavigationItemsProps {
  navigation: NavItem[];
  dropdownState: DropdownState;
  setDropdownState: (state: DropdownState) => void;
}

/**
 * Props for the search bar component
 */
export interface SearchBarProps {
  windowDimensions: { width: number; height: number };
}

/**
 * Props for the user actions component
 */
export interface UserActionsProps {
  user: BackendUser | null;
  openModal: (type: "login" | "register" | "activate") => void;
}
