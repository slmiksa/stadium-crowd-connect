
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

export const useNotificationHandlers = (markAsRead: (id: string) => void) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProfileClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    let userId;
    if (notification.type === 'follow') {
      userId = notification.data?.follower_id;
    } else if (notification.type === 'like') {
      userId = notification.data?.liker_id;
    } else if (notification.type === 'comment' || notification.type === 'follower_comment') {
      userId = notification.data?.commenter_id;
    } else if (notification.type === 'post') {
      userId = notification.data?.author_id;
    } else if (notification.type === 'chat_room') {
      userId = notification.data?.creator_id;
    } else if (notification.type === 'room_invitation') {
      userId = notification.data?.inviter_id;
    }

    if (userId) {
      if (userId === user?.id) {
        navigate('/profile');
      } else {
        navigate(`/user-profile/${userId}`);
      }
    }
  };

  const handlePostClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.data?.post_id) {
      navigate(`/post/${notification.data.post_id}`);
    }
  };

  const handleRoomClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.data?.room_id) {
      navigate(`/chat-room/${notification.data.room_id}`);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('Notification clicked:', notification);
    console.log('Notification type:', notification.type);
    console.log('Notification data:', notification.data);

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // الذهاب إلى المنشور للتعليقات والإعجابات والمنشورات الجديدة
    if (notification.type === 'comment' || notification.type === 'like' || notification.type === 'post' || notification.type === 'follower_comment') {
      if (notification.data?.post_id) {
        console.log('Navigating to post:', notification.data.post_id);
        navigate(`/post/${notification.data.post_id}`);
      } else {
        console.log('No post_id found, going to hashtags');
        navigate('/hashtags');
      }
    } else if (notification.type === 'follow') {
      const userId = notification.data?.follower_id;
      if (userId) {
        console.log('Navigating to user profile:', userId);
        navigate(`/user-profile/${userId}`);
      } else {
        navigate('/hashtags');
      }
    } else if (notification.type === 'message') {
      console.log('Navigating to messages');
      navigate('/messages');
    } else if (notification.type === 'chat_room') {
      if (notification.data?.room_id) {
        console.log('Navigating to chat room:', notification.data.room_id);
        navigate(`/chat-room/${notification.data.room_id}`);
      } else {
        console.log('No room_id found, going to chat rooms');
        navigate('/chat-rooms');
      }
    } else if (notification.type === 'room_invitation') {
      if (notification.data?.room_id) {
        console.log('Navigating to chat room from invitation:', notification.data.room_id);
        navigate(`/chat-room/${notification.data.room_id}`);
      } else {
        console.log('No room_id found, going to chat rooms');
        navigate('/chat-rooms');
      }
    } else {
      console.log('Fallback navigation to hashtags');
      navigate('/hashtags');
    }
  };

  return {
    handleProfileClick,
    handlePostClick,
    handleRoomClick,
    handleNotificationClick
  };
};
