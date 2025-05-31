
import React from 'react';
import { User, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimestamp, truncateText } from '@/utils/notificationUtils';
import { getNotificationIcon } from '@/utils/notificationIcons';

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
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment' | 'chat_room';
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
  return (
    <div
      onClick={() => onNotificationClick(notification)}
      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 cursor-pointer hover:bg-gray-700/50 ${
        notification.is_read 
          ? 'border-gray-700/50' 
          : 'border-blue-500/50 bg-blue-950/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-medium text-sm">
              {notification.title}
            </h3>
            <span className="text-xs text-gray-400">
              {formatTimestamp(notification.created_at)}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed mb-2">
            {notification.message}
          </p>

          {/* عرض تفاصيل المنشور إذا كان متوفر */}
          {notification.post_content && (
            <div className="bg-gray-900/50 rounded-lg p-3 mb-2 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">المنشور:</p>
              <p className="text-gray-300 text-sm">
                {truncateText(notification.post_content)}
              </p>
            </div>
          )}

          {/* عرض تفاصيل التعليق إذا كان متوفر */}
          {notification.comment_content && (
            <div className="bg-blue-900/30 rounded-lg p-3 mb-2 border border-blue-700/30">
              <p className="text-xs text-blue-400 mb-1">التعليق:</p>
              <p className="text-gray-300 text-sm">
                {truncateText(notification.comment_content)}
              </p>
            </div>
          )}

          {/* عرض تفاصيل غرفة الدردشة */}
          {notification.type === 'chat_room' && (
            <div className="bg-orange-900/30 rounded-lg p-3 mb-3 border border-orange-700/30">
              <p className="text-xs text-orange-400 mb-1">غرفة الدردشة:</p>
              <p className="text-white font-medium text-sm mb-1">
                {notification.data?.room_name}
              </p>
              {notification.data?.room_description && (
                <p className="text-gray-300 text-xs mb-2">
                  {truncateText(notification.data.room_description, 80)}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  notification.data?.room_is_private 
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                    : 'bg-green-600/20 text-green-400 border border-green-500/30'
                }`}>
                  {notification.data?.room_is_private ? 'خاصة' : 'عامة'}
                </span>
              </div>
            </div>
          )}

          {/* أزرار التفاعل */}
          <div className="flex items-center gap-2 mt-3">
            {/* زر البروفايل لجميع أنواع التنبيهات */}
            {(notification.type === 'follow' || notification.type === 'like' || 
              notification.type === 'comment' || notification.type === 'follower_comment' ||
              notification.type === 'post' || notification.type === 'chat_room') && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onProfileClick(notification, e)}
                className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto"
              >
                <User size={14} className="ml-1" />
                البروفايل
              </Button>
            )}

            {/* زر المنشور للتنبيهات المتعلقة بالمنشورات */}
            {(notification.type === 'like' || notification.type === 'comment' || 
              notification.type === 'follower_comment' || notification.type === 'post') && 
              notification.data?.post_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onPostClick(notification, e)}
                className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto"
              >
                <FileText size={14} className="ml-1" />
                المنشور
              </Button>
            )}

            {/* زر دخول الغرفة لتنبيهات غرف الدردشة */}
            {notification.type === 'chat_room' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onRoomClick(notification, e)}
                className="bg-orange-600/20 border-orange-500/30 text-orange-400 hover:bg-orange-600/30 hover:text-orange-300 text-xs px-3 py-1 h-auto"
              >
                <MessageSquare size={14} className="ml-1" />
                دخول الغرفة
              </Button>
            )}
          </div>
          
          {!notification.is_read && (
            <div className="mt-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
