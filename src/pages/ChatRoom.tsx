import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import MediaInput from '@/components/MediaInput';
import OwnerBadge from '@/components/OwnerBadge';
import RoomMembersModal from '@/components/RoomMembersModal';
import ChatRoomSettingsModal from '@/components/ChatRoomSettingsModal';
import ChatRoomAnnouncement from '@/components/ChatRoomAnnouncement';
import VoiceMessage from '@/components/VoiceMessage';
import { ArrowLeft, Users, Settings, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  voice_url?: string;
  voice_duration?: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface RoomInfo {
  id: string;
  name: string;
  description?: string;
  members_count: number;
  is_private: boolean;
  owner_id: string;
  announcement?: string;
}

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId && user) {
      fetchRoomInfo();
      checkMembership();
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [roomId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoomInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*, announcement')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room info:', error);
        navigate('/chat-rooms');
        return;
      }

      setRoomInfo(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkMembership = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('id, is_banned')
        .eq('room_id', roomId)
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setIsMember(true);
        setIsBanned(data.is_banned || false);
      } else {
        setIsMember(false);
        setIsBanned(false);
      }
    } catch (error) {
      setIsMember(false);
      setIsBanned(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for room:', roomId);
      
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Fetched room messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Real-time message received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const joinRoom = async () => {
    try {
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: user?.id
        });

      if (error) {
        console.error('Error joining room:', error);
        return;
      }

      setIsMember(true);
      fetchRoomInfo();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string, voiceFile?: File, voiceDuration?: number) => {
    if (!content.trim() && !mediaFile && !voiceFile) return;
    if (!user) return;

    try {
      let mediaUrl = null;
      let voiceUrl = null;
      
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, mediaFile);

        if (uploadError) {
          console.error('Error uploading media:', uploadError);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      if (voiceFile) {
        console.log('ChatRoom: Uploading voice file to storage...');
        console.log('ChatRoom: Voice file size:', voiceFile.size);
        console.log('ChatRoom: Voice file type:', voiceFile.type);
        
        const fileName = `voice_${user.id}_${Date.now()}.webm`;

        const { data, error: uploadError } = await supabase.storage
          .from('voice-messages')
          .upload(fileName, voiceFile, {
            contentType: 'audio/webm',
            upsert: false
          });

        if (uploadError) {
          console.error('ChatRoom: Error uploading voice message:', uploadError);
          alert('فشل في رفع الملف الصوتي');
          return;
        }

        console.log('ChatRoom: Voice file uploaded successfully:', data);

        const { data: { publicUrl } } = supabase.storage
          .from('voice-messages')
          .getPublicUrl(fileName);

        voiceUrl = publicUrl;
        console.log('ChatRoom: Voice public URL generated:', voiceUrl);
      }

      let finalContent = content || 'رسالة صوتية';
      if (quotedMessage) {
        finalContent = `> ${quotedMessage.profiles?.username || 'مستخدم مجهول'}: ${quotedMessage.content}\n\n${finalContent}`;
      }

      const messageData = {
        room_id: roomId,
        user_id: user.id,
        content: finalContent,
        media_url: mediaUrl,
        media_type: mediaType,
        voice_url: voiceUrl,
        voice_duration: voiceDuration ? Math.round(voiceDuration) : null
      };

      console.log('ChatRoom: Inserting message with data:', messageData);

      const { data, error } = await supabase
        .from('room_messages')
        .insert(messageData)
        .select(`
          *,
          profiles (username, avatar_url)
        `);

      if (error) {
        console.error('ChatRoom: Error sending message:', error);
        return;
      }

      console.log('ChatRoom: Message sent successfully:', data);
      setQuotedMessage(null);
      
      // Refetch messages to ensure we get the latest data
      await fetchMessages();
    } catch (error) {
      console.error('ChatRoom: Error in sendMessage:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quoteMessage = (message: Message) => {
    setQuotedMessage(message);
  };

  const navigateToUserProfile = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleAnnouncementUpdate = (announcement: string | null) => {
    if (roomInfo) {
      setRoomInfo({ ...roomInfo, announcement });
    }
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

  if (isBanned) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold text-white mb-4">محظور من الغرفة</h2>
          <p className="text-zinc-400 mb-6">تم حظرك من هذه الغرفة ولا يمكنك المشاركة فيها.</p>
          <Button
            onClick={() => navigate('/chat-rooms')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            العودة للغرف
          </Button>
        </div>
      </Layout>
    );
  }

  if (!isMember && roomInfo?.is_private) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold text-white mb-4">غرفة خاصة</h2>
          <p className="text-zinc-400 mb-6">هذه غرفة خاصة. تحتاج إلى دعوة للانضمام.</p>
          <Button
            onClick={() => navigate('/chat-rooms')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            العودة للغرف
          </Button>
        </div>
      </Layout>
    );
  }

  if (!isMember) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold text-white mb-4">{roomInfo?.name}</h2>
          <p className="text-zinc-400 mb-6">{roomInfo?.description}</p>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Users size={18} />
              <span>{roomInfo?.members_count} عضو</span>
            </div>
          </div>
          <Button
            onClick={joinRoom}
            className="bg-blue-500 hover:bg-blue-600"
          >
            انضمام للغرفة
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false}>
      <div className="flex flex-col h-screen">
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
                <h1 className="text-lg font-bold text-white">{roomInfo?.name}</h1>
                <div className="flex items-center space-x-2 text-sm text-zinc-400">
                  <Users size={14} />
                  <span>{roomInfo?.members_count} عضو</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowMembersModal(true)}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Users size={20} className="text-white" />
              </button>
              {user?.id === roomInfo?.owner_id && (
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Settings size={20} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Announcement */}
        {roomInfo?.announcement && (
          <ChatRoomAnnouncement announcement={roomInfo.announcement} />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            console.log('Rendering room message:', message);
            return (
              <div key={message.id} className="flex items-start space-x-3 group">
                <div 
                  className="cursor-pointer"
                  onClick={() => navigateToUserProfile(message.user_id)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.profiles?.avatar_url} alt={message.profiles?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span 
                      className="font-medium text-white cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => navigateToUserProfile(message.user_id)}
                    >
                      {message.profiles?.username || 'مستخدم مجهول'}
                    </span>
                    <OwnerBadge isOwner={message.user_id === roomInfo?.owner_id} />
                    <span className="text-xs text-zinc-500">
                      {formatTimestamp(message.created_at)}
                    </span>
                    <button
                      onClick={() => quoteMessage(message)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-700 rounded"
                    >
                      <Quote size={14} className="text-zinc-400" />
                    </button>
                  </div>
                  
                  {/* Voice Message */}
                  {message.voice_url && message.voice_duration ? (
                    <div className="mb-2">
                      <VoiceMessage 
                        voiceUrl={message.voice_url}
                        duration={message.voice_duration}
                        isOwn={message.user_id === user?.id}
                      />
                    </div>
                  ) : null}
                  
                  {/* Media Message */}
                  {message.media_url ? (
                    <div className="mb-2">
                      {message.media_type?.startsWith('image/') ? (
                        <img 
                          src={message.media_url} 
                          alt="مرفق" 
                          className="max-w-xs rounded-lg"
                        />
                      ) : (
                        <a 
                          href={message.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          عرض المرفق
                        </a>
                      )}
                    </div>
                  ) : null}
                  
                  {/* Text Content */}
                  {!message.voice_url && (
                    <div className="text-zinc-300">
                      {message.content.split('\n').map((line, index) => (
                        <div key={index}>
                          {line.startsWith('> ') ? (
                            <div className="border-l-4 border-zinc-600 pl-3 mb-2 text-zinc-400 italic">
                              {line.substring(2)}
                            </div>
                          ) : (
                            <span>{line}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <MediaInput 
          onSendMessage={sendMessage} 
          isSending={false}
          quotedMessage={quotedMessage}
          onClearQuote={() => setQuotedMessage(null)}
        />
      </div>

      {/* Room Members Modal */}
      <RoomMembersModal 
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        roomId={roomId || ''}
        isOwner={user?.id === roomInfo?.owner_id}
      />

      {/* Settings Modal */}
      <ChatRoomSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        roomId={roomId || ''}
        currentAnnouncement={roomInfo?.announcement}
        onAnnouncementUpdate={handleAnnouncementUpdate}
      />
    </Layout>
  );
};

export default ChatRoom;
