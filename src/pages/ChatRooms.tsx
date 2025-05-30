
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { MessageSquare, Users, Lock, Globe, Plus } from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberCount: number;
  owner: string;
  lastMessage?: string;
  lastActivity: string;
  topic: string;
}

const ChatRooms = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const mockRooms: ChatRoom[] = [
    {
      id: '1',
      name: 'الكلاسيكو العربي',
      description: 'نقاش حول مباراة الريال وبرشلونة',
      isPrivate: false,
      memberCount: 234,
      owner: 'أحمد_الريال',
      lastMessage: 'ما رأيكم في الهدف الأول؟',
      lastActivity: '2024-05-30T20:45:00Z',
      topic: 'Real Madrid vs Barcelona'
    },
    {
      id: '2',
      name: 'Premier League Fans',
      description: 'Discussion about Premier League matches',
      isPrivate: false,
      memberCount: 156,
      owner: 'ManU_Fan',
      lastMessage: 'Liverpool looking strong this season!',
      lastActivity: '2024-05-30T19:30:00Z',
      topic: 'Premier League'
    },
    {
      id: '3',
      name: 'مشجعي الأهلي',
      description: 'غرفة خاصة لمشجعي النادي الأهلي',
      isPrivate: true,
      memberCount: 45,
      owner: 'الأهلاوي_الأصيل',
      lastMessage: 'متى المباراة القادمة؟',
      lastActivity: '2024-05-30T18:15:00Z',
      topic: 'Al Ahly FC'
    }
  ];

  useEffect(() => {
    setRooms(mockRooms);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRooms([...mockRooms]);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: newRoomName,
      description: newRoomDescription,
      isPrivate: newRoomPrivate,
      memberCount: 1,
      owner: user?.username || 'Unknown',
      lastActivity: new Date().toISOString(),
      topic: 'General'
    };

    setRooms([newRoom, ...rooms]);
    setNewRoomName('');
    setNewRoomDescription('');
    setNewRoomPrivate(false);
    setShowCreateRoom(false);
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

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
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">
                {isRTL ? 'إنشاء غرفة جديدة' : 'Create New Room'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {isRTL ? 'اسم الغرفة' : 'Room Name'}
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    placeholder={isRTL ? 'أدخل اسم الغرفة' : 'Enter room name'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {isRTL ? 'الوصف (اختياري)' : 'Description (Optional)'}
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder={isRTL ? 'أدخل وصف الغرفة' : 'Enter room description'}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newRoomPrivate}
                    onChange={(e) => setNewRoomPrivate(e.target.checked)}
                    className="mr-2 w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="private" className="text-zinc-300">
                    {isRTL ? 'غرفة خاصة' : 'Private Room'}
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 py-2 px-4 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim()}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? 'إنشاء' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rooms List */}
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center space-x-2">
                      {room.isPrivate ? (
                        <Lock size={16} className="text-orange-400" />
                      ) : (
                        <Globe size={16} className="text-green-400" />
                      )}
                      <h3 className="font-semibold text-white">{room.name}</h3>
                    </div>
                  </div>
                  
                  {room.description && (
                    <p className="text-zinc-400 text-sm mb-2">{room.description}</p>
                  )}
                  
                  {room.lastMessage && (
                    <p className="text-zinc-300 text-sm mb-2">"{room.lastMessage}"</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users size={12} />
                        <span>{room.memberCount}</span>
                      </div>
                      <span>{isRTL ? 'المدير:' : 'Owner:'} {room.owner}</span>
                    </div>
                    <span>{formatLastActivity(room.lastActivity)}</span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <MessageSquare size={20} className="text-zinc-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 mb-4">
              {isRTL ? 'لا توجد غرف دردشة حالياً' : 'No chat rooms yet'}
            </p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isRTL ? 'أنشئ غرفة جديدة' : 'Create First Room'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatRooms;
