
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import MediaInput from '@/components/MediaInput';
import OwnerBadge from '@/components/OwnerBadge';
import RoomMembersModal from '@/components/RoomMembersModal';
import ChatRoomSettingsModal from '@/components/ChatRoomSettingsModal';
import ChatRoomAnnouncement from '@/components/ChatRoomAnnouncement';
import { ArrowLeft, Users, Settings, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  media_url?: string;
  media_type?: string;
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

  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string) => {
    if (!content.trim() && !mediaFile) return;
    if (!user) return;

    try {
      console.log('ChatRoom sendMessage called with:', { content, mediaFile: !!mediaFile, mediaType });
      
      let mediaUrl = null;
      
      if (mediaFile) {
        console.log('Starting media upload...');
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `chat-media/${fileName}`;

        console.log('Uploading to path:', filePath);

        // First ensure the bucket exists by trying to upload
        const { error: uploadError } = await supabase.storage
          .from('hashtag-images') // Using existing bucket instead of chat-media
          .upload(filePath, mediaFile);

        if (uploadError) {
          console.error('Error uploading media:', uploadError);
          alert('فشل في رفع الملف: ' + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('hashtag-images')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
        console.log('Media uploaded successfully:', mediaUrl);
      }

      let finalContent = content || '';
      if (quotedMessage) {
        finalContent = `> ${quotedMessage.profiles?.username || 'مستخدم مجهول'}: ${quotedMessage.content}\n\n${finalContent}`;
      }

      const messageData = {
        room_id: roomId,
        user_id: user.id,
        content: finalContent,
        media_url: mediaUrl,
        media_type: mediaType
      };

      console.log('Inserting message:', messageData);

      const { error } = await supabase
        .from('room_messages')
        .insert(messageData);

      if (error) {
        console.error('Message insert error:', error);
        throw new Error('فشل في إرسال الرسالة: ' + error.message);
      }

      console.log('Message sent successfully');
      setQuotedMessage(null);
      await fetchMessages();
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      alert(error.message || 'فشل في إرسال الرسالة');
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
      <div className="flex flex-col h-screen bg-zinc-900 relative">
        {/* Header */}
        <div className="bg-zinc-800 border-b border-zinc-700 p-4 flex-shrink-0 pt-safe-top">
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
          <div className="flex-shrink-0">
            <ChatRoomAnnouncement announcement={roomInfo.announcement} />
          </div>
        )}

        {/* Messages Container - Add bottom padding for input area */}
        <div className="flex-1 overflow-hidden pb-20">
          <div className="h-full overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '100px' }}>
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3 group">
                <div 
                  className="cursor-pointer"
                  onClick={() => navigateToUserProfile(message.user_id)}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.profiles?.avatar_url} alt={message.profiles?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
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
                  
                  <div className="text-zinc-300 break-words">
                    {message.content.split('\n').map((line, index) => (
                      <div key={index}>
                        {line.startsWith('> ') ? (
                          <div className="border-l-4 border-zinc-600 pl-3 mb-2 text-zinc-400 italic bg-zinc-800 rounded-r-lg p-2">
                            {line.substring(2)}
                          </div>
                        ) : (
                          <span>{line}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom with mobile-specific classes */}
        <div className="absolute bottom-0 left-0 right-0 mobile-input-container">
          <MediaInput 
            onSendMessage={sendMessage} 
            isSending={false}
            quotedMessage={quotedMessage}
            onClearQuote={() => setQuotedMessage(null)}
          />
        </div>
      </div>

      {showMembersModal && roomId && (
        <RoomMembersModal
          roomId={roomId}
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          isOwner={user?.id === roomInfo?.owner_id}
        />
      )}
      
      {showSettingsModal && roomId && roomInfo && (
        <ChatRoomSettingsModal
          roomId={roomId}
          currentAnnouncement={roomInfo.announcement}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onAnnouncementUpdate={handleAnnouncementUpdate}
        />
      )}
    </Layout>
  );
};

export default ChatRoom;
