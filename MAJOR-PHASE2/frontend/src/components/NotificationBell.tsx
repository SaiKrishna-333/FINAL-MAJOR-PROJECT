import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  onNotification,
  onTheftAlert,
  onRequestApproved,
  onRequestRejected,
  onNewRequest,
  offNotification,
  offTheftAlert,
  offRequestApproved,
  offRequestRejected,
  offNewRequest,
} from "../services/socketService";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const handleNotification = (data: unknown) => {
      const notificationData = data as {
        type?: string;
        title?: string;
        message?: string;
        timestamp?: string;
      };
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: notificationData.type || "info",
        title: notificationData.title || "Notification",
        message: notificationData.message || "",
        timestamp: notificationData.timestamp || new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleTheftAlert = (data: unknown) => {
      const alertData = data as {
        title?: string;
        message?: string;
        timestamp?: string;
      };
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "theft_alert",
        title: alertData.title || "THEFT ALERT",
        message: alertData.message || "",
        timestamp: alertData.timestamp || new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleRequestApproved = (data: unknown) => {
      const approvalData = data as {
        message?: string;
        timestamp?: string;
      };
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "approval",
        title: "Request Approved",
        message: approvalData.message || "Your request has been approved",
        timestamp: approvalData.timestamp || new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleRequestRejected = (data: unknown) => {
      const rejectionData = data as {
        message?: string;
        timestamp?: string;
      };
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "rejection",
        title: "Request Rejected",
        message: rejectionData.message || "Your request has been rejected",
        timestamp: rejectionData.timestamp || new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNewRequest = (data: unknown) => {
      const requestData = data as {
        message?: string;
        timestamp?: string;
      };
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "new_request",
        title: "New Request",
        message: requestData.message || "A new request has been received",
        timestamp: requestData.timestamp || new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    // Subscribe to all notification types
    onNotification(handleNotification);
    onTheftAlert(handleTheftAlert);
    onRequestApproved(handleRequestApproved);
    onRequestRejected(handleRequestRejected);
    onNewRequest(handleNewRequest);

    return () => {
      // Unsubscribe when component unmounts
      offNotification();
      offTheftAlert();
      offRequestApproved();
      offRequestRejected();
      offNewRequest();
    };
  }, [user]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "theft_alert":
        return "🚨";
      case "approval":
        return "✅";
      case "rejection":
        return "❌";
      case "new_request":
        return "📋";
      default:
        return "🔔";
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative",
          padding: "8px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              background: "#dc3545",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            right: "0",
            top: "100%",
            width: "350px",
            maxHeight: "400px",
            overflow: "auto",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 style={{ margin: 0 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #eee",
                  background: notification.read ? "white" : "#f8f9fa",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "20px" }}>
                  {getNotificationIcon(notification.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontWeight: notification.read ? "normal" : "bold",
                      fontSize: "14px",
                    }}
                  >
                    {notification.title}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    {notification.message}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#999" }}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
