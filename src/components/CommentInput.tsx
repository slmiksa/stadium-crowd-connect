
import React, { useState, useRef } from 'react';
import { Send, Image, X, Reply, Hash } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CommentInputProps {
  onSubmit: (content: string, mediaFile?: File, mediaType?: string) => Promise<void>;
  isSubmitting: boolean;
  placeholder?: string;
  replyTo?: {
    id: string;
    username: string;
  } | null;
  onCancelReply?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  isSubmitting, 
  placeholder = "اكتب تعليقاً...",
  replyTo,
  onCancelReply
}) => {
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
      
      if (file.size > maxSize) {
        alert(`حجم ${type === 'image' ? 'الصورة' : 'الفيديو'} كبير جداً. الحد الأقصى ${type === 'image' ? '5' : '50'} ميجابايت`);
        return;
      }

      if ((type === 'image' && !file.type.startsWith('image/')) ||
          (type === 'video' && !file.type.startsWith('video/'))) {
        alert(`نوع الملف غير مدعوم. يرجى اختيار ${type === 'image' ? 'صورة' : 'فيديو'}`);
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

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const insertHashtag = () => {
    const hashtag = prompt('أدخل الهاشتاق (بدون رمز #):');
    if (hashtag && hashtag.trim()) {
      const cleanHashtag = hashtag.trim().replace(/^#/, '');
      setComment(prev => prev + `#${cleanHashtag} `);
    }
  };

  const renderContentWithHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const parts = text.split(hashtagRegex);
    const hashtags = text.match(hashtagRegex) || [];
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      if (hashtags[i]) {
        const hashtag = hashtags[i].slice(1);
        result.push(
          <span
            key={`hashtag-${i}`}
            className="text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/hashtag/${hashtag}`);
            }}
          >
            {hashtags[i]}
          </span>
        );
      }
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedComment = comment.trim();
    if (!trimmedComment && !selectedMedia) return;
    if (isSubmitting) return;

    try {
      await onSubmit(trimmedComment, selectedMedia || undefined, mediaType || undefined);
      setComment('');
      removeMedia();
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <div className="space-y-3 bg-gray-800/95 rounded-lg p-4">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-700/40 p-2 rounded">
          <Reply size={12} />
          <span>رد على {replyTo.username}</span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-auto text-gray-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Media Preview */}
      {mediaPreview && (
        <div className="relative inline-block">
          {mediaType === 'image' ? (
            <img 
              src={mediaPreview} 
              alt="Preview" 
              className="w-16 h-16 object-cover rounded border border-gray-600"
            />
          ) : (
            <video 
              src={mediaPreview} 
              className="w-20 h-12 object-cover rounded border border-gray-600"
              controls
            />
          )}
          <button
            type="button"
            onClick={removeMedia}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={8} className="text-white" />
          </button>
        </div>
      )}

      {/* Comment Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex-1">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={replyTo ? `رد على ${replyTo.username}...` : placeholder}
            className="bg-gray-700/60 border-gray-600/50 text-white placeholder:text-gray-500 min-h-[80px] max-h-[200px] focus:border-blue-500 focus:ring-blue-500/20 text-sm rounded-lg leading-relaxed"
            disabled={isSubmitting}
            style={{ whiteSpace: 'pre-wrap' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            اضغط زر الإرسال لإرسال التعليق
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-700/60 rounded hover:bg-gray-600 transition-colors border border-gray-600/50 hover:border-gray-500"
              disabled={isSubmitting}
              title="إضافة صورة"
            >
              <Image size={16} className="text-gray-400" />
            </button>
            
            <button
              type="button"
              onClick={insertHashtag}
              className="p-2 bg-gray-700/60 rounded hover:bg-gray-600 transition-colors border border-gray-600/50 hover:border-gray-500"
              disabled={isSubmitting}
              title="إضافة هاشتاق"
            >
              <Hash size={16} className="text-gray-400" />
            </button>
          </div>
          
          <Button
            type="submit"
            disabled={(!comment.trim() && !selectedMedia) || isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} className="ml-2" />
                إرسال
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleMediaSelect(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleMediaSelect(e, 'video')}
        className="hidden"
      />
    </div>
  );
};

export default CommentInput;
