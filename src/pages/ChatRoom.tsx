
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
import { ScrollArea } from '@/components/ui/scroll-area';
import LiveMatchWidget from '@/components/LiveMatchWidget';
import { uploadChatMedia, validateFile } from '@/utils/storageUtils';

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

interface UserRole {
  user_id: string;
  role: string;
}

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
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
      console.log('🚀 Initializing room:', roomId, 'for user:', user.id);
      initializeRoom();
    }
  }, [roomId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && roomId) {
      const membershipChannel = supabase
        .channel('membership-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_members',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Membership change:', payload);
            if (payload.eventType === 'DELETE' && payload.old?.room_id === roomId) {
              if (roomInfo?.owner_id !== user.id) {
                toast({
                  title: "تم إخراجك",
                  description: `تم إخراجك من شات ${roomInfo?.name || 'الغرفة'}`,
                  variant: "destructive"
                });
                navigate('/chat-rooms');
              }
            } else if (payload.eventType === 'UPDATE' && payload.new?.is_banned === true && payload.new?.room_id === roomId) {
              if (roomInfo?.owner_id !== user.id) {
                toast({
                  title: "تم حظرك",
                  description: `تم حظرك من شات ${roomInfo?.name || 'الغرفة'}`,
                  variant: "destructive"
                });
                setIsBanned(true);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(membershipChannel);
      };
    }
  }, [user, roomId, roomInfo?.name, roomInfo?.owner_id, navigate, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeRoom = async () => {
    if (!roomId || !user) return;
    
    try {
      console.log('🔄 Fetching room info for room:', roomId);
      
      // Get room info
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('❌ Error fetching room:', roomError);
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على الغرفة",
          variant: "destructive"
        });
        navigate('/chat-rooms');
        return;
      }

      console.log('✅ Room data loaded:', roomData);
      setRoomInfo(roomData);

      const isOwner = roomData.owner_id === user.id;
      console.log('👑 Is owner:', isOwner);

      // Load data
      await Promise.all([
        fetchMessages(),
        fetchUserRoles(),
        fetchCurrentUserProfile(),
        checkMembership()
      ]);

      setupRealtimeSubscription();
      
    } catch (error) {
      console.error('💥 Error in initializeRoom:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الغرفة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!roomId || !user) return;
    
    try {
      console.log('🔍 Checking membership for user:', user.id, 'in room:', roomId);
      
      const { data: membershipData, error: membershipError } = await supabase
        .from('room_members')
        .select('id, is_banned, role')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) {
        console.error('❌ Error checking membership:', membershipError);
        return;
      }

      console.log('📋 Membership data:', membershipData);

      if (membershipData) {
        setIsMember(true);
        setIsBanned(membershipData.is_banned || false);
        console.log('✅ User is member, banned:', membershipData.is_banned);
      } else {
        // If user is room owner but not a member, add them
        if (roomInfo?.owner_id === user.id) {
          console.log('👑 Owner not in members, adding...');
          await joinRoom();
        } else {
          setIsMember(false);
          setIsBanned(false);
          console.log('❌ User is not a member');
        }
      }
    } catch (error) {
      console.error('💥 Error in checkMembership:', error);
    }
  };

  const fetchUserRoles = async () => {
    if (!roomId) return;
    
    try {
      console.log('👥 Fetching user roles for room:', roomId);
      
      const { data, error } = await supabase
        .from('room_members')
        .select('user_id, role')
        .eq('room_id', roomId);

      if (error) {
        console.error('❌ Error fetching user roles:', error);
        return;
      }

      console.log('✅ User roles loaded:', data?.length || 0, 'roles');
      setUserRoles(data || []);
    } catch (error) {
      console.error('💥 Error in fetchUserRoles:', error);
    }
  };

  const getUserRole = (userId: string): string => {
    const userRole = userRoles.find(role => role.user_id === userId);
    return userRole?.role || 'member';
  };

  const isOwner = (userId: string): boolean => {
    return userId === roomInfo?.owner_id;
  };

  const isModerator = (userId: string): boolean => {
    return getUserRole(userId) === 'moderator';
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    
    try {
      console.log('💬 Fetching messages for room:', roomId);
      
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verification_status
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب الرسائل",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Messages loaded:', data?.length || 0, 'messages');
      setMessages(data?.reverse() || []);
    } catch (error) {
      console.error('💥 Error in fetchMessages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!roomId) return;
    
    console.log('📡 Setting up real-time subscription for room:', roomId);
    
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
          console.log('📨 Real-time message received:', payload);
          fetchMessages();
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
      console.log('🚪 Joining room:', roomId, 'as user:', user.id);
      
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
          role: roomInfo?.owner_id === user.id ? 'owner' : 'member'
        });

      if (error && error.code !== '23505') {
        console.error('❌ Error joining room:', error);
        toast({
          title: "خطأ",
          description: "فشل في الانضمام للغرفة",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Successfully joined room');
      setIsMember(true);
      await fetchUserRoles();
      
      toast({
        title: "تم الانضمام",
        description: "تم الانضمام للغرفة بنجاح"
      });
    } catch (error) {
      console.error('💥 Error in joinRoom:', error);
    }
  };

  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string) => {
    console.log('📤 Sending message:', { content, hasMedia: !!mediaFile, mediaType });

    if (!content.trim() && !mediaFile) {
      console.log('❌ No content or media to send');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    if (isBanned && !isOwner(user.id)) {
      toast({
        title: "محظور",
        description: "لا يمكنك إرسال رسائل لأنك محظور من هذه الغرفة",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      let mediaUrl = null;
      let voiceUrl = null;
      let finalMediaType = mediaType;
      
      if (mediaFile) {
        const validation = validateFile(mediaFile);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        console.log('📁 Uploading media file...');
        
        try {
          const uploadResult = await uploadChatMedia(mediaFile, user.id, 'room');
          console.log('✅ Media uploaded:', uploadResult);
          
          if (mediaType === 'voice') {
            voiceUrl = uploadResult.url;
            finalMediaType = 'voice';
          } else if (mediaFile.type.startsWith('image/')) {
            mediaUrl = uploadResult.url;
            finalMediaType = 'image';
          } else if (mediaFile.type.startsWith('video/')) {
            mediaUrl = uploadResult.url;
            finalMediaType = 'video';
          }
        } catch (uploadError) {
          console.error('❌ Upload failed:', uploadError);
          throw new Error(`فشل في رفع الملف: ${uploadError.message}`);
        }
      }

      let finalContent = content || '';
      if (quotedMessage) {
        finalContent = `> ${quotedMessage.profiles?.username || 'مستخدم مجهول'}: ${quotedMessage.content}\n\n${finalContent}`;
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
        messageData.media_type = finalMediaType;
      }

      console.log('💾 Inserting message to database:', messageData);

      const { data: insertData, error: insertError } = await supabase
        .from('room_messages')
        .insert(messageData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw new Error(`فشل في إرسال الرسالة: ${insertError.message}`);
      }

      console.log('✅ Message sent successfully:', insertData);
      setQuotedMessage(null);
      await fetchMessages();
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة بنجاح"
      });
      
    } catch (error) {
      console.error('💥 Error in sendMessage:', error);
      toast({
        title: "خطأ في الإرسال",
        description: error.message || 'فشل في إرسال الرسالة',
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

  const navigateToUserProfile = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleAnnouncementUpdate = (announcement: string | null) => {
    if (roomInfo) {
      setRoomInfo({ ...roomInfo, announcement });
    }
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

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, verification_status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current user profile:', error);
        return;
      }

      setCurrentUserProfile(data);
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
          <div className="flex flex-col items-center gap-1">
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.profiles?.avatar_url} alt={message.profiles?.username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
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
                isOwner={isOwner(message.user_id)} 
                verificationStatus={message.profiles?.verification_status}
              />
              <ModeratorBadge isModerator={isModerator(message.user_id)} />
            </div>
          )}

          {isOwnMessage && (
            <div className="flex items-center gap-2 mb-1 justify-end">
              <ModeratorBadge isModerator={isModerator(message.user_id)} />
              <OwnerBadge 
                isOwner={isOwner(message.user_id)} 
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
                  onError={(e) => {
                    console.error('Image failed to load:', message.media_url);
                    e.currentTarget.style.display = 'none';
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
          <div className="flex flex-col items-center gap-1">
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUserProfile?.avatar_url} alt={currentUserProfile?.username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {currentUserProfile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
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

  // Show banned message only for non-owners
  if (isBanned && !isRoomOwner) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">محظور</h2>
          <p className="text-zinc-400 mb-6">تم حظرك من هذه الغرفة</p>
          <Button onClick={() => navigate('/chat-rooms')} variant="outline">
            العودة للغرف
          </Button>
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
              isOwnerOrModerator={isRoomOwner || isModerator(user?.id || '')}
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
            fetchUserRoles();
          }}
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
    </div>
  );
};

export default ChatRoom;
