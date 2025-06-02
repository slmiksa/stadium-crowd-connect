import React from 'react';
import { Bell, MessageSquare, Users, Heart, UserPlus, Plus, Key, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.type === 'room_invitation') {
      onNotificationClick({
        ...notification,
        type: 'profile_redirect' as any
      });
    } else {
      onNotificationClick(notification);
    }
  };

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
            {notification.type === 'room_invitation' 
              ? 'تم دعوتكم لغرفة دردشة خاصة - للدخول من خلال بروفايلكم الخاص'
              : notification.message
            }
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

          {/* Room invitation special content */}
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
                
                {/* Updated instruction to go to profile */}
                <div className="mt-4 p-3 bg-blue-800/70 rounded-lg border-2 border-blue-400/50">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-400" />
                    <p className="text-sm text-blue-300 font-bold">لانضمام للغرفة:</p>
                  </div>
                  <p className="text-sm text-blue-100 text-center">
                    اذهب إلى بروفايلك الخاص لرؤية تفاصيل الدعوة وكلمة المرور
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Message notifications - show both profile and chat buttons */}
            {notification.type === 'message' && (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onProfileClick(notification, e)}
                  className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto w-full"
                >
                  زيارة بروفايل المرسل
                </Button>
                
                {notification.data?.sender_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notification.is_read) {
                        onMarkAsRead(notification.id);
                      }
                      navigate(`/private-chat/${notification.data.sender_id}`);
                    }}
                    className="bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 text-xs px-3 py-1 h-auto w-full"
                  >
                    الذهاب إلى المحادثة
                  </Button>
                )}
              </div>
            )}

            {/* Comment notifications - show both profile and post buttons */}
            {(notification.type === 'comment' || notification.type === 'follower_comment') && (
              <div className="flex flex-col gap-2 w-full">
                {/* Profile button for commenter */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onProfileClick(notification, e)}
                  className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto w-full"
                >
                  زيارة بروفايل المعلق
                </Button>
                
                {/* Post button */}
                {notification.data?.post_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => onPostClick(notification, e)}
                    className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto w-full"
                  >
                    الذهاب لصفحة المنشور
                  </Button>
                )}
              </div>
            )}

            {/* Post notifications - existing buttons */}
            {notification.type === 'post' && (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onProfileClick(notification, e)}
                  className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto w-full"
                >
                  الذهاب إلى البروفايل
                </Button>
                {notification.data?.post_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => onPostClick(notification, e)}
                    className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto w-full"
                  >
                    الذهاب إلى المنشور
                  </Button>
                )}
              </div>
            )}

            {/* Other notification types - existing buttons */}
            {notification.type === 'follow' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => onProfileClick(notification, e)}
                className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto"
              >
                البروفايل
              </Button>
            )}

            {notification.type === 'like' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onProfileClick(notification, e)}
                  className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto"
                >
                  البروفايل
                </Button>
                {notification.data?.post_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => onPostClick(notification, e)}
                    className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto"
                  >
                    المنشور
                  </Button>
                )}
              </>
            )}

            {notification.type === 'chat_room' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onProfileClick(notification, e)}
                  className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto"
                >
                  البروفايل
                </Button>
                {notification.data?.room_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => onRoomClick(notification, e)}
                    className="bg-cyan-600/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/30 hover:text-cyan-300 text-xs px-4 py-2 h-auto flex items-center gap-2 font-medium"
                  >
                    <LogIn size={16} />
                    الغرفة
                  </Button>
                )}
              </>
            )}

            {notification.type === 'room_invitation' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!notification.is_read) {
                    onMarkAsRead(notification.id);
                  }
                  navigate('/profile');
                }}
                className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto"
              >
                اذهب للبروفايل
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
