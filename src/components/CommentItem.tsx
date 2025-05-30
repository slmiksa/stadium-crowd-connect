
import React, { useState } from 'react';
import { Reply, Heart, MoreVertical } from 'lucide-react';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    image_url?: string;
    parent_id?: string;
    profiles: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  };
  replies?: CommentItemProps['comment'][];
  onReply: (commentId: string, username: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  replies = [], 
  onReply, 
  level = 0 
}) => {
  const [showReplies, setShowReplies] = useState(true);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const maxLevel = 3; // Maximum nesting level
  const shouldNest = level < maxLevel;
  const marginClass = shouldNest ? `mr-${Math.min(level * 4, 12)}` : '';

  return (
    <div className={`${marginClass}`}>
      <div className="flex space-x-3 space-x-reverse">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">
            {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {comment.profiles?.username || 'مستخدم مجهول'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  {formatTimestamp(comment.created_at)}
                </span>
                <button className="text-zinc-500 hover:text-white">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
            {comment.content && (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap mb-2">{comment.content}</p>
            )}
            {comment.image_url && (
              <img 
                src={comment.image_url} 
                alt="Comment attachment" 
                className="mt-2 max-w-full h-auto rounded-lg"
              />
            )}
            
            {/* Comment Actions */}
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-zinc-700">
              <button
                onClick={() => onReply(comment.id, comment.profiles?.username || 'مستخدم مجهول')}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-400 transition-colors"
              >
                <Reply size={12} />
                <span>رد</span>
              </button>
              <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors">
                <Heart size={12} />
                <span>إعجاب</span>
              </button>
            </div>
          </div>
          
          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {replies.slice(0, showReplies ? replies.length : 2).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  level={level + 1}
                />
              ))}
              {replies.length > 2 && !showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  عرض {replies.length - 2} ردود أخرى
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
