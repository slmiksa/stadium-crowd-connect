import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageCircle, Heart, Play } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import LikeButton from './LikeButton';

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
    verification_status?: string;
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
  console.log('=== COMMENT ITEM RENDER START ===');
  console.log('Comment ID:', comment.id);
  console.log('Media URL:', comment.media_url);
  console.log('Image URL:', comment.image_url);
  console.log('Media Type:', comment.media_type);
  console.log('Verification Status:', comment.profiles?.verification_status);

  // Check if this is a reply (has parent_id)
  const isReply = !!comment.parent_id;

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
    console.log('=== RENDER MEDIA FUNCTION START ===');
    
    // تجربة media_url أولاً، ثم image_url كاحتياطي
    const mediaUrl = comment.media_url || comment.image_url;
    const mediaType = comment.media_type;

    console.log('Final media URL to use:', mediaUrl);
    console.log('Final media type to use:', mediaType);

    // إذا لم توجد وسائط على الإطلاق
    if (!mediaUrl) {
      console.log('No media URL found, returning null');
      return null;
    }

    // تحديد نوع الوسائط بناءً على الامتداد إذا لم يكن محدد
    let actualMediaType = mediaType;
    if (!actualMediaType) {
      const url = mediaUrl.toLowerCase();
      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
        actualMediaType = 'image';
      } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')) {
        actualMediaType = 'video';
      } else {
        // افتراض أنها صورة إذا لم نتمكن من تحديد النوع
        actualMediaType = 'image';
      }
    }

    // إذا كان نوع الوسائط صورة أو لم يكن محدد (للتوافق مع النظام القديم)
    if (!actualMediaType || actualMediaType === 'image' || actualMediaType.startsWith('image/')) {
      console.log('Rendering image with URL:', mediaUrl);
      return (
        <div className="mt-3">
          <img
            src={mediaUrl}
            alt="صورة التعليق"
            className="max-w-full h-auto rounded-lg border border-gray-600/30 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            style={{ maxHeight: '400px', maxWidth: '100%' }}
            loading="lazy"
            onLoad={() => {
              console.log('✅ Image loaded successfully:', mediaUrl);
            }}
            onError={(e) => {
              console.error('❌ Image failed to load:', mediaUrl);
              console.error('Error event:', e);
              // إخفاء الصورة في حالة فشل التحميل
              e.currentTarget.style.display = 'none';
            }}
            onClick={() => {
              // فتح الصورة في نافذة جديدة عند النقر
              window.open(mediaUrl, '_blank');
            }}
          />
        </div>
      );
    }

    // إذا كان نوع الوسائط فيديو
    if (actualMediaType === 'video' || actualMediaType.startsWith('video/')) {
      console.log('Rendering video with URL:', mediaUrl);
      return (
        <div className="mt-3">
          <video
            src={mediaUrl}
            controls
            className="max-w-full h-auto rounded-lg border border-gray-600/30 shadow-md"
            style={{ maxHeight: '400px', maxWidth: '100%' }}
            onLoadedData={() => {
              console.log('✅ Video loaded successfully:', mediaUrl);
            }}
            onError={(e) => {
              console.error('❌ Video failed to load:', mediaUrl);
              console.error('Error event:', e);
            }}
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        </div>
      );
    }

    console.log('Unknown media type, returning null');
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
          <div className="bg-gray-800/50 rounded-2xl px-4 py-3 backdrop-blur-sm border border-gray-700/30">
            <div className="flex items-center space-x-2 space-x-reverse mb-1">
              <span 
                className="font-medium text-white text-sm cursor-pointer hover:underline"
                onClick={() => onProfileClick(comment.profiles.id)}
              >
                {comment.profiles.username}
              </span>
              <VerificationBadge 
                verificationStatus={comment.profiles.verification_status} 
                size={14} 
              />
              <span className="text-gray-400 text-xs">
                {formatTime(comment.created_at)}
              </span>
            </div>
            
            {comment.content && (
              <p className="text-gray-200 text-sm leading-relaxed mb-2">
                {renderHashtags(comment.content)}
              </p>
            )}
            
            {renderMedia()}
          </div>

          <div className="flex items-center space-x-4 space-x-reverse mt-2 px-2">
            {/* Show reply button only for main comments (not replies) */}
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id, comment.profiles.username)}
                className="text-gray-400 hover:text-blue-400 text-xs h-auto p-1"
              >
                <MessageCircle size={14} className="ml-1" />
                رد
              </Button>
            )}
            
            {/* Like button for all comments (main and replies) */}
            <LikeButton
              commentId={comment.id}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Replies - only show for main comments */}
      {!isReply && replies.length > 0 && (
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
