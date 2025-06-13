import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MediaInput from '@/components/MediaInput';
import { ArrowLeft, Send, RefreshCw, Play, Pause, X, Quote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import VerificationBadge from '@/components/VerificationBadge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadChatMedia, validateFile } from '@/utils/storageUtils';

interface Message {
  id: string;
  content: string;
  voice_url?: string;
  voice_duration?: number;
  media_url?: string;
  media_type?: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  sender_profile: {
    username: string;
    avatar_url?: string;
    verification_status?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  verification_status?: string;
}

const PrivateChat = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (userId && user) {
      fetchOtherUser();
      fetchMessages();
      
      const channel = supabase
        .channel('private_messages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'private_messages'
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, verification_status')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        navigate('/messages');
        return;
      }

      setOtherUser(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for conversation between:', user?.id, 'and', userId);
      
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey(username, avatar_url, verification_status)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Fetched messages:', data);
      setMessages(data || []);
      
      if (data && data.length > 0) {
        await supabase
          .from('private_messages')
          .update({ is_read: true })
          .eq('sender_id', userId)
          .eq('receiver_id', user?.id)
          .eq('is_read', false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string) => {
    console.log('=== PRIVATE CHAT SEND MESSAGE ===');
    console.log('Content:', content);
    console.log('Media file:', mediaFile ? `${mediaFile.name} (${mediaFile.size} bytes, type: ${mediaFile.type})` : 'none');
    console.log('Media type:', mediaType);
    
    if (!content.trim() && !mediaFile) return;
    if (!user || !userId || isSending) return;

    setIsSending(true);
    try {
      let voiceUrl = null;
      let mediaUrl = null;
      let finalMediaType = mediaType;
      
      if (mediaFile) {
        // التحقق من صحة الملف
        const validation = validateFile(mediaFile);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        console.log('=== STARTING MEDIA UPLOAD IN PRIVATE CHAT ===');
        console.log('File details:', {
          name: mediaFile.name,
          size: mediaFile.size,
          type: mediaFile.type,
          mediaType: mediaType
        });
        
        try {
          const uploadResult = await uploadChatMedia(mediaFile, user.id, 'private');
          console.log('Upload result:', uploadResult);
          
          if (mediaType === 'voice') {
            voiceUrl = uploadResult.url;
            finalMediaType = 'voice';
            console.log('Voice URL set:', voiceUrl);
          } else if (mediaFile.type.startsWith('image/')) {
            mediaUrl = uploadResult.url;
            finalMediaType = 'image';
            console.log('Image URL set:', mediaUrl);
          } else if (mediaFile.type.startsWith('video/')) {
            mediaUrl = uploadResult.url;
            finalMediaType = 'video';
            console.log('Video URL set:', mediaUrl);
          }
          
          console.log('Final media type:', finalMediaType);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          throw new Error(`فشل في رفع الملف: ${uploadError.message}`);
        }
      }

      const messageData: any = {
        sender_id: user.id,
        receiver_id: userId,
        content: content.trim() || '',
        is_read: false
      };

      // إضافة بيانات الوسائط حسب النوع
      if (voiceUrl) {
        messageData.voice_url = voiceUrl;
        messageData.voice_duration = 0;
        console.log('Added voice data to message:', { voice_url: voiceUrl });
      }

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = finalMediaType;
        console.log('Added media data to message:', { media_url: mediaUrl, media_type: finalMediaType });
      }

      console.log('=== INSERTING PRIVATE MESSAGE TO DATABASE ===');
      console.log('Final message data:', messageData);

      const { error } = await supabase
        .from('private_messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending message:', error);
        throw new Error(`فشل في إرسال الرسالة: ${error.message}`);
      }

      console.log('Private message sent successfully');
      await fetchMessages();
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة بنجاح"
      });
      
    } catch (error) {
      console.error('Error:', error);
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

  const handleRefresh = () => {
    fetchMessages();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openImageModal = (imageUrl: string) => {
    setImageModal(imageUrl);
  };

  const closeImageModal = () => {
    setImageModal(null);
  };

  if (isLoading) {
    return (
      <div className="full-screen-container bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="full-screen-container bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">المستخدم غير موجود</p>
          <Button onClick={() => navigate('/messages')} className="mt-4">
            العودة للرسائل
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-screen-container bg-zinc-900 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 p-4 flex-shrink-0 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">{otherUser?.username}</h1>
                <VerificationBadge 
                  verificationStatus={otherUser?.verification_status || null} 
                  size={16} 
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages - with padding for fixed header and input */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-20 pb-20">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">لا توجد رسائل بعد</p>
            <p className="text-zinc-500 text-sm">ابدأ محادثة جديدة!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start space-x-3 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} group`}
            >
              {message.sender_id !== user?.id && (
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender_profile?.avatar_url} alt={message.sender_profile?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {message.sender_profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <VerificationBadge 
                    verificationStatus={message.sender_profile?.verification_status || null} 
                    size={12} 
                  />
                </div>
              )}
              
              <div 
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                  message.sender_id === user?.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-zinc-700 text-white'
                }`}
              >
                {/* Quote Button */}
                <button
                  onClick={() => {
                    // For private chat, we'll set up a simple quote functionality
                    const quotedText = `> ${message.sender_profile?.username || 'مستخدم'}: ${message.content}\n\n`;
                    // This would need to be handled by MediaInput component
                    console.log('Quote message:', quotedText);
                  }}
                  className="absolute -top-2 -right-2 bg-zinc-600 hover:bg-zinc-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  title="اقتباس"
                >
                  <Quote size={12} className="text-white" />
                </button>

                {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                
                {/* Image - Fixed to display directly in chat */}
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
                      onLoad={() => console.log('Image loaded successfully:', message.media_url)}
                      onError={(e) => {
                        console.error('Image failed to load:', message.media_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Video */}
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
                
                {/* Voice Message */}
                {message.voice_url && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-black bg-opacity-20 rounded-lg">
                    <button
                      onClick={() => toggleAudio(message.id, message.voice_url!)}
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

                {/* Other attachments fallback */}
                {message.media_url && !message.media_type?.startsWith('image/') && !message.media_type?.startsWith('video/') && !message.voice_url && (
                  <div className="mt-2">
                    <a 
                      href={message.media_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline inline-flex items-center gap-2"
                    >
                      📎 عرض المرفق
                    </a>
                  </div>
                )}

                <p className={`text-xs mt-1 ${
                  message.sender_id === user?.id ? 'text-blue-100' : 'text-zinc-400'
                }`}>
                  {formatTimestamp(message.created_at)}
                </p>
              </div>

              {message.sender_id === user?.id && (
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <VerificationBadge 
                    verificationStatus={user?.user_metadata?.verification_status || null} 
                    size={12} 
                  />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
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

      {/* Fixed Message Input */}
      <div className="bg-zinc-800 border-t border-zinc-700 p-4 flex-shrink-0 fixed bottom-0 left-0 right-0 z-50">
        <MediaInput
          onSendMessage={sendMessage}
          isSending={isSending}
        />
      </div>
    </div>
  );
};

export default PrivateChat;
