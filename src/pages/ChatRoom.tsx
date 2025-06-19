import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MediaInput from '@/components/MediaInput';
import OwnerBadge from '@/components/OwnerBadge';
import ModeratorBadge from '@/components/ModeratorBadge';
import VerificationBadge from '@/components/VerificationBadge';
import RoomMembersModal from '@/components/RoomMembersModal';
import ChatRoomSettingsModal from '@/components/ChatRoomSettingsModal';
import ChatRoomAnnouncement from '@/components/ChatRoomAnnouncement';
import { ArrowLeft, Users, Settings, Quote, X, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import LiveMatchWidget from '@/components/LiveMatchWidget';
import { uploadChatMedia } from '@/utils/storageUtils';

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
    verification_status?: string;
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
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId && user) {
      console.log('🚀 Loading room:', roomId);
      loadRoom();
      setupRealtime();
    }
  }, [roomId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoom = async () => {
    if (!roomId || !user) return;
    
    try {
      console.log('📋 Fetching room data...');
      
      // Get room info
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('❌ Room error:', roomError);
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على الغرفة",
          variant: "destructive"
        });
        navigate('/chat-rooms');
        return;
      }

      console.log('✅ Room loaded:', roomData.name);
      setRoomInfo(roomData);

      // Check if user is member or owner
      const isOwner = roomData.owner_id === user.id;
      let isMemberInRoom = false;

      if (!isOwner) {
        const { data: memberData } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .eq('is_banned', false)
          .single();

        isMemberInRoom = !!memberData;

        // Auto-join public room if not a member
        if (!isMemberInRoom && !roomData.is_private) {
          await joinRoom();
          isMemberInRoom = true;
        }
      }

      setIsMember(isOwner || isMemberInRoom);

      // Load messages
      await loadMessages();
      
      // Load current user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, verification_status')
        .eq('id', user.id)
        .single();

      setCurrentUserProfile(profileData);
      
    } catch (error) {
      console.error('💥 Load room error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الغرفة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!roomId) return;
    
    try {
      console.log('💬 Loading messages...');
      
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            verification_status
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Messages error:', error);
        return;
      }

      console.log('✅ Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      console.error('💥 Load messages error:', error);
    }
  };

  const setupRealtime = () => {
    if (!roomId) return;
    
    console.log('📡 Setting up realtime...');
    
    const channel = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log('📨 New message received');
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const joinRoom = async () => {
    if (!roomId || !user) return;
    
    try {
      console.log('🚪 Joining room...');
      
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
          role: 'member'
        });

      if (error && error.code !== '23505') {
        console.error('❌ Join error:', error);
        toast({
          title: "خطأ",
          description: "فشل في الانضمام للغرفة",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Joined room');
      setIsMember(true);
      
      toast({
        title: "تم الانضمام",
        description: "تم الانضمام للغرفة بنجاح"
      });
    } catch (error) {
      console.error('💥 Join error:', error);
    }
  };

  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string) => {
    if (!content.trim() && !mediaFile) return;
    if (!user || !roomId) return;

    setIsSending(true);
    
    try {
      let mediaUrl = null;
      let voiceUrl = null;
      
      if (mediaFile) {
        console.log('📁 Uploading media...');
        const uploadResult = await uploadChatMedia(mediaFile, user.id, 'room');
        
        if (mediaType === 'voice') {
          voiceUrl = uploadResult.url;
        } else {
          mediaUrl = uploadResult.url;
        }
      }

      let finalContent = content || '';
      if (quotedMessage) {
        finalContent = `> ${quotedMessage.profiles?.username || 'مستخدم'}: ${quotedMessage.content}\n\n${finalContent}`;
      }

      const messageData: any = {
        room_id: roomId,
        user_id: user.id,
        content: finalContent,
      };

      if (voiceUrl) {
        messageData.voice_url = voiceUrl;
        messageData.voice_duration = 0;
      }
      
      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }

      console.log('📤 Sending message...');

      const { error } = await supabase
        .from('room_messages')
        .insert(messageData);

      if (error) {
        console.error('❌ Send error:', error);
        throw error;
      }

      console.log('✅ Message sent');
      setQuotedMessage(null);
      
      // Refresh messages immediately
      setTimeout(() => {
        loadMessages();
      }, 500);
      
    } catch (error) {
      console.error('💥 Send message error:', error);
      toast({
        title: "خطأ في الإرسال",
        description: 'فشل في إرسال الرسالة',
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleAudio = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      if (audioRefs.current[messageId]) {
        audioRefs.current[messageId].pause();
        audioRefs.current[messageId].currentTime = 0;
      }
      setPlayingAudio(null);
    } else {
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
        audioRefs.current[playingAudio].currentTime = 0;
      }

      if (!audioRefs.current[messageId]) {
        audioRefs.current[messageId] = new Audio(audioUrl);
        audioRefs.current[messageId].onended = () => setPlayingAudio(null);
      }

      audioRefs.current[messageId].play();
      setPlayingAudio(messageId);
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

  const openImageModal = (imageUrl: string) => {
    setImageModal(imageUrl);
  };

  const closeImageModal = () => {
    setImageModal(null);
  };

  const leaveRoom = async () => {
    if (!user || !roomId) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving room:', error);
        return;
      }

      navigate('/chat-rooms');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderMessage = (message: any) => {
    const isOwnMessage = message.user_id === user?.id;

    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
      >
        {!isOwnMessage && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.profiles?.avatar_url} alt={message.profiles?.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-first' : ''} relative`}>
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-300">
                {message.profiles?.username || 'مستخدم مجهول'}
              </p>
              <VerificationBadge 
                verificationStatus={message.profiles?.verification_status || null} 
                size={14} 
              />
              <OwnerBadge 
                isOwner={message.user_id === roomInfo?.owner_id} 
                verificationStatus={message.profiles?.verification_status}
              />
            </div>
          )}

          {isOwnMessage && (
            <div className="flex items-center gap-2 mb-1 justify-end">
              <OwnerBadge 
                isOwner={message.user_id === roomInfo?.owner_id} 
                verificationStatus={currentUserProfile?.verification_status}
              />
              <VerificationBadge 
                verificationStatus={currentUserProfile?.verification_status || null} 
                size={14} 
              />
              <p className="text-sm font-medium text-gray-300">
                {currentUserProfile?.username || user?.email || 'أنت'}
              </p>
            </div>
          )}

          <div
            className={`px-4 py-2 rounded-lg relative ${
              isOwnMessage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-white'
            }`}
          >
            <button
              onClick={() => quoteMessage(message)}
              className="absolute -top-2 -right-2 bg-zinc-600 hover:bg-zinc-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              title="اقتباس"
            >
              <Quote size={12} className="text-white" />
            </button>

            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            {message.voice_url && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-black bg-opacity-20 rounded-lg">
                <button
                  onClick={() => toggleAudio(message.id, message.voice_url)}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                >
                  {playingAudio === message.id ? (
                    <Pause size={16} className="text-white" />
                  ) : (
                    <Play size={16} className="text-white" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="w-full h-1 bg-white bg-opacity-20 rounded-full">
                    <div className="h-full bg-white bg-opacity-40 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                <span className="text-xs opacity-75">صوتية</span>
              </div>
            )}

            {message.media_url && message.media_type === 'image' && (
              <div className="mt-2">
                <img 
                  src={message.media_url} 
                  alt="صورة"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity max-h-60 object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(message.media_url);
                  }}
                />
              </div>
            )}

            {message.media_url && message.media_type === 'video' && (
              <div className="mt-2">
                <video 
                  src={message.media_url} 
                  controls 
                  className="max-w-full h-auto rounded-lg max-h-60"
                  preload="metadata"
                />
              </div>
            )}
            
            <p className={`text-xs mt-1 ${
              isOwnMessage ? 'text-blue-100' : 'text-gray-400'
            }`}>
              {formatTimestamp(message.created_at)}
            </p>
          </div>
        </div>

        {isOwnMessage && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUserProfile?.avatar_url} alt={currentUserProfile?.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {currentUserProfile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isRoomOwner = user?.id === roomInfo?.owner_id;
  
  // Show join room only if user is not a member AND not the owner
  if (!isMember && !isRoomOwner && !isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">انضم للغرفة</h2>
          <p className="text-zinc-400 mb-6">يجب عليك الانضمام للغرفة لعرض الرسائل والمشاركة</p>
          <div className="space-y-4">
            <Button onClick={joinRoom} className="bg-blue-500 hover:bg-blue-600">
              الانضمام للغرفة
            </Button>
            <Button onClick={() => navigate('/chat-rooms')} variant="outline">
              العودة للغرف
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col pt-safe pb-safe">
      <div className="bg-zinc-800 border-b border-zinc-700 p-4 fixed top-0 left-0 right-0 z-50 pt-safe">
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
            {isRoomOwner && (
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Settings size={20} className="text-white" />
              </button>
            )}
            {!isRoomOwner && (
              <button 
                onClick={leaveRoom}
                className="p-2 hover:bg-red-700 rounded-lg transition-colors"
                title="مغادرة الغرفة"
              >
                <ArrowLeft size={20} className="text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="fixed left-0 right-0 z-40 bg-zinc-900" style={{ top: 'calc(80px + env(safe-area-inset-top, 0px))' }}>
        {roomInfo?.announcement && (
          <div className="px-4">
            <ChatRoomAnnouncement announcement={roomInfo.announcement} />
          </div>
        )}
        
        {roomId && (
          <div className="px-4">
            <LiveMatchWidget
              roomId={roomId}
              isOwnerOrModerator={isRoomOwner}
              onRemove={() => {
                console.log('Live match removed');
              }}
            />
          </div>
        )}
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-24"
        style={{
          marginTop: `calc(${
            80 + 
            (roomInfo?.announcement ? 60 : 0) + 
            60 
          }px + env(safe-area-inset-top, 0px))`,
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">لا توجد رسائل في هذه الغرفة بعد</p>
            <p className="text-zinc-500 text-sm mt-2">كن أول من يبدأ المحادثة!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-4 pb-safe z-40">
        <MediaInput 
          onSendMessage={sendMessage} 
          isSending={isSending}
          quotedMessage={quotedMessage}
          onClearQuote={() => setQuotedMessage(null)}
        />
      </div>

      {imageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img 
              src={imageModal} 
              alt="صورة مكبرة" 
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {showMembersModal && roomId && (
        <RoomMembersModal
          roomId={roomId}
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          isOwner={isRoomOwner}
          onMembershipChange={() => {
            console.log('Membership changed');
            loadRoom(); // Refresh room data
          }}
        />
      )}
      
      {showSettingsModal && roomId && roomInfo && (
        <ChatRoomSettingsModal
          roomId={roomId}
          currentAnnouncement={roomInfo.announcement}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onAnnouncementUpdate={(announcement) => {
            if (roomInfo) {
              setRoomInfo({ ...roomInfo, announcement });
            }
          }}
        />
      )}
    </div>
  );
};

export default ChatRoom;
