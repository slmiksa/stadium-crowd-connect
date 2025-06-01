import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import MediaInput from '@/components/MediaInput';
import OwnerBadge from '@/components/OwnerBadge';
import ModeratorBadge from '@/components/ModeratorBadge';
import RoomMembersModal from '@/components/RoomMembersModal';
import ChatRoomSettingsModal from '@/components/ChatRoomSettingsModal';
import ChatRoomAnnouncement from '@/components/ChatRoomAnnouncement';
import { ArrowLeft, Users, Settings, Quote, X } from 'lucide-react';
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

interface UserRole {
  user_id: string;
  role: string;
}

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId && user) {
      fetchRoomInfo();
      checkMembership();
      fetchMessages();
      fetchUserRoles();
      setupRealtimeSubscription();
    }
  }, [roomId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('user_id, role')
        .eq('room_id', roomId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      setUserRoles(data || []);
    } catch (error) {
      console.error('Error:', error);
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

  const fetchRoomInfo = async () => {
    try {
      // Get room info with real-time member count
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*, announcement')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error fetching room info:', roomError);
        navigate('/chat-rooms');
        return;
      }

      // Get actual current member count
      const { count: actualMembersCount, error: countError } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('is_banned', false);

      if (countError) {
        console.error('Error counting members:', countError);
      }

      setRoomInfo({
        ...roomData,
        members_count: actualMembersCount || 0
      });
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
      // Refresh room info to get updated member count
      fetchRoomInfo();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string) => {
    console.log('=== SEND MESSAGE FUNCTION CALLED ===');
    console.log('Content:', content);
    console.log('Media file:', mediaFile ? `${mediaFile.name} (${mediaFile.size} bytes)` : 'none');
    console.log('Media type:', mediaType);

    if (!content.trim() && !mediaFile) {
      console.log('No content or media to send');
      return;
    }
    
    if (!user) {
      console.log('No user found');
      return;
    }

    setIsSending(true);
    
    try {
      let mediaUrl = null;
      
      if (mediaFile) {
        console.log('=== STARTING MEDIA UPLOAD ===');
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `chat-media/${user.id}/${Date.now()}.${fileExt}`;

        console.log('Uploading to path:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hashtag-images')
          .upload(fileName, mediaFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('فشل في رفع الملف: ' + uploadError.message);
        }

        console.log('Upload successful:', uploadData);

        const { data: urlData } = supabase.storage
          .from('hashtag-images')
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
        console.log('Media URL generated:', mediaUrl);
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

      console.log('=== INSERTING MESSAGE ===');
      console.log('Message data:', messageData);

      const { data: insertData, error: insertError } = await supabase
        .from('room_messages')
        .insert(messageData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('فشل في إرسال الرسالة: ' + insertError.message);
      }

      console.log('Message inserted successfully:', insertData);
      setQuotedMessage(null);
      await fetchMessages();
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      alert(error.message || 'فشل في إرسال الرسالة');
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

      // Navigate back to chat rooms list
      navigate('/chat-rooms');
    } catch (error) {
      console.error('Error:', error);
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
              {/* Leave Room Button - only show if user is not the owner */}
              {user?.id !== roomInfo?.owner_id && (
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

        {/* Announcement */}
        {roomInfo?.announcement && (
          <div className="flex-shrink-0">
            <ChatRoomAnnouncement announcement={roomInfo.announcement} />
          </div>
        )}

        {/* Messages Container */}
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
                    <OwnerBadge isOwner={isOwner(message.user_id)} />
                    <ModeratorBadge isModerator={isModerator(message.user_id)} />
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
                  
                  {/* Media Display */}
                  {message.media_url && (
                    <div className="mb-2">
                      {message.media_type === 'image' ? (
                        <img 
                          src={message.media_url} 
                          alt="صورة مرسلة" 
                          className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-zinc-600"
                          onClick={() => openImageModal(message.media_url!)}
                          onError={(e) => {
                            console.error('Image failed to load:', message.media_url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : message.media_type === 'video' ? (
                        <video 
                          src={message.media_url} 
                          className="max-w-xs max-h-64 rounded-lg border border-zinc-600" 
                          controls
                          onError={(e) => {
                            console.error('Video failed to load:', message.media_url);
                          }}
                        />
                      ) : (
                        <a 
                          href={message.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline inline-flex items-center bg-zinc-700 px-3 py-2 rounded-lg"
                        >
                          📎 عرض المرفق
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  {message.content && (
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
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 mobile-input-container">
          <MediaInput 
            onSendMessage={sendMessage} 
            isSending={isSending}
            quotedMessage={quotedMessage}
            onClearQuote={() => setQuotedMessage(null)}
          />
        </div>

        {/* Image Modal */}
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
      </div>

      {showMembersModal && roomId && (
        <RoomMembersModal
          roomId={roomId}
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          isOwner={user?.id === roomInfo?.owner_id}
          onMembershipChange={() => {
            fetchRoomInfo();
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
    </Layout>
  );
};

export default ChatRoom;
