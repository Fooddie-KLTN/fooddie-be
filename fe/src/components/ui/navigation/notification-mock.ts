/**
 * Mock notification data for development and testing
 *
 * This file provides sample notification data to be displayed in the navbar
 * notification dropdown. In a production environment, this would be replaced
 * with real data from an API.
 */

import { Notification } from "@/components/ui/navigation/types";

/**
 * Sample notification data
 */
export const notificationMock: Notification[] = [
  {
    title: "Thầy Nguyễn Văn Đức vừa trả lời bình luận của bạn...",
    time: "3 giờ cách đây",
    avatar: "https://i.pravatar.cc/150?img=68",
  },
  {
    title: "Bạn có một khóa học mới được kích hoạt",
    time: "5 giờ cách đây",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    title: "Khóa học 'Thần số học' đang có ưu đãi đặc biệt",
    time: "1 ngày cách đây",
    avatar: "https://i.pravatar.cc/150?img=45",
  },
  {
    title: "Bài học mới đã được cập nhật trong khóa học của bạn",
    time: "2 ngày cách đây",
    avatar: "https://i.pravatar.cc/150?img=22",
  },
  {
    title: "Thầy Nguyễn Văn Đức đã đăng một bài viết mới",
    time: "3 ngày cách đây",
    avatar: "https://i.pravatar.cc/150?img=68",
  },
];
