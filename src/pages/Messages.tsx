
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Search, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

const Messages = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const mockMessages: Message[] = [
    {
      id: '1',
      sender: 'أحمد_الريال',
      lastMessage: 'شفت المباراة امبارح؟ كانت رائعة!',
      timestamp: '2024-05-30T20:15:00Z',
      unread: true
    },
    {
      id: '2',
      sender: 'ليفربول_فان',
      lastMessage: 'Great match prediction! How did you know?',
      timestamp: '2024-05-30T18:30:00Z',
      unread: false
    },
    {
      id: '3',
      sender: 'مشجع_الأهلي',
      lastMessage: 'هل ستحضر المباراة القادمة؟',
      timestamp: '2024-05-30T16:45:00Z',
      unread: false
    },
    {
      id: '4',
      sender: 'Chelsea_Blue',
      lastMessage: 'Thanks for the invite to the chat room!',
      timestamp: '2024-05-30T14:20:00Z',
      unread: false
    }
  ];

  useEffect(() => {
    setMessages(mockMessages);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMessages([...mockMessages]);
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredMessages = messages.filter(message =>
    message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
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

  const unreadCount = messages.filter(m => m.unread).length;

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
          {filteredMessages.length === 0 ? (
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
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors hover:bg-zinc-750 ${
                  message.unread ? 'bg-zinc-800 border-l-4 border-blue-500' : 'bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {message.sender.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${message.unread ? 'text-white' : 'text-zinc-300'}`}>
                          {message.sender}
                        </h3>
                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${message.unread ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {message.lastMessage}
                      </p>
                    </div>
                  </div>
                  
                  {/* Unread Indicator */}
                  {message.unread && (
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
