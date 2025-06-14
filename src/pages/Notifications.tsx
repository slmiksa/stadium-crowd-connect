
import React from 'react';
import { CheckCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import NotificationsHeader from '@/components/notifications/NotificationsHeader';
import NotificationsList from '@/components/notifications/NotificationsList';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationHandlers } from '@/hooks/useNotificationHandlers';
import { useVerificationNotifications } from '@/hooks/useVerificationNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { handleProfileClick, handlePostClick, handleRoomClick, handleMessageClick, handleNotificationClick } = useNotificationHandlers(markAsRead);
  const { toast } = useToast();
  
  // تفعيل نظام الإشعارات الخارجية (Push Notifications)
  usePushNotifications();

  // تفعيل نظام إشعارات التوثيق
  useVerificationNotifications();

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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "تم بنجاح",
        description: "تم تعليم جميع التنبيهات كمقروءة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعليم التنبيهات كمقروءة",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="p-6">
          <NotificationsHeader
            hasUnreadNotifications={hasUnreadNotifications}
            onMarkAllAsRead={handleMarkAllAsRead}
          />

          {hasUnreadNotifications && (
            <div className="mb-6 w-full">
              <div className="flex justify-center">
                <Button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
                >
                  <CheckCheck size={20} />
                  <span className="font-medium">تعليم الكل كمقروء</span>
                </Button>
              </div>
            </div>
          )}

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
