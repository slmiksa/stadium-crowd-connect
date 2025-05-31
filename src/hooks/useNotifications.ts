
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      console.log('Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      console.log('Fetched notifications:', data);

      // جلب تفاصيل المنشورات والتعليقات للتنبيهات
      const enrichedNotifications = await Promise.all(
        (data || []).map(async (notif) => {
          const notificationData = (notif.data as NotificationData) || {};
          
          const enrichedNotif: Notification = {
            id: notif.id,
            type: notif.type as 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment' | 'chat_room',
            title: notif.title,
            message: notif.message,
            is_read: notif.is_read ?? false,
            created_at: notif.created_at || '',
            data: notificationData
          };

          // إذا كان التنبيه عن تعليق، جلب تفاصيل المنشور والتعليق
          if ((notif.type === 'comment' || notif.type === 'follower_comment') && notificationData.post_id && notificationData.comment_id) {
            try {
              // جلب تفاصيل المنشور
              const { data: postData } = await supabase
                .from('hashtag_posts')
                .select('content')
                .eq('id', notificationData.post_id)
                .single();

              // جلب تفاصيل التعليق
              const { data: commentData } = await supabase
                .from('hashtag_comments')
                .select('content')
                .eq('id', notificationData.comment_id)
                .single();

              enrichedNotif.post_content = postData?.content;
              enrichedNotif.comment_content = commentData?.content;
            } catch (error) {
              console.error('Error fetching post/comment details:', error);
            }
          }

          // إذا كان التنبيه عن إعجاب أو منشور جديد، جلب تفاصيل المنشور
          if ((notif.type === 'like' || notif.type === 'post') && notificationData.post_id) {
            try {
              const { data: postData } = await supabase
                .from('hashtag_posts')
                .select('content')
                .eq('id', notificationData.post_id)
                .single();

              enrichedNotif.post_content = postData?.content;
            } catch (error) {
              console.error('Error fetching post details:', error);
            }
          }

          return enrichedNotif;
        })
      );

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, is_read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id);

      if (!error) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('New notification received, refreshing...');
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
};
