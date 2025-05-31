import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft, Bell, Heart, MessageCircle, User, CheckCheck, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: NotificationData;
  post_content?: string;
  comment_content?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

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
            type: notif.type as 'like' | 'comment' | 'follow' | 'message' | 'post' | 'follower_comment',
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-400" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-400" />;
      case 'follow':
        return <User size={20} className="text-green-400" />;
      case 'message':
        return <Bell size={20} className="text-purple-400" />;
      case 'post':
        return <FileText size={20} className="text-yellow-400" />;
      case 'follower_comment':
        return <Users size={20} className="text-cyan-400" />;
      default:
        return <Bell size={20} className="text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
    } else {
      console.log('Fallback navigation to hashtags');
      navigate('/hashtags');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/hashtags')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  التنبيهات
                </h1>
                <p className="text-gray-400 text-sm mt-1">آخر الإشعارات والتحديثات</p>
              </div>
            </div>
            
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <CheckCheck size={16} />
                <span className="text-sm">قراءة الكل</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">لا توجد تنبيهات</p>
                <p className="text-gray-500 text-sm">ستظهر التنبيهات هنا عند وصولها</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
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
                      
                      {!notification.is_read && (
                        <div className="mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
