
import React, { useState, useRef } from 'react';
import { Camera, Video, Image, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MediaInputProps {
  onSendMessage: (content: string, mediaFile?: File, mediaType?: string) => void;
  isSending: boolean;
}

const MediaInput = ({ onSendMessage, isSending }: MediaInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
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

  return (
    <div className="bg-zinc-800 border-t border-zinc-700 p-4">
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

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Media Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors flex-shrink-0"
          disabled={isSending}
        >
          <Camera size={20} className="text-zinc-300" />
        </button>
        
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
