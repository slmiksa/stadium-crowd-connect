import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MoreVertical, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerificationBadge from './VerificationBadge';
import ReportButton from './ReportButton';
import LikeButton from './LikeButton';
import PostShareModal from './PostShareModal';

interface HashtagPostProps {
  post: {
    id: string;
    content: string;
    hashtags: string[];
    image_url?: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    shares_count?: number;
    user_id: string;
    profiles?: {
      id: string;
      username: string;
      avatar_url?: string;
      verification_status?: string;
    };
  };
  showComments?: boolean;
  onPostUpdate?: () => void;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ post, showComments = true, onPostUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = post.profiles?.id || post.user_id;
    if (userId) {
      if (userId === user?.id) {
        navigate('/profile');
      } else {
        navigate(`/user-profile/${userId}`);
      }
    }
  };

  const handleHashtagClick = (hashtag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/hashtag/${encodeURIComponent(hashtag)}`);
  };

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/comments/${post.id}`);
  };

  const handlePostClick = () => {
    navigate(`/post-details/${post.id}`);
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post.user_id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('hashtag_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: 'تم حذف المنشور بنجاح',
        description: 'تم حذف منشورك بنجاح',
      });

      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'خطأ',
        description: error.message.includes('violates row-level security policy')
            ? 'لا يمكنك حذف المنشور. قد يكون حسابك محظوراً.'
            : 'حدث خطأ أثناء حذف المنشور',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/post-details/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منشور من ${post.profiles?.username || 'مستخدم مجهول'}`,
          text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'تم نسخ الرابط',
          description: 'تم نسخ رابط المنشور إلى الحافظة',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'خطأ',
          description: 'لم نتمكن من نسخ الرابط',
          variant: 'destructive',
        });
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'الآن';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} د`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} س`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ي`;
    return `${Math.floor(diffInSeconds / 2592000)} ش`;
  };

  return (
    <>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={handlePostClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-zinc-800 rounded-lg p-1 -m-1 transition-colors"
            onClick={handleUserClick}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="bg-purple-600 text-white">
                {post.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="font-medium text-white">
                {post.profiles?.username || 'مستخدم مجهول'}
              </span>
              <VerificationBadge verificationStatus={post.profiles?.verification_status} />
              <span className="text-zinc-400 text-sm">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-zinc-800 border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              {user && user.id === post.user_id && (
                <DropdownMenuItem 
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="text-red-400 hover:text-red-300"
                >
                  {isDeleting ? 'جاري الحذف...' : 'حذف المنشور'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}>
                مشاركة متقدمة
              </DropdownMenuItem>
              {user && user.id !== post.user_id && (
                <ReportButton 
                  type="post"
                  targetId={post.id}
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-white whitespace-pre-wrap break-words mb-2">
            {post.content.split(/(\s+)/).map((word, index) => {
              if (word.startsWith('#')) {
                return (
                  <span
                    key={index}
                    className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors"
                    onClick={(e) => handleHashtagClick(word.slice(1), e)}
                  >
                    {word}
                  </span>
                );
              }
              return word;
            })}
          </p>

          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-96 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center space-x-6 space-x-reverse">
            <LikeButton 
              postId={post.id}
              initialLikesCount={post.likes_count}
              onLikeChange={onPostUpdate}
            />
            
            {showComments && (
              <button
                onClick={handleCommentsClick}
                className="flex items-center space-x-2 space-x-reverse hover:text-blue-400 transition-colors"
              >
                <MessageCircle size={18} />
                <span>{post.comments_count}</span>
              </button>
            )}

            {/* عداد المشاركات */}
            {post.shares_count !== undefined && post.shares_count > 0 && (
              <div className="flex items-center space-x-2 space-x-reverse text-green-400">
                <Share2 size={18} />
                <span>{post.shares_count}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleQuickShare}
            className="hover:text-green-400 transition-colors"
            title="مشاركة سريعة"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <PostShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postContent={post.content}
        postAuthor={post.profiles?.username || 'مستخدم مجهول'}
      />
    </>
  );
};

export default HashtagPost;
