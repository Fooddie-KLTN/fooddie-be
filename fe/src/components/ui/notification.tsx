"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X } from "lucide-react";

// Type definitions
type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  message: string;
  type: NotificationType;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

interface NotificationContextType {
  message: string;
  type: NotificationType;
  visible: boolean;
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: () => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType>({
  message: "",
  type: "info",
  visible: false,
  showNotification: () => {},
  hideNotification: () => {},
});

// Provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    visible: boolean;
    timer: NodeJS.Timeout | null;
  }>({
    message: "",
    type: "info",
    visible: false,
    timer: null,
  });

  useEffect(() => {
    return () => {
      // Clear any timers on unmount
      if (notification.timer) {
        clearTimeout(notification.timer);
      }
    };
  }, [notification.timer]);

  const showNotification = (message: string, type: NotificationType, duration = 3000) => {
    // Clear any existing timers
    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    // Set up a new timer
    const timer = setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, duration);

    setNotification({
      message,
      type,
      visible: true,
      timer,
    });
  };

  const hideNotification = () => {
    if (notification.timer) {
      clearTimeout(notification.timer);
    }
    setNotification((prev) => ({ ...prev, visible: false, timer: null }));
  };

  return (
    <NotificationContext.Provider
      value={{
        message: notification.message,
        type: notification.type,
        visible: notification.visible,
        showNotification,
        hideNotification,
      }}
    >
      {children}
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};

// Hook to use the notification system
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

// The notification component itself
const Notification = ({ message, type, visible, onClose, duration = 3000 }: NotificationProps) => {
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible && duration > 0) {
      timer = setTimeout(onClose, duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const bgColorClass = {
    success: "bg-green-100 text-green-800 border border-green-200",
    error: "bg-red-100 text-red-800 border border-red-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200"
  }[type];

  const iconMap = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 000-2H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={`fixed top-[15vh] right-4 z-50 p-4 rounded-md shadow-md transition-all duration-500 ${bgColorClass}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">{iconMap[type]}</div>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded-sm"
          aria-label="Close notification"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Also export as standalone component for simple use cases
export default Notification;