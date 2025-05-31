
import React, { useState, useRef } from 'react';
import { Camera, Video, Image, Send, X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import VoiceRecorder from './VoiceRecorder';

interface Message {
  id: string;
  content: string;
  profiles: {
    username: string;
  };
}

interface MediaInputProps {
  onSendMessage: (content: string, mediaFile?: File, mediaType?: string, voiceFile?: File, voiceDuration?: number) => void;
  isSending: boolean;
  quotedMessage?: Message | null;
  onClearQuote?: () => void;
}

const MediaInput = ({ onSendMessage, isSending, quotedMessage, onClearQuote }: MediaInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : null;
      
      if (!type) {
        alert('نوع الملف غير مدعوم. يرجى اختيار صورة أو فيديو');
        return;
      }

      setSelectedMedia(file);
      setMediaType(type);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      console.log('MediaInput: Voice recorded, blob size:', audioBlob.size, 'duration:', duration);
      
      if (audioBlob.size === 0) {
        throw new Error('الملف الصوتي فارغ');
      }

      if (duration === 0) {
        throw new Error('مدة التسجيل غير صحيحة');
      }

      // إنشاء ملف صوتي مع الاسم والنوع الصحيح
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm'
      });

      console.log('MediaInput: Created audio file:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
        duration: duration
      });

      // إرسال الرسالة الصوتية
      await onSendMessage('رسالة صوتية', undefined, undefined, audioFile, duration);
      setShowVoiceRecorder(false);
      
    } catch (error) {
      console.error('MediaInput: Error handling voice recording:', error);
      alert('فشل في إرسال الرسالة الصوتية: ' + error.message);
      setShowVoiceRecorder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedMedia) return;
    
    onSendMessage(message.trim(), selectedMedia || undefined, mediaType || undefined);
    
    // Reset form
    setMessage('');
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceButtonClick = () => {
    console.log('MediaInput: Voice button clicked');
    setShowVoiceRecorder(true);
  };

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onVoiceRecorded={handleVoiceRecorded}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <div className="bg-zinc-800 border-t border-zinc-700 p-4">
      {/* Quoted Message Preview */}
      {quotedMessage && (
        <div className="mb-3 bg-zinc-700 rounded-lg p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-400">الرد على {quotedMessage.profiles?.username}</span>
            <button
              onClick={onClearQuote}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-zinc-300 truncate">{quotedMessage.content}</p>
        </div>
      )}

      {/* Media Preview */}
      {mediaPreview && (
        <div className="mb-3 relative">
          <div className="bg-zinc-700 rounded-lg p-2 relative">
            {mediaType === 'image' ? (
              <img 
                src={mediaPreview} 
                alt="معاينة الصورة" 
                className="max-h-32 rounded object-cover"
              />
            ) : (
              <video 
                src={mediaPreview} 
                className="max-h-32 rounded"
                controls
              />
            )}
            <button
              onClick={clearMedia}
              className="absolute top-1 right-1 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Voice Record Button */}
        <Button
          type="button"
          onClick={handleVoiceButtonClick}
          disabled={isSending}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 transition-colors flex-shrink-0 h-10 w-10"
          variant="secondary"
        >
          <Mic size={20} className="text-zinc-300" />
        </Button>

        {/* Media Button */}
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 transition-colors flex-shrink-0 h-10 w-10"
          variant="secondary"
        >
          <Camera size={20} className="text-zinc-300" />
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaSelect}
          className="hidden"
        />

        {/* Message Input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-zinc-700 border-zinc-600 text-white"
          disabled={isSending}
        />

        {/* Send Button */}
        <Button 
          type="submit" 
          disabled={(!message.trim() && !selectedMedia) || isSending}
          className="bg-blue-500 hover:bg-blue-600 flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default MediaInput;
