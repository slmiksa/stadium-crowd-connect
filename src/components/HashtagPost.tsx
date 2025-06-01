import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2, MoreVertical, Flag, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LikeButton from './LikeButton';

interface HashtagPostProps {
  post: {
    id: string;
    content: string;
    hashtag?: string;
    hashtags?: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    image_url?: string;
    user_id: string;
    profiles: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  };
  onLikeChange?: () => void;
  hideCommentsButton?: boolean;
  onCommentClick?: () => void;
  preventClick?: boolean;
  onPostDelete?: () => void;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ 
  post, 
  onLikeChange,
  hideCommentsButton = false,
  onCommentClick,
  preventClick = false,
  onPostDelete
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const renderContentWithHashtags = (content: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const parts = content.split(hashtagRegex);
    const hashtags = content.match(hashtagRegex) || [];
    
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

  const getAvatarGradient = () => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500'
    ];
    const index = (post.user_id?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${post.user_id}`);
    }
  };

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCommentClick) {
      onCommentClick();
    } else {
      navigate(`/comments/${post.id}`);
    }
  };

  const handlePostClick = () => {
    if (!preventClick) {
      navigate(`/post/${post.id}`);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: `منشور من ${post.profiles?.username || 'مستخدم'}`,
      text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
      url: postUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "تم مشاركة المنشور",
          description: "تم مشاركة المنشور بنجاح"
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast({
          title: "تم نسخ الرابط",
          description: "تم نسخ رابط المنشور إلى الحافظة"
        });
      }
    } catch (error) {
      console.error('خطأ في المشاركة:', error);
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({
          title: "تم نسخ الرابط", 
          description: "تم نسخ رابط المنشور إلى الحافظة"
        });
      } catch (clipboardError) {
        toast({
          title: "خطأ في المشاركة",
          description: "حدث خطأ أثناء مشاركة المنشور",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeletePost = async () => {
    if (!user || post.user_id !== user.id) {
      toast({
        title: "غير مسموح",
        description: "لا يمكنك حذف هذا المنشور",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('hashtag_posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم حذف المنشور",
        description: "تم حذف المنشور بنجاح"
      });

      if (onPostDelete) {
        onPostDelete();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المنشور",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleReportPost = async () => {
    try {
      // يمكن إضافة منطق الإبلاغ هنا
      toast({
        title: "تم الإبلاغ",
        description: "تم الإبلاغ عن المنشور وسيتم مراجعته"
      });
      setShowMenu(false);
    } catch (error) {
      toast({
        title: "خطأ في الإبلاغ",
        description: "حدث خطأ أثناء الإبلاغ عن المنشور",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      onClick={handlePostClick}
      className={`bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 ${
        preventClick ? '' : 'cursor-pointer'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <button
            onClick={handleProfileClick}
            className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center mr-3 shadow-md hover:scale-105 transition-transform duration-200`}
          >
            <span className="text-sm font-bold text-white">
              {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
          <div>
            <button
              onClick={handleProfileClick}
              className="font-bold text-white hover:text-blue-400 transition-colors text-sm"
            >
              {post.profiles?.username || 'مستخدم مجهول'}
            </button>
            <p className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-500 hover:text-white p-1 rounded transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div className="absolute left-0 top-8 bg-gray-700 rounded-lg shadow-lg z-10 min-w-[120px] overflow-hidden">
              {post.user_id === user?.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost();
                  }}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 text-right text-red-400 hover:bg-gray-600 transition-colors flex items-center text-sm"
                >
                  <Trash2 size={14} className="ml-2" />
                  {isDeleting ? 'جاري الحذف...' : 'حذف المنشور'}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportPost();
                  }}
                  className="w-full px-3 py-2 text-right text-orange-400 hover:bg-gray-600 transition-colors flex items-center text-sm"
                >
                  <Flag size={14} className="ml-2" />
                  إبلاغ عن المنشور
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-white mb-3 leading-relaxed whitespace-pre-wrap break-words">
        {renderContentWithHashtags(post.content)}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img 
            src={post.image_url} 
            alt="Post content" 
            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
        <div className="flex items-center space-x-6 space-x-reverse">
          <div onClick={(e) => e.stopPropagation()}>
            <LikeButton
              postId={post.id}
              initialLikesCount={post.likes_count}
              onLikeChange={onLikeChange}
            />
          </div>
          
          <button
            onClick={handleCommentsClick}
            className="flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-blue-400 transition-colors group"
          >
            <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{post.comments_count}</span>
          </button>
          
          <button 
            onClick={handleShareClick}
            className="flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-green-400 transition-colors group"
          >
            <Share2 size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">مشاركة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HashtagPost;
