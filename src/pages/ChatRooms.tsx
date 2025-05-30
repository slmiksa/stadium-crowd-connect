
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Users, Search, Plus, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatRoomWithDetails {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  members_count: number;
  created_at: string;
  avatar_url?: string;
  owner_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  room_members: Array<{
    user_id: string;
  }>;
}

const ChatRooms = () => {
  const { t, isRTL } = useLanguage();
  const { user, isInitialized } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized && user) {
      fetchRooms();
    } else if (isInitialized) {
      setIsLoading(false);
    }
  }, [user, isInitialized]);

  const fetchRooms = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          profiles:owner_id (
            id,
            username,
            avatar_url
          ),
          room_members (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRooms();
    setIsRefreshing(false);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-white">{t('chatRooms')}</h1>
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
            placeholder={isRTL ? 'البحث في الغرف...' : 'Search rooms...'}
            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Rooms List */}
        <div className="space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">
                {searchQuery 
                  ? (isRTL ? 'لم يتم العثور على غرف' : 'No rooms found')
                  : (isRTL ? 'لا توجد غرف حالياً' : 'No rooms yet')
                }
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div key={room.id} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  {/* Room Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {room.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-white truncate">{room.name}</h3>
                      {room.is_private && (
                        <Lock size={16} className="text-zinc-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    {room.description && (
                      <p className="text-sm text-zinc-400 truncate mb-1">
                        {room.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-zinc-500">
                        <span className="flex items-center space-x-1">
                          <Users size={12} />
                          <span>{room.members_count}</span>
                        </span>
                        <span>
                          {isRTL ? 'بواسطة' : 'by'} {room.profiles?.username || 'مستخدم مجهول'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatTimestamp(room.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <button className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
          <Plus size={24} className="text-white" />
        </button>
      </div>
    </Layout>
  );
};

export default ChatRooms;
