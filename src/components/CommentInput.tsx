
import React, { useState, useRef } from 'react';
import { Send, Image, X, Reply } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CommentInputProps {
  onSubmit: (content: string, imageFile?: File, parentId?: string) => Promise<void>;
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
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedComment = comment.trim();
    if (!trimmedComment && !selectedImage) return;
    if (isSubmitting) return;

    try {
      await onSubmit(trimmedComment, selectedImage || undefined, replyTo?.id);
      setComment('');
      removeImage();
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-3 bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-700/50 p-2 rounded">
          <Reply size={14} />
          <span>رد على {replyTo.username}</span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-auto text-zinc-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-20 h-20 object-cover rounded-lg border border-zinc-600"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      )}

      {/* Comment Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <div className="flex space-x-2 space-x-reverse gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? `رد على ${replyTo.username}...` : placeholder}
            className="flex-1 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 resize-none min-h-[60px] max-h-[120px] focus:border-blue-500 focus:ring-blue-500/20"
            disabled={isSubmitting}
            rows={2}
          />
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-zinc-700/50 rounded-lg hover:bg-zinc-600 transition-colors border border-zinc-600 hover:border-zinc-500"
              disabled={isSubmitting}
            >
              <Image size={16} className="text-zinc-300" />
            </button>
            <Button
              type="submit"
              disabled={(!comment.trim() && !selectedImage) || isSubmitting}
              className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-0"
              size="sm"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};

export default CommentInput;
