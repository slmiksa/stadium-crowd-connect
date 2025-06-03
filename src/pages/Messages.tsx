import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Search, MessageSquare, Bell, Users, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
interface ConversationProfile {
  id: string;
  username: string;
  avatar_url?: string;
}
interface Conversation {
  id: string;
  other_user: ConversationProfile;
  last_message: string;
  timestamp: string;
  unread: boolean;
}
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  data?: any;
}
const Messages = () => {
  const {
    t,
    isRTL
  } = useLanguage();
  const {
    user,
    isInitialized
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (isInitialized && user) {
      fetchConversations();
      fetchNotifications();

      // Subscribe to real-time updates for messages
      const messagesChannel = supabase.channel(`messages_realtime_${user.id}`).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_messages'
      }, payload => {
        console.log('Message update:', payload);
        // Safely check if the payload has the required properties and if it's for this user
        const newRecord = payload.new as any;
        if (newRecord && (newRecord.sender_id === user.id || newRecord.receiver_id === user.id)) {
          fetchConversations();
        }
      }).subscribe();

      // Subscribe to real-time updates for notifications
      const notificationsChannel = supabase.channel(`notifications_realtime_${user.id}`).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        console.log('Notification update:', payload);
        fetchNotifications();
      }).subscribe();
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(notificationsChannel);
      };
    } else if (isInitialized) {
      setIsLoading(false);
    }
  }, [user, isInitialized]);
  const fetchConversations = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const {
        data: messages,
        error
      } = await supabase.from('private_messages').select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey(id, username, avatar_url),
          receiver_profile:profiles!private_messages_receiver_id_fkey(id, username, avatar_url)
        `).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      messages?.forEach(message => {
        const otherUser = message.sender_id === user.id ? message.receiver_profile : message.sender_profile;
        if (!otherUser?.id) return;
        const conversationId = otherUser.id;
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            other_user: {
              id: otherUser.id,
              username: otherUser.username || 'مستخدم مجهول',
              avatar_url: otherUser.avatar_url || undefined
            },
            last_message: message.content,
            timestamp: message.created_at!,
            unread: !message.is_read && message.receiver_id === user.id
          });
        }
      });
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      console.log('Fetching notifications for user:', user.id);
      const {
        data,
        error
      } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      console.log('Fetched notifications:', data);

      // Apply the same text transformation logic as useNotifications.ts
      const transformedNotifications = (data || []).map(notif => ({
        ...notif,
        message: notif.type === 'room_invitation' ? 'تم دعوتكم لغرفة دردشة خاصة - للدخول من خلال بروفايلكم الخاص' : notif.message
      }));
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'notifications') {
      await fetchNotifications();
    } else {
      await fetchConversations();
    }
    setIsRefreshing(false);
  };
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const {
        error
      } = await supabase.from('notifications').update({
        is_read: true
      }).eq('id', notificationId);
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      setNotifications(prev => prev.map(notif => notif.id === notificationId ? {
        ...notif,
        is_read: true
      } : notif));
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('notifications').update({
        is_read: true
      }).eq('user_id', user.id).eq('is_read', false);
      if (error) {
        console.error('Error marking all notifications as read:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تعليم التنبيهات كمقروءة",
          variant: "destructive"
        });
        return;
      }
      setNotifications(prev => prev.map(notif => ({
        ...notif,
        is_read: true
      })));
      toast({
        title: "تم بنجاح",
        description: "تم تعليم جميع التنبيهات كمقروءة"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعليم التنبيهات كمقروءة",
        variant: "destructive"
      });
    }
  };
  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification.id);

    // Navigate based on notification type
    if (notification.type === 'comment' || notification.type === 'like') {
      // For comments and likes, go to the post
      if (notification.data?.post_id) {
        console.log('Navigating to post:', notification.data.post_id);
        navigate(`/post/${notification.data.post_id}`);
      } else {
        console.log('No post_id found, going to hashtags');
        navigate('/hashtags');
      }
    } else if (notification.type === 'follow') {
      // For follows, go to the follower's profile
      const userId = notification.data?.follower_id;
      if (userId) {
        console.log('Navigating to user profile:', userId);
        navigate(`/user-profile/${userId}`);
      } else {
        navigate('/hashtags');
      }
    } else if (notification.type === 'message') {
      // For messages, go to the sender's profile or messages
      if (notification.data?.sender_id) {
        navigate(`/private-chat/${notification.data.sender_id}`);
      } else {
        navigate('/messages');
      }
    } else {
      // Fallback to hashtags page if no specific navigation
      navigate('/hashtags');
    }
  };
  const handlePostNavigation = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation();
    await markNotificationAsRead(notification.id);
    if (notification.data?.post_id) {
      navigate(`/post/${notification.data.post_id}`);
    } else {
      navigate('/hashtags');
    }
  };
  const handleProfileNavigation = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation();
    await markNotificationAsRead(notification.id);
    
    let userId = null;
    
    if (notification.type === 'comment' && notification.data?.commenter_id) {
      userId = notification.data.commenter_id;
    } else if (notification.type === 'like' && notification.data?.liker_id) {
      userId = notification.data.liker_id;
    } else if (notification.type === 'follow' && notification.data?.follower_id) {
      userId = notification.data.follower_id;
    } else if (notification.type === 'message' && notification.data?.sender_id) {
      userId = notification.data.sender_id;
    } else if (notification.type === 'post' && notification.data?.author_id) {
      userId = notification.data.author_id;
    } else if (notification.type === 'chat_room' && notification.data?.creator_id) {
      userId = notification.data.creator_id;
    } else if (notification.type === 'room_invitation' && notification.data?.inviter_id) {
      userId = notification.data.inviter_id;
    }
    
    if (userId) {
      // التأكد من أنه ليس نفس المستخدم الحالي
      if (userId === user?.id) {
        navigate('/profile');
      } else {
        navigate(`/user-profile/${userId}`);
      }
    } else {
      navigate('/hashtags');
    }
  };
  const handleConversationClick = async (conversation: Conversation) => {
    // Mark messages as read when opening conversation
    try {
      await supabase.from('private_messages').update({
        is_read: true
      }).eq('sender_id', conversation.other_user.id).eq('receiver_id', user?.id).eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
    navigate(`/private-chat/${conversation.other_user.id}`);
  };
  const handleUserProfileClick = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/user-profile/${userId}`);
  };
  const filteredConversations = conversations.filter(conversation => conversation.other_user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNotifications = notifications.filter(notification => notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || notification.message.toLowerCase().includes(searchQuery.toLowerCase()));
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}د`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };
  const unreadConversationsCount = conversations.filter(c => c.unread).length;
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
  if (!isInitialized || isLoading) {
    return (
      <Layout>
        <div className="page-container flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="page-container">
        <div className="p-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('messages')}</h1>
              <p className="text-sm text-zinc-400">
                {activeTab === 'notifications' ? `${unreadNotificationsCount} تنبيهات غير مقروءة` : `${unreadConversationsCount} رسائل غير مقروءة`}
              </p>
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50">
              <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
            <button onClick={() => setActiveTab('notifications')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <Bell size={18} />
              <span>التنبيهات</span>
              {unreadNotificationsCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadNotificationsCount}
                </span>}
            </button>
            <button onClick={() => setActiveTab('messages')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${activeTab === 'messages' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <MessageSquare size={18} />
              <span>الرسائل</span>
              {unreadConversationsCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadConversationsCount}
                </span>}
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={activeTab === 'notifications' ? 'البحث في التنبيهات...' : 'البحث في الرسائل...'} className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>

          {/* Mark All as Read Button - Only show for notifications tab */}
          {activeTab === 'notifications' && unreadNotificationsCount > 0 && <div className="mb-4 w-full">
              <div className="flex justify-center">
                <Button onClick={handleMarkAllNotificationsAsRead} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg">
                  <CheckCheck size={20} />
                  <span className="font-medium">تعليم الكل كمقروء</span>
                </Button>
              </div>
            </div>}

          {/* Content */}
          <div className="space-y-2">
            {activeTab === 'notifications' ?
            // Notifications Tab
            filteredNotifications.length === 0 ? <div className="text-center py-8">
                    <Bell size={48} className="mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400">
                      {searchQuery ? 'لم يتم العثور على تنبيهات' : 'لا توجد تنبيهات حالياً'}
                    </p>
                  </div> : filteredNotifications.map(notification => <div key={notification.id} className={`p-4 rounded-lg transition-colors ${!notification.is_read ? 'bg-zinc-800 border-l-4 border-blue-500' : 'bg-zinc-800/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Notification Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'follow' ? 'bg-green-500' : notification.type === 'comment' ? 'bg-blue-500' : notification.type === 'like' ? 'bg-red-500' : notification.type === 'message' ? 'bg-purple-500' : notification.type === 'post' ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                      {notification.type === 'follow' ? <Users size={20} className="text-white" /> : notification.type === 'comment' ? <MessageSquare size={20} className="text-white" /> : <Bell size={20} className="text-white" />}
                    </div>
                    
                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${!notification.is_read ? 'text-white' : 'text-zinc-300'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                          {formatTimestamp(notification.created_at)}
                        </span>
                      </div>
                      <p className="my-0 px-0 py-0 mx-[37px] text-amber-300 text-xs font-medium">
                        {notification.message}
                      </p>
                      
                      {/* Action buttons for new post notifications */}
                      {notification.type === 'post' && <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={e => handleProfileNavigation(notification, e)} className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs px-3 py-1 h-auto">
                            الذهاب إلى البروفايل
                          </Button>
                          {notification.data?.post_id && <Button size="sm" variant="outline" onClick={e => handlePostNavigation(notification, e)} className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs px-3 py-1 h-auto">
                              الذهاب إلى المنشور
                            </Button>}
                        </div>}
                      
                      {/* Action buttons for comment and like notifications */}
                      {(notification.type === 'comment' || notification.type === 'like') && <div className="flex gap-2 mt-2">
                          <button onClick={e => handlePostNavigation(notification, e)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors">
                            المنشور
                          </button>
                          <button onClick={e => handleProfileNavigation(notification, e)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors">
                            البروفايل
                          </button>
                        </div>}
                      
                      {/* Single action for other notification types */}
                      {notification.type === 'follow' && <button onClick={e => handleProfileNavigation(notification, e)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full mt-2 transition-colors">
                          الذهاب إلى البروفايل
                        </button>}
                      
                      {notification.type === 'message' && <button onClick={e => handleNotificationClick(notification)} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full mt-2 transition-colors">
                          الذهاب إلى المحادثة
                        </button>}
                    </div>
                  </div>
                  
                  {/* Unread Indicator */}
                  {!notification.is_read && <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>}
                </div>
              </div>) :
            // Messages Tab
            filteredConversations.length === 0 ? <div className="text-center py-8">
                    <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400">
                      {searchQuery ? 'لم يتم العثور على رسائل' : 'لا توجد رسائل حالياً'}
                    </p>
                  </div> : filteredConversations.map(conversation => <div key={conversation.id} className={`p-4 rounded-lg transition-colors hover:bg-zinc-750 ${conversation.unread ? 'bg-zinc-800 border-l-4 border-blue-500' : 'bg-zinc-800/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Avatar - Clickable to profile */}
                    <div onClick={e => handleUserProfileClick(conversation.other_user.id, e)} className="cursor-pointer hover:scale-105 transition-transform" title="انقر للذهاب إلى البروفايل">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.other_user.avatar_url} alt={conversation.other_user.username} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                          {conversation.other_user.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* Message Content - Clickable to chat */}
                    <div onClick={() => handleConversationClick(conversation)} className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${conversation.unread ? 'text-white' : 'text-zinc-300'}`}>
                          {conversation.other_user.username || 'مستخدم مجهول'}
                        </h3>
                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                          {formatTimestamp(conversation.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conversation.unread ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {conversation.last_message}
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        انقر على الصورة للبروفايل • انقر هنا للمحادثة
                      </p>
                    </div>
                  </div>
                  
                  {/* Unread Indicator */}
                  {conversation.unread && <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>}
                </div>
              </div>)}
          </div>

          {/* Floating Action Button - Only show on messages tab */}
          {activeTab === 'messages' && (
            <button onClick={() => navigate('/chat-rooms')} className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
              <MessageSquare size={24} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
