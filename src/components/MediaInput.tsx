
import React, { useState, useRef } from 'react';
import { Camera, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  content: string;
  profiles: {
    username: string;
  };
}

interface MediaInputProps {
  onSendMessage: (content: string, mediaFile?: File, mediaType?: string) => void;
  isSending: boolean;
  quotedMessage?: Message | null;
  onClearQuote?: () => void;
}

const MediaInput = ({ onSendMessage, isSending, quotedMessage, onClearQuote }: MediaInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedMedia) return;
    
    onSendMessage(message.trim(), selectedMedia || undefined, mediaType || undefined);
    
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 p-4 z-10">
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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
          className="flex-1 bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 h-10"
          disabled={isSending}
        />

        {/* Send Button */}
        <Button 
          type="submit" 
          disabled={(!message.trim() && !selectedMedia) || isSending}
          className="bg-blue-500 hover:bg-blue-600 flex-shrink-0 h-10 w-10 p-2"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default MediaInput;
