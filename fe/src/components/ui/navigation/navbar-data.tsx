/**
 * Navigation data configuration
 *
 * This file contains the main navigation structure for the application.
 * Each navigation item can be a simple link or a dropdown with sub-items.
 */

import { NavItem } from "@/components/ui/navigation/types";
import {
  BookHeadphonesIcon,
  CirclePlayIcon,
  GraduationCapIcon,
  NewspaperIcon,
} from "lucide-react";

/**
 * Main navigation items array
 * Each item defines a main navigation entry in the navbar
 */
export const navigation: NavItem[] = [
  {
    title: "Về chúng tôi",
    path: "javascript:void(0)",
    isDropdown: true,
    navs: [
      {
        title: "Giới thiệu",
        desc: "Khám phá và làm chủ những kỹ năng mới",
        path: "/about",
        icon: <CirclePlayIcon className="h-5 w-5" />,
      },
      {
        title: "Blog",
        desc: "Sản phẩm chất lượng đồng hành cùng bạn trong mọi hành trình",
        path: "/blog",
        icon: <NewspaperIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Khám phá",
    path: "javascript:void(0)",
    isDropdown: true,
    navs: [
      {
        title: "Khóa học",
        desc: "Khám phá và làm chủ những kỹ năng mới",
        path: "/courses",
        icon: <GraduationCapIcon className="h-5 w-5" />,
      },
      {
        title: "Thư viện sách nói",
        desc: "Khám phá thêm về sách nói",
        path: "/audiobooks",
        icon: <BookHeadphonesIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Cửa hàng của tôi",
    path: "/my-shop",
    isDropdown: false,
  },
];
