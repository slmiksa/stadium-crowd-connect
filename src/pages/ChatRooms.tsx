
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Users, Lock, Unlock, Plus, Share } from 'lucide-react';
import RoomShareModal from '@/components/RoomShareModal';

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  members_count: number;
  avatar_url?: string;
  password?: string;
  owner_id: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

const ChatRooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      console.log('📋 جاري جلب غرف الدردشة...');
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          profiles:owner_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في جلب الغرف:', error);
        throw error;
      }

      console.log('✅ تم جلب الغرف بنجاح:', data?.length || 0);
      setRooms(data || []);
    } catch (error) {
      console.error('💥 خطأ في fetchRooms:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب غرف الدردشة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (room: ChatRoom) => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للانضمام للغرفة",
        variant: "destructive"
      });
      return;
    }

    setJoiningRoom(room.id);

    try {
      console.log('🚪 محاولة الدخول للغرفة:', room.id);
      
      // إذا كان صاحب الغرفة، ادخل مباشرة
      if (room.owner_id === user.id) {
        console.log('👑 المستخدم هو صاحب الغرفة');
        navigate(`/chat-room/${room.id}`);
        return;
      }

      // تحقق من العضوية
      const { data: memberData } = await supabase
        .from('room_members')
        .select('id, is_banned')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      // إذا كان عضو ولم يتم حظره
      if (memberData && !memberData.is_banned) {
        console.log('✅ المستخدم عضو في الغرفة');
        navigate(`/chat-room/${room.id}`);
        return;
      }

      // إذا كانت الغرفة عامة، انضم تلقائياً
      if (!room.is_private) {
        console.log('🌐 الغرفة عامة - انضمام تلقائي');
        
        const { error: joinError } = await supabase
          .from('room_members')
          .insert({
            room_id: room.id,
            user_id: user.id,
            role: 'member'
          });

        if (joinError && joinError.code !== '23505') {
          console.error('❌ خطأ في الانضمام:', joinError);
          toast({
            title: "خطأ",
            description: "فشل في الانضمام للغرفة",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ تم الانضمام للغرفة بنجاح');
        toast({
          title: "تم الانضمام",
          description: "تم الانضمام للغرفة بنجاح"
        });
      }

      // الانتقال للغرفة
      navigate(`/chat-room/${room.id}`);
      
    } catch (error) {
      console.error('💥 خطأ في الدخول للغرفة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الدخول للغرفة",
        variant: "destructive"
      });
    } finally {
      setJoiningRoom(null);
    }
  };

  const handleShareRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setShareModalOpen(true);
  };

  const handleCreateRoom = () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لإنشاء غرفة دردشة",
        variant: "destructive"
      });
      return;
    }
    navigate('/create-chat-room');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <MessageSquare size={24} className="text-blue-400" />
            <h1 className="text-2xl font-bold text-white">غرف الدردشة</h1>
          </div>
          <Button
            onClick={handleCreateRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="ml-2" />
            إنشاء غرفة
          </Button>
        </div>

        {/* Rooms Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300"
            >
              {/* Room Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                    {room.avatar_url ? (
                      <img 
                        src={room.avatar_url} 
                        alt={room.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <MessageSquare size={24} className="text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      بواسطة {room.profiles?.username || 'مجهول'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {room.is_private ? (
                    <Lock size={16} className="text-red-400" />
                  ) : (
                    <Unlock size={16} className="text-green-400" />
                  )}
                  <button
                    onClick={() => handleShareRoom(room)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Share size={16} />
                  </button>
                </div>
              </div>

              {/* Room Description */}
              {room.description && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {room.description}
                </p>
              )}

              {/* Room Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-gray-400 text-sm">
                    {room.members_count} عضو
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  room.is_private 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {room.is_private ? 'خاصة' : 'عامة'}
                </span>
              </div>

              {/* Join Button */}
              <Button
                onClick={() => handleJoinRoom(room)}
                disabled={joiningRoom === room.id}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {joiningRoom === room.id ? 'جاري الدخول...' : 'دخول الغرفة'}
              </Button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {rooms.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">لا توجد غرف دردشة</h2>
            <p className="text-gray-400 mb-6">كن أول من ينشئ غرفة دردشة!</p>
            <Button
              onClick={handleCreateRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={20} className="ml-2" />
              إنشاء أول غرفة
            </Button>
          </div>
        )}

        {/* Share Modal */}
        {selectedRoom && (
          <RoomShareModal
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setSelectedRoom(null);
            }}
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
            roomDescription={selectedRoom.description}
            isPrivate={selectedRoom.is_private}
            password={selectedRoom.password}
          />
        )}
      </div>
    </Layout>
  );
};

export default ChatRooms;
