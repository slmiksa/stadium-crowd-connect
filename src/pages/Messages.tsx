
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Search, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const Messages = () => {
  const { t, isRTL } = useLanguage();
  const { user, isInitialized } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitialized && user) {
      fetchConversations();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('private_messages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'private_messages'
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey(id, username, avatar_url),
          receiver_profile:profiles!private_messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach((message) => {
        const otherUser = message.sender_id === user.id 
          ? message.receiver_profile 
          : message.sender_profile;
        
        if (!otherUser?.id) return;
        
        const conversationId = otherUser.id;
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            other_user: {
              id: otherUser.id,
              username: otherUser.username || 'مستخدم مجهول',
              avatar_url: otherUser.avatar_url || undefined,
            },
            last_message: message.content,
            timestamp: message.created_at!,
            unread: !message.is_read && message.receiver_id === user.id,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.other_user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const unreadCount = conversations.filter(c => c.unread).length;

  if (!isInitialized || isLoading) {
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
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('messages')}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-zinc-400">
                {isRTL ? `${unreadCount} رسائل غير مقروءة` : `${unreadCount} unread messages`}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'البحث في الرسائل...' : 'Search messages...'}
            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Messages List */}
        <div className="space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">
                {searchQuery 
                  ? (isRTL ? 'لم يتم العثور على رسائل' : 'No messages found')
                  : (isRTL ? 'لا توجد رسائل حالياً' : 'No messages yet')
                }
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors hover:bg-zinc-750 ${
                  conversation.unread ? 'bg-zinc-800 border-l-4 border-blue-500' : 'bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {conversation.other_user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
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
                    </div>
                  </div>
                  
                  {/* Unread Indicator */}
                  {conversation.unread && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <button className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
          <MessageSquare size={24} className="text-white" />
        </button>
      </div>
    </Layout>
  );
};

export default Messages;
