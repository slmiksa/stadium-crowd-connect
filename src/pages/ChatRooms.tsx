
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Users, Search, Plus, Lock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

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
  const navigate = useNavigate();
  const { toast } = useToast();
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
        toast({
          title: "خطأ في جلب الغرف",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "حدث خطأ غير متوقع",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRooms();
    setIsRefreshing(false);
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (!existingMember) {
        // Add user as member
        const { error } = await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            user_id: user.id,
            role: 'member'
          });

        if (error) {
          console.error('Error joining room:', error);
          toast({
            title: "خطأ في الانضمام للغرفة",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "تم الانضمام بنجاح",
          description: "مرحباً بك في الغرفة"
        });
      }

      // Navigate to the room
      navigate(`/chat-room/${roomId}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "حدث خطأ غير متوقع",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
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
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  if (!isInitialized || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="p-6 flex items-center justify-center min-h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">غرف الدردشة</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50 border border-gray-700/50"
            >
              <RefreshCw size={20} className={`text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في الغرف..."
              className="w-full pr-12 pl-6 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-200"
            />
          </div>

          {/* Rooms List */}
          <div className="space-y-4">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/30">
                  <Users size={64} className="mx-auto text-gray-600 mb-6" />
                  <p className="text-xl text-gray-400">
                    {searchQuery 
                      ? 'لم يتم العثور على غرف'
                      : 'البرمجة هي المستقبل'
                    }
                  </p>
                  {!searchQuery && (
                    <p className="text-gray-500 mt-2">نتشرف بكم جميعاً</p>
                  )}
                </div>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <div 
                  key={room.id} 
                  onClick={() => joinRoom(room.id)}
                  className="group bg-gray-800/40 backdrop-blur-sm rounded-3xl p-6 hover:bg-gray-800/60 transition-all duration-300 cursor-pointer border border-gray-700/30 hover:border-gray-600/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-bold text-xl text-white group-hover:text-blue-300 transition-colors">
                          {room.name}
                        </h3>
                        {room.is_private && (
                          <Lock size={18} className="text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      {room.description && (
                        <p className="text-gray-400 group-hover:text-gray-300 mb-4 leading-relaxed">
                          {room.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-1">
                            <Users size={14} />
                            <span className="text-gray-300">{room.members_count}</span>
                          </span>
                          <span className="text-gray-400">
                            بواسطة {room.profiles?.username || 'مستخدم مجهول'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-700/30 rounded-lg px-3 py-1">
                          {formatTimestamp(room.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Room Avatar */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden mr-6 group-hover:scale-110 transition-transform duration-300">
                      {room.avatar_url ? (
                        <img 
                          src={room.avatar_url} 
                          alt={room.name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/80 to-purple-600/80 rounded-2xl flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {room.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Floating Action Button */}
          <button 
            onClick={() => navigate('/create-chat-room')}
            className="fixed bottom-28 left-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/25 hover:scale-110 transition-all duration-300 border border-blue-400/30"
          >
            <Plus size={28} className="text-white" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ChatRooms;
