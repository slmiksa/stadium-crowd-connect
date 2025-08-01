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
  room_password?: string;
  creator_id?: string;
  avatar_url?: string;
  invitation_id?: string;
  inviter_id?: string;
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

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processedNotificationIds, setProcessedNotificationIds] = useState<Set<string>>(new Set());

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

      const uniqueNotifications = (data || []).filter((notif, index, array) => {
        const key = `${notif.type}-${JSON.stringify(notif.data)}-${notif.user_id}`;
        return array.findIndex(n => `${n.type}-${JSON.stringify(n.data)}-${n.user_id}` === key) === index;
      });

      const chatRoomNotifications = uniqueNotifications.filter(notif => 
        notif.type === 'chat_room' && !notif.is_read
      );

      if (chatRoomNotifications.length > 0) {
        const chatRoomIds = chatRoomNotifications.map(notif => notif.id);
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', chatRoomIds);
        
        if (!updateError) {
          console.log('Auto-marked chat room notifications as read in database:', chatRoomIds);
        }
      }

      const enrichedNotifications = await Promise.all(
        uniqueNotifications.map(async (notif) => {
          const notificationData = (notif.data as NotificationData) || {};
          
          const enrichedNotif: Notification = {
            id: notif.id,
            type: notif.type as 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment' | 'chat_room' | 'room_invitation' | 'post_share',
            title: notif.title,
            message: notif.type === 'room_invitation' ? 'تم دعوتكم لغرفة دردشة خاصة - للدخول من خلال بروفايلكم الخاص' : notif.message,
            is_read: notif.type === 'chat_room' ? true : (notif.is_read ?? false),
            created_at: notif.created_at || '',
            data: notificationData
          };

          if ((notif.type === 'comment' || notif.type === 'follower_comment') && notificationData.post_id && notificationData.comment_id) {
            try {
              const { data: postData } = await supabase
                .from('hashtag_posts')
                .select('content')
                .eq('id', notificationData.post_id)
                .single();

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

          if ((notif.type === 'like' || notif.type === 'post' || notif.type === 'post_share') && notificationData.post_id) {
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

  const acceptRoomInvitation = async (invitationId: string, roomId: string) => {
    try {
      const { error: invitationError } = await supabase
        .from('room_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (invitationError) {
        console.error('Error accepting invitation:', invitationError);
        return false;
      }

      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: user!.id,
          role: 'member'
        });

      if (memberError) {
        console.error('Error adding to room members:', memberError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
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
          (payload) => {
            console.log('New notification received:', payload);
            const newNotificationId = payload.new?.id;
            
            if (newNotificationId && !processedNotificationIds.has(newNotificationId)) {
              setProcessedNotificationIds(prev => new Set([...prev, newNotificationId]));
              setTimeout(() => {
                fetchNotifications();
              }, 500);
            }
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
    fetchNotifications,
    acceptRoomInvitation
  };
};
