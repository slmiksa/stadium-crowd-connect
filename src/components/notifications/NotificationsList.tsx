
import React from 'react';
import { Bell } from 'lucide-react';
import NotificationCard from './NotificationCard';

interface NotificationData {
  post_id?: string;
  comment_id?: string;
  follower_id?: string;
  sender_id?: string;
  message_id?: string;
  like_id?: string;
  liker_id?: string;
  commenter_id?: string;
  author_id?: string;
  room_id?: string;
  room_name?: string;
  room_description?: string;
  room_is_private?: boolean;
  creator_id?: string;
  avatar_url?: string;
  invitation_id?: string;
  inviter_id?: string;
  room_password?: string;
  sharer_id?: string;
  share_type?: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment' | 'chat_room' | 'room_invitation' | 'post_share';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: NotificationData;
  post_content?: string;
  comment_content?: string;
}

interface NotificationsListProps {
  notifications: Notification[];
  currentUserId?: string;
  onMarkAsRead: (id: string) => void;
  onProfileClick: (notification: Notification, e: React.MouseEvent) => void;
  onPostClick: (notification: Notification, e: React.MouseEvent) => void;
  onRoomClick: (notification: Notification, e: React.MouseEvent) => void;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  currentUserId,
  onMarkAsRead,
  onProfileClick,
  onPostClick,
  onRoomClick,
  onNotificationClick
}) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">لا توجد تنبيهات</p>
        <p className="text-gray-500 text-sm">ستظهر التنبيهات هنا عند وصولها</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          currentUserId={currentUserId}
          onMarkAsRead={onMarkAsRead}
          onProfileClick={onProfileClick}
          onPostClick={onPostClick}
          onRoomClick={onRoomClick}
          onNotificationClick={onNotificationClick}
        />
      ))}
    </div>
  );
};

export default NotificationsList;
