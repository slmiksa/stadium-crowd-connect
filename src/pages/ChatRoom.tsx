
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  members_count: number;
  owner_id: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (roomId && user) {
      fetchRoomData();
      checkMembership();
    }
  }, [roomId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRoomData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        navigate('/chat-rooms');
        return;
      }

      setRoom(roomData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkMembership = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user?.id)
        .single();

      setIsMember(!!data);
      
      if (data) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const joinRoom = async () => {
    if (!user || !room) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'member'
        });

      if (error) {
        console.error('Error joining room:', error);
        return;
      }

      setIsMember(true);
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('room_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">الغرفة غير موجودة</p>
          <Button onClick={() => navigate('/chat-rooms')} className="mt-4">
            العودة للغرف
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/chat-rooms')}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{room.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-zinc-400">
                <Users size={16} />
                <span>{room.members_count} عضو</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isMember ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">{room.name}</h2>
            {room.description && (
              <p className="text-zinc-400 mb-4">{room.description}</p>
            )}
            <Button onClick={joinRoom} className="bg-blue-500 hover:bg-blue-600">
              انضم للغرفة
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400">لا توجد رسائل بعد</p>
                <p className="text-zinc-500 text-sm">كن أول من يرسل رسالة!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white text-sm">
                        {message.profiles?.username || 'مستخدم مجهول'}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatTimestamp(message.created_at)}
                      </span>
                    </div>
                    <p className="text-zinc-300">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-zinc-800 border-t border-zinc-700 p-4">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-zinc-700 border-zinc-600 text-white"
                disabled={isSending}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatRoom;
