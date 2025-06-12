
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageCircle, Heart, Play } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  media_url?: string;
  media_type?: string;
  parent_id?: string;
  hashtags?: string[];
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  onReply: (commentId: string, username: string) => void;
  onProfileClick: (userId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  replies = [],
  onReply,
  onProfileClick
}) => {
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch (error) {
      return 'منذ وقت قريب';
    }
  };

  const renderHashtags = (content: string) => {
    if (!content) return content;
    
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const parts = content.split(hashtagRegex);
    const hashtags = content.match(hashtagRegex) || [];
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      result.push(parts[i]);
      if (hashtags[i]) {
        result.push(
          <span key={i} className="text-blue-400 font-medium">
            {hashtags[i]}
          </span>
        );
      }
    }
    
    return result;
  };

  const renderMedia = () => {
    const mediaUrl = comment.media_url || comment.image_url;
    const mediaType = comment.media_type;

    if (!mediaUrl) return null;

    if (mediaType?.startsWith('image/') || (!mediaType && mediaUrl)) {
      return (
        <div className="mt-3">
          <img
            src={mediaUrl}
            alt="صورة التعليق"
            className="max-w-full h-auto rounded-lg border border-gray-600/30"
            style={{ maxHeight: '300px' }}
          />
        </div>
      );
    }

    if (mediaType?.startsWith('video/')) {
      return (
        <div className="mt-3">
          <video
            src={mediaUrl}
            controls
            className="max-w-full h-auto rounded-lg border border-gray-600/30"
            style={{ maxHeight: '300px' }}
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Main Comment */}
      <div className="flex space-x-3 space-x-reverse">
        <Avatar 
          className="w-10 h-10 cursor-pointer"
          onClick={() => onProfileClick(comment.profiles.id)}
        >
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback className="bg-purple-600 text-white">
            {comment.profiles.username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-800/50 rounded-2xl px-4 py-3">
            <div className="flex items-center space-x-2 space-x-reverse mb-1">
              <span 
                className="font-medium text-white text-sm cursor-pointer hover:underline"
                onClick={() => onProfileClick(comment.profiles.id)}
              >
                {comment.profiles.username}
              </span>
              <span className="text-gray-400 text-xs">
                {formatTime(comment.created_at)}
              </span>
            </div>
            
            {comment.content && (
              <p className="text-gray-200 text-sm leading-relaxed">
                {renderHashtags(comment.content)}
              </p>
            )}
            
            {renderMedia()}
          </div>

          <div className="flex items-center space-x-4 space-x-reverse mt-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id, comment.profiles.username)}
              className="text-gray-400 hover:text-blue-400 text-xs h-auto p-1"
            >
              <MessageCircle size={14} className="ml-1" />
              رد
            </Button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mr-8 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
