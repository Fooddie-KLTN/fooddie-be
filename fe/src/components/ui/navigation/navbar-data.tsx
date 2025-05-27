/**
 * Navigation data configuration
 *
 * This file contains the main navigation structure for the application.
 * Each navigation item can be a simple link or a dropdown with sub-items.
 */

import { NavItem } from "@/components/ui/navigation/types";
import {
  HouseIcon,
  SoupIcon,
} from "lucide-react";

/**
 * Main navigation items array
 * Each item defines a main navigation entry in the navbar
 */
export const navigation: NavItem[] = [

  {
    title: "Khám phá",
    path: "javascript:void(0)",
    isDropdown: true,
    navs: [
      {
        title: "Cửa hàng",
        desc: "Khám phá những cửa hàng gần đây",
        path: "/courses",
        icon: <HouseIcon className="h-5 w-5" />,
      },
      {
        title: "Món ăn",
        desc: "Khám phá thêm về món ăn quanh bạn",
        path: "/audiobooks",
        icon: <SoupIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Cửa hàng của tôi",
    path: "/my-shop",
    isDropdown: false,
  },
];
