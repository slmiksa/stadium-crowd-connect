import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import { ArrowLeft, Hash, TrendingUp, Info, RefreshCw } from 'lucide-react';
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

const HashtagPage = () => {
  const { hashtag } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<HashtagPostWithProfile[]>([]);
  const [postContent, setPostContent] = useState(`#${hashtag} `);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hashtag) {
      fetchHashtagPosts();
      
      // Set up real-time subscription for posts
      const postsChannel = supabase
        .channel('hashtag-posts-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hashtag_posts'
          },
          () => {
            fetchHashtagPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(postsChannel);
      };
    }
  }, [hashtag]);

  const fetchHashtagPosts = async () => {
    try {
      setIsLoading(true);
      
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
        return;
      }

      if (postsData) {
        for (const post of postsData) {
          const { count } = await supabase
            .from('hashtag_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          if (count !== null) {
            post.comments_count = count;
          }
        }
      }

      const postsWithType = postsData?.map(post => ({ ...post, type: 'post' as const })) || [];
      setPosts(postsWithType);
    } catch (error) {
      console.error('Error in fetchHashtagPosts:', error);
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
      await fetchHashtagPosts();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchHashtagPosts();
  };

  const handleProfileClick = (userId: string) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${userId}`);
    }
  };

  const handleRefresh = () => {
    fetchHashtagPosts();
  };

  const postsCount = posts.length;
  const isTrending = postsCount >= 35;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">جاري تحميل محتوى الهاشتاق...</p>
          </div>
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
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={20} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Hashtag Stats */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-zinc-400">عدد المنشورات</p>
                <p className="text-lg font-bold text-white">{postsCount}</p>
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

        {/* Info Note */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Info size={20} className="text-blue-400" />
            <p className="text-blue-100 text-sm">
              <strong>ملاحظة:</strong> يعرض هنا فقط المنشورات التي تحتوي على هذا الهاشتاق. التعليقات لا تعرض في هذه الصفحة.
            </p>
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

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">لا يوجد منشورات لهذا الهاشتاق بعد</p>
              <p className="text-zinc-500 text-sm">كن أول من ينشر!</p>
            </div>
          ) : (
            posts.map((post) => (
              <HashtagPost 
                key={`post-${post.id}`}
                post={{
                  ...post,
                  hashtag: hashtag || ''
                }} 
                onLikeChange={handlePostLikeChange}
                hideCommentsButton={true}
                preventClick={true}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HashtagPage;
