import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Hash, Users, Bell, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    t,
    isRTL
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const tabs = [{
    id: 'matches',
    path: '/matches',
    icon: Users,
    label: t('matches')
  }, {
    id: 'hashtags',
    path: '/hashtags',
    icon: Hash,
    label: t('hashtags')
  }, {
    id: 'chat-rooms',
    path: '/chat-rooms',
    icon: MessageSquare,
    label: t('chatRooms')
  }, {
    id: 'messages',
    path: '/messages',
    icon: Bell,
    label: 'تنبيهاتي'
  }, {
    id: 'profile',
    path: '/profile',
    icon: User,
    label: t('profile')
  }];
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      // Get unread notifications count
      const {
        data: notifications,
        error: notifError
      } = await supabase.from('notifications').select('id').eq('user_id', user.id).eq('is_read', false);

      // Get unread messages count
      const {
        data: messages,
        error: msgError
      } = await supabase.from('private_messages').select('id').eq('receiver_id', user.id).eq('is_read', false);
      if (notifError || msgError) {
        console.error('Error fetching unread counts:', notifError || msgError);
        return;
      }
      const totalUnread = (notifications?.length || 0) + (messages?.length || 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      // Subscribe to real-time updates for notifications
      const notificationsChannel = supabase.channel('notifications_realtime').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      }).subscribe();

      // Subscribe to real-time updates for private messages
      const messagesChannel = supabase.channel('messages_realtime').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      }).subscribe();
      return () => {
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user]);
  return <nav style={{
    paddingBottom: 'env(safe-area-inset-bottom)'
  }} className="fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-md border-t border-zinc-800/30 bg-inherit">
      <div className="flex justify-around items-end w-full max-w-lg mx-auto h-16 bg-transparent pb-2">
        {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        const isMessagesTab = tab.id === 'messages';
        return <button key={tab.id} onClick={() => navigate(tab.path)} className={`relative flex flex-col items-center justify-center h-full px-3 py-2 rounded-lg transition-colors ${isActive ? 'text-blue-400 bg-blue-950/30' : 'text-zinc-400 hover:text-zinc-300'}`}>
              <div className="relative">
                <Icon size={24} />
                {isMessagesTab && unreadCount > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>}
              </div>
              <span className="text-xs mt-1 font-medium text-slate-50">
                {tab.label}
              </span>
            </button>;
      })}
      </div>
    </nav>;
};
export default BottomNavigation;