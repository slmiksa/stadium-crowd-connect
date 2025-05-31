
import React, { useState } from 'react';
import { Reply, MoreVertical, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  onProfileClick?: (userId: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  replies = [], 
  onReply,
  onProfileClick,
  level = 0 
}) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const getAvatarGradient = () => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500'
    ];
    const index = (comment.user_id?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const handleProfileClick = () => {
    if (onProfileClick && comment.user_id) {
      onProfileClick(comment.user_id);
    }
  };

  const maxLevel = 3;
  const shouldNest = level < maxLevel;
  const marginClass = shouldNest ? `mr-${Math.min(level * 3, 9)}` : '';

  return (
    <>
      <div className={`${marginClass}`}>
        <div className="flex space-x-3 space-x-reverse group">
          <button
            onClick={handleProfileClick}
            className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg hover:scale-105 transition-transform duration-200`}
          >
            <span className="text-sm font-bold text-white">
              {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
          <div className="flex-1">
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/30 group-hover:bg-gray-800/90 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleProfileClick}
                  className="text-sm font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  {comment.profiles?.username || 'مستخدم مجهول'}
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-gray-500 text-xs">
                    <Clock size={12} className="ml-1" />
                    {formatTimestamp(comment.created_at)}
                  </div>
                  <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
              
              {comment.content && (
                <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3 leading-relaxed">{comment.content}</p>
              )}
              
              {comment.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden">
                  <img 
                    src={comment.image_url} 
                    alt="Comment attachment" 
                    className="max-w-full h-auto rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                </div>
              )}
              
              {/* Comment Actions */}
              <div className="flex items-center gap-6 pt-2 border-t border-gray-700/30">
                <button
                  onClick={() => onReply(comment.id, comment.profiles?.username || 'مستخدم مجهول')}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-400 transition-colors group/btn"
                >
                  <Reply size={14} className="group-hover/btn:scale-110 transition-transform" />
                  <span>رد</span>
                </button>
              </div>
            </div>
            
            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-4 space-y-3">
                {replies.slice(0, showReplies ? replies.length : 2).map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onProfileClick={onProfileClick}
                    level={level + 1}
                  />
                ))}
                {replies.length > 2 && !showReplies && (
                  <button
                    onClick={() => setShowReplies(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors mr-13"
                  >
                    عرض {replies.length - 2} ردود أخرى
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && comment.image_url && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImageModal(false);
            }
          }}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img 
              src={comment.image_url} 
              alt="Comment attachment" 
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CommentItem;
