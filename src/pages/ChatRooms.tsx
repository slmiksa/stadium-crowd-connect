
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Search, Plus, Users, Lock, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type ChatRoom = Tables<'chat_rooms'> & {
  profiles: Tables<'profiles'>;
  room_members: { user_id: string }[];
};

const ChatRooms = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          profiles:owner_id(id, username, avatar_url),
          room_members(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'فشل في تحميل الغرف' : 'Failed to load rooms',
          variant: 'destructive',
        });
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

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إدخال اسم الغرفة' : 'Please enter room name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          owner_id: user.id,
          name: newRoomName,
          description: newRoomDescription,
          is_private: newRoomPrivate,
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'فشل في إنشاء الغرفة' : 'Failed to create room',
          variant: 'destructive',
        });
        return;
      }

      // Add owner as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding owner as member:', memberError);
      }

      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomPrivate(false);
      setShowCreateModal(false);
      
      toast({
        title: isRTL ? 'تم' : 'Success',
        description: isRTL ? 'تم إنشاء الغرفة بنجاح' : 'Room created successfully',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
        });

      if (error) {
        console.error('Error joining room:', error);
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'فشل في الانضمام للغرفة' : 'Failed to join room',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: isRTL ? 'تم' : 'Success',
        description: isRTL ? 'تم الانضمام للغرفة بنجاح' : 'Joined room successfully',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
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
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('chatRooms')}</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
            </button>
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} className="text-white" />
              </button>
            )}
          </div>
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
          {filteredRooms.map((room) => {
            const isMember = user ? room.room_members.some(member => member.user_id === user.id) : false;
            
            return (
              <div key={room.id} className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {room.is_private ? (
                        <Lock size={16} className="text-yellow-400" />
                      ) : (
                        <Globe size={16} className="text-green-400" />
                      )}
                      <h3 className="font-semibold text-white">{room.name}</h3>
                    </div>
                    
                    {room.description && (
                      <p className="text-zinc-300 text-sm mb-2">{room.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-zinc-400">
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{room.members_count || 0}</span>
                        </div>
                        <span>{isRTL ? 'أنشئت في' : 'Created'} {formatTimestamp(room.created_at!)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-zinc-500">
                          {isRTL ? 'بواسطة' : 'by'} {room.profiles?.username}
                        </span>
                        {user && !isMember && (
                          <button
                            onClick={() => handleJoinRoom(room.id)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {isRTL ? 'انضم' : 'Join'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400">
              {searchQuery 
                ? (isRTL ? 'لم يتم العثور على غرف' : 'No rooms found')
                : (isRTL ? 'لا توجد غرف حالياً' : 'No rooms yet')
              }
            </p>
          </div>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-6">
                {isRTL ? 'إنشاء غرفة جديدة' : 'Create New Room'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-300 text-sm mb-2">
                    {isRTL ? 'اسم الغرفة' : 'Room Name'}
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder={isRTL ? 'أدخل اسم الغرفة' : 'Enter room name'}
                  />
                </div>
                
                <div>
                  <label className="block text-zinc-300 text-sm mb-2">
                    {isRTL ? 'الوصف (اختياري)' : 'Description (optional)'}
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder={isRTL ? 'أدخل وصف الغرفة' : 'Enter room description'}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newRoomPrivate}
                    onChange={(e) => setNewRoomPrivate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="private" className="text-zinc-300 text-sm">
                    {isRTL ? 'غرفة خاصة' : 'Private room'}
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isRTL ? 'إنشاء' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatRooms;
