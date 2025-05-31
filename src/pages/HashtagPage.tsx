import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import CommentItem from '@/components/CommentItem';
import { ArrowLeft, Hash, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface HashtagPostWithProfile {
  id: string;
  content: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  image_url?: string;
  user_id: string;
  type: 'post';
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  hashtag_likes: Array<{
    user_id: string;
  }>;
}

interface HashtagCommentWithProfile {
  id: string;
  content: string;
  hashtags: string[];
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  image_url?: string;
  media_url?: string;
  media_type?: string;
  type: 'comment';
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

type HashtagContent = HashtagPostWithProfile | HashtagCommentWithProfile;

const HashtagPage = () => {
  const { hashtag } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<HashtagContent[]>([]);
  const [postContent, setPostContent] = useState(`#${hashtag} `);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hashtag) {
      fetchHashtagContent();
    }
  }, [hashtag]);

  const fetchHashtagContent = async () => {
    try {
      console.log('Fetching content for hashtag:', hashtag);
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('hashtag_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          hashtag_likes (
            user_id
          )
        `)
        .contains('hashtags', [hashtag])
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching hashtag posts:', postsError);
      }

      // Fetch comments with hashtags - using multiple queries to ensure we get all comments
      let commentsData = [];
      
      // First, try to get comments that have the hashtag in the hashtags array
      const { data: hashtagCommentsData, error: hashtagCommentsError } = await supabase
        .from('hashtag_comments')
        .select(`
          id,
          content,
          hashtags,
          created_at,
          user_id,
          post_id,
          parent_id,
          image_url,
          updated_at,
          profiles!hashtag_comments_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .contains('hashtags', [hashtag])
        .order('created_at', { ascending: false });

      if (hashtagCommentsData) {
        commentsData.push(...hashtagCommentsData);
      }

      // Second, try to get comments that contain the hashtag in the content
      const { data: contentCommentsData, error: contentCommentsError } = await supabase
        .from('hashtag_comments')
        .select(`
          id,
          content,
          hashtags,
          created_at,
          user_id,
          post_id,
          parent_id,
          image_url,
          updated_at,
          profiles!hashtag_comments_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .ilike('content', `%#${hashtag}%`)
        .order('created_at', { ascending: false });

      if (contentCommentsData) {
        // Filter out duplicates based on id
        const existingIds = new Set(commentsData.map(c => c.id));
        const newComments = contentCommentsData.filter(c => !existingIds.has(c.id));
        commentsData.push(...newComments);
      }

      if (hashtagCommentsError) {
        console.error('Error fetching hashtag comments from hashtags array:', hashtagCommentsError);
      }
      if (contentCommentsError) {
        console.error('Error fetching hashtag comments from content:', contentCommentsError);
      }

      console.log('Posts data:', postsData);
      console.log('Comments data:', commentsData);

      // Combine and sort all content by creation date
      const allContent: HashtagContent[] = [];
      
      if (postsData) {
        postsData.forEach(post => {
          allContent.push({
            ...post,
            type: 'post' as const
          });
        });
      }

      if (commentsData) {
        commentsData.forEach(comment => {
          // Handle the case where profiles might be an array (from the join)
          const profileData = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
          
          allContent.push({
            ...comment,
            profiles: profileData,
            media_url: comment.image_url,
            media_type: comment.image_url ? 'image' : undefined,
            type: 'comment' as const
          });
        });
      }

      // Sort by creation date (newest first)
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('All content:', allContent);
      setContent(allContent);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postContent.trim()) return;

    setIsSubmitting(true);
    try {
      const hashtags = extractHashtags(postContent);
      
      const { error } = await supabase
        .from('hashtag_posts')
        .insert({
          content: postContent.trim(),
          hashtags,
          user_id: user.id
        });

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      setPostContent(`#${hashtag} `);
      fetchHashtagContent();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchHashtagContent();
  };

  const handleCommentClick = (commentData: HashtagCommentWithProfile) => {
    navigate(`/post/${commentData.post_id}`);
  };

  const handleProfileClick = (userId: string) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${userId}`);
    }
  };

  const postsCount = content.filter(item => item.type === 'post').length;
  const commentsCount = content.filter(item => item.type === 'comment').length;
  const isTrending = content.some(item => item.type === 'post' && (item as HashtagPostWithProfile).comments_count >= 35);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/hashtags')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <Hash size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold text-white">{hashtag}</h1>
              {isTrending && (
                <TrendingUp size={20} className="text-orange-400" />
              )}
            </div>
          </div>
        </div>

        {/* Hashtag Stats */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-zinc-400">عدد المنشورات</p>
                <p className="text-lg font-bold text-white">{postsCount}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">عدد التعليقات</p>
                <p className="text-lg font-bold text-white">{commentsCount}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">المجموع</p>
                <p className="text-lg font-bold text-blue-400">{content.length}</p>
              </div>
            </div>
            {isTrending && (
              <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
                <TrendingUp size={16} className="text-orange-400" />
                <span className="text-sm text-orange-400 font-medium">ترند</span>
              </div>
            )}
          </div>
        </div>

        {/* Create Post */}
        {user && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={`شارك شيئاً عن #${hashtag}...`}
                    className="w-full bg-transparent border-0 text-white placeholder-zinc-400 resize-none text-lg focus:outline-none min-h-24"
                    maxLength={500}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                <span className="text-sm text-zinc-400">
                  {postContent.length}/500
                </span>
                <Button
                  type="submit"
                  disabled={!postContent.trim() || isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isSubmitting ? 'جاري النشر...' : 'نشر'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Combined Content Feed */}
        <div className="space-y-6">
          {content.length === 0 ? (
            <div className="text-center py-8">
              <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">لا يوجد محتوى لهذا الهاشتاق بعد</p>
              <p className="text-zinc-500 text-sm">كن أول من ينشر!</p>
            </div>
          ) : (
            content.map((item) => {
              if (item.type === 'post') {
                const post = item as HashtagPostWithProfile;
                return (
                  <HashtagPost 
                    key={`post-${post.id}`}
                    post={{
                      ...post,
                      hashtag: hashtag || ''
                    }} 
                    onLikeChange={handlePostLikeChange}
                  />
                );
              } else {
                const comment = item as HashtagCommentWithProfile;
                return (
                  <div 
                    key={`comment-${comment.id}`}
                    className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:bg-zinc-800/70 transition-colors cursor-pointer"
                    onClick={() => handleCommentClick(comment)}
                  >
                    <CommentItem
                      comment={{
                        ...comment,
                        media_url: comment.media_url || comment.image_url,
                        media_type: comment.media_type || (comment.image_url ? 'image' : undefined)
                      }}
                      onReply={() => {}}
                      onProfileClick={handleProfileClick}
                    />
                    <div className="mt-3 pt-3 border-t border-zinc-700/30">
                      <p className="text-xs text-zinc-500">
                        تعليق على منشور • اضغط للذهاب إلى المنشور
                      </p>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HashtagPage;
