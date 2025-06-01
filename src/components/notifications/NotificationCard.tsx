
import React from 'react';
import { Bell, MessageSquare, Users, Heart, UserPlus, Plus, Key, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment' | 'chat_room' | 'room_invitation';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: NotificationData;
  post_content?: string;
  comment_content?: string;
}

interface NotificationCardProps {
  notification: Notification;
  currentUserId?: string;
  onMarkAsRead: (id: string) => void;
  onProfileClick: (notification: Notification, e: React.MouseEvent) => void;
  onPostClick: (notification: Notification, e: React.MouseEvent) => void;
  onRoomClick: (notification: Notification, e: React.MouseEvent) => void;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  currentUserId,
  onMarkAsRead,
  onProfileClick,
  onPostClick,
  onRoomClick,
  onNotificationClick
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart size={18} className="text-red-400" />;
      case 'comment':
      case 'follower_comment':
        return <MessageSquare size={18} className="text-blue-400" />;
      case 'follow':
        return <UserPlus size={18} className="text-green-400" />;
      case 'message':
        return <MessageSquare size={18} className="text-purple-400" />;
      case 'post':
        return <Plus size={18} className="text-yellow-400" />;
      case 'chat_room':
        return <Users size={18} className="text-cyan-400" />;
      case 'room_invitation':
        return <Users size={18} className="text-pink-400" />;
      default:
        return <Bell size={18} className="text-gray-400" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'like':
        return 'bg-red-500/20 border-red-500/30';
      case 'comment':
      case 'follower_comment':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'follow':
        return 'bg-green-500/20 border-green-500/30';
      case 'message':
        return 'bg-purple-500/20 border-purple-500/30';
      case 'post':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'chat_room':
        return 'bg-cyan-500/20 border-cyan-500/30';
      case 'room_invitation':
        return 'bg-pink-500/20 border-pink-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch (error) {
      return 'منذ قليل';
    }
  };

  const handleNotificationClick = () => {
    // تعليم التنبيه كمقروء أولاً
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    // للتنبيهات الخاصة بغرف الدردشة، استخدم onNotificationClick مباشرة
    // حيث أن onNotificationClick يحتوي على المنطق الصحيح للتنقل
    onNotificationClick(notification);
  };

  // Debug log to check notification data
  console.log('NotificationCard data:', {
    type: notification.type,
    data: notification.data,
    room_password: notification.data?.room_password,
    room_name: notification.data?.room_name,
    room_description: notification.data?.room_description
  });

  return (
    <div
      onClick={handleNotificationClick}
      className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-lg ${
        !notification.is_read 
          ? `${getNotificationColor()} shadow-md` 
          : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50'
      }`}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      )}

      <div className="flex items-start space-x-4 space-x-reverse">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          notification.type === 'like' ? 'bg-red-500/20' :
          notification.type === 'comment' || notification.type === 'follower_comment' ? 'bg-blue-500/20' :
          notification.type === 'follow' ? 'bg-green-500/20' :
          notification.type === 'message' ? 'bg-purple-500/20' :
          notification.type === 'post' ? 'bg-yellow-500/20' :
          notification.type === 'chat_room' ? 'bg-cyan-500/20' :
          notification.type === 'room_invitation' ? 'bg-pink-500/20' : 'bg-gray-500/20'
        }`}>
          {getNotificationIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold text-lg ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
              {notification.title}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimestamp(notification.created_at)}
            </span>
          </div>

          <p className={`text-sm mb-3 leading-relaxed ${!notification.is_read ? 'text-gray-200' : 'text-gray-400'}`}>
            {notification.message}
          </p>

          {/* Additional content based on notification type */}
          {(notification.type === 'comment' || notification.type === 'follower_comment') && notification.post_content && (
            <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">المنشور:</p>
              <p className="text-sm text-gray-300 line-clamp-2">{notification.post_content}</p>
              {notification.comment_content && (
                <>
                  <p className="text-xs text-gray-400 mb-1 mt-2">التعليق:</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{notification.comment_content}</p>
                </>
              )}
            </div>
          )}

          {(notification.type === 'like' || notification.type === 'post') && notification.post_content && (
            <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">المنشور:</p>
              <p className="text-sm text-gray-300 line-clamp-2">{notification.post_content}</p>
            </div>
          )}

          {notification.type === 'chat_room' && (
            <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">اسم الغرفة:</p>
              <p className="text-sm text-cyan-300 font-medium">{notification.data.room_name}</p>
              {notification.data.room_description && (
                <>
                  <p className="text-xs text-gray-400 mb-1 mt-2">الوصف:</p>
                  <p className="text-sm text-gray-300">{notification.data.room_description}</p>
                </>
              )}
            </div>
          )}

          {/* Room invitation special content - Enhanced with better display */}
          {notification.type === 'room_invitation' && (
            <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-lg p-4 mb-3 border border-pink-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-pink-400" />
                <p className="text-sm font-semibold text-pink-300">دعوة لغرفة خاصة</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">اسم الغرفة:</p>
                  <p className="text-lg text-pink-200 font-bold">{notification.data?.room_name || 'غير محدد'}</p>
                </div>
                
                {notification.data?.room_description && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">الوصف:</p>
                    <p className="text-sm text-gray-200">{notification.data.room_description}</p>
                  </div>
                )}
                
                {/* Password section - Always show for room invitations */}
                <div className="mt-4 p-3 bg-gray-800/70 rounded-lg border-2 border-yellow-400/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={16} className="text-yellow-400" />
                    <p className="text-sm text-yellow-300 font-bold">كلمة السر المطلوبة:</p>
                  </div>
                  <div className="bg-gray-900/80 rounded-md p-3 border border-yellow-300/30">
                    <p className="text-lg text-yellow-100 font-mono text-center select-all tracking-wider">
                      {notification.data?.room_password || 'غير متوفرة'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">انقر على كلمة السر لتحديدها ونسخها</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Profile button for most notification types */}
            {(notification.type === 'follow' || notification.type === 'like' || 
              notification.type === 'comment' || notification.type === 'follower_comment' || 
              notification.type === 'post' || notification.type === 'chat_room' || 
              notification.type === 'room_invitation') && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onProfileClick(notification, e)}
                className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto"
              >
                البروفايل
              </Button>
            )}

            {/* Post button for post-related notifications */}
            {(notification.type === 'like' || notification.type === 'comment' || 
              notification.type === 'follower_comment' || notification.type === 'post') && 
              notification.data?.post_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onPostClick(notification, e)}
                className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto"
              >
                المنشور
              </Button>
            )}

            {/* Room button for chat room notifications - Enhanced for invitations */}
            {(notification.type === 'chat_room' || notification.type === 'room_invitation') && notification.data?.room_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onRoomClick(notification, e)}
                className={`text-xs px-4 py-2 h-auto flex items-center gap-2 font-medium ${
                  notification.type === 'room_invitation' 
                    ? 'bg-pink-600/30 border-pink-400/50 text-pink-200 hover:bg-pink-600/50 hover:text-pink-100' 
                    : 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/30 hover:text-cyan-300'
                }`}
              >
                <LogIn size={16} />
                {notification.type === 'room_invitation' ? 'دخول الغرفة الآن' : 'الغرفة'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
