
import React from 'react';
import Layout from '@/components/Layout';
import NotificationsHeader from '@/components/notifications/NotificationsHeader';
import NotificationsList from '@/components/notifications/NotificationsList';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationHandlers } from '@/hooks/useNotificationHandlers';
import { useAuth } from '@/contexts/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { handleProfileClick, handlePostClick, handleRoomClick, handleNotificationClick } = useNotificationHandlers(markAsRead);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const hasUnreadNotifications = notifications.some(n => !n.is_read);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="p-6">
          <NotificationsHeader
            hasUnreadNotifications={hasUnreadNotifications}
            onMarkAllAsRead={markAllAsRead}
          />

          <NotificationsList
            notifications={notifications}
            currentUserId={user?.id}
            onMarkAsRead={markAsRead}
            onProfileClick={handleProfileClick}
            onPostClick={handlePostClick}
            onRoomClick={handleRoomClick}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
