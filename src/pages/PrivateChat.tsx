import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VoiceMessage from '@/components/VoiceMessage';
import VoiceRecorder from '@/components/VoiceRecorder';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  voice_url?: string;
  voice_duration?: number;
  sender_profile: {
    username: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  useEffect(() => {
    if (userId && user) {
      fetchOtherUser();
      fetchMessages();
      
      // Subscribe to real-time updates
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
        .select('id, username, avatar_url')
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
          sender_profile:profiles!private_messages_sender_id_fkey(username, avatar_url)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Fetched messages:', data);
      setMessages(data || []);
      
      // Mark messages as read
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

  const uploadVoiceToStorage = async (audioBlob: Blob): Promise<string> => {
    try {
      const fileName = `${user?.id}/${Date.now()}_voice.webm`;
      
      console.log('Uploading voice file:', fileName);
      console.log('Blob size:', audioBlob.size, 'type:', audioBlob.type);

      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading voice file:', error);
      throw new Error('فشل في رفع الملف الصوتي');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          content: newMessage.trim(),
          is_read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      // Refetch messages to ensure we get the latest data
      await fetchMessages();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    if (!user || !userId) return;

    setIsSending(true);
    try {
      console.log('Voice recorded, uploading to storage...');
      const voiceUrl = await uploadVoiceToStorage(audioBlob);
      console.log('Voice uploaded successfully:', voiceUrl);

      const messageData = {
        sender_id: user.id,
        receiver_id: userId,
        content: 'رسالة صوتية',
        voice_url: voiceUrl,
        voice_duration: Math.round(duration),
        is_read: false
      };

      console.log('Inserting voice message:', messageData);

      const { data, error } = await supabase
        .from('private_messages')
        .insert(messageData)
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey(username, avatar_url)
        `);

      if (error) {
        console.error('Error sending voice message:', error);
        throw error;
      }

      console.log('Voice message inserted successfully:', data);
      setShowVoiceRecorder(false);
      
      // Refetch messages to ensure we get the latest data
      await fetchMessages();
    } catch (error) {
      console.error('Error handling voice recording:', error);
      alert('فشل في إرسال الرسالة الصوتية');
      setShowVoiceRecorder(false);
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

  if (showVoiceRecorder) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <VoiceRecorder
          onVoiceRecorded={handleVoiceRecorded}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 p-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {otherUser.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{otherUser.username}</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">لا توجد رسائل بعد</p>
            <p className="text-zinc-500 text-sm">ابدأ محادثة جديدة!</p>
          </div>
        ) : (
          messages.map((message) => {
            console.log('Rendering message:', message);
            return (
              <div 
                key={message.id} 
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {message.voice_url && message.voice_duration ? (
                  <VoiceMessage
                    voiceUrl={message.voice_url}
                    duration={message.voice_duration}
                    isOwn={message.sender_id === user?.id}
                  />
                ) : (
                  <div 
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-zinc-700 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-blue-100' : 'text-zinc-400'
                    }`}>
                      {formatTimestamp(message.created_at)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-zinc-800 border-t border-zinc-700 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            disabled={isSending}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 transition-colors flex-shrink-0"
            variant="secondary"
          >
            <Mic size={18} />
          </Button>
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
    </div>
  );
};

export default PrivateChat;
