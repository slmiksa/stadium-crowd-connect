
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import ReportButton from '@/components/ReportButton';
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPostsCount, setTotalPostsCount] = useState(0);

  const POSTS_PER_PAGE = 10;

  // جلب العدد الإجمالي للمنشورات للهاشتاق
  const fetchTotalCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('hashtag_posts')
        .select('*', { count: 'exact', head: true })
        .contains('hashtags', [hashtag]);

      if (error) {
        console.error('Error fetching total count:', error);
        return;
      }

      console.log(`إجمالي المنشورات للهاشتاق #${hashtag}: ${count || 0}`);
      setTotalPostsCount(count || 0);
    } catch (error) {
      console.error('Error in fetchTotalCount:', error);
    }
  }, [hashtag]);

  // تحسين جلب البيانات مع pagination
  const fetchHashtagPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      
      const from = (pageNum - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

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
        .order('created_at', { ascending: false })
        .range(from, to);

      if (postsError) {
        console.error('Error fetching hashtag posts:', postsError);
        return;
      }

      if (postsData) {
        // تحسين جلب عدد التعليقات - جلب جميع الأعداد دفعة واحدة
        const postIds = postsData.map(post => post.id);
        const { data: commentsData } = await supabase
          .from('hashtag_comments')
          .select('post_id')
          .in('post_id', postIds);

        // حساب عدد التعليقات لكل منشور
        const commentsCounts = postIds.reduce((acc, postId) => {
          acc[postId] = commentsData?.filter(comment => comment.post_id === postId).length || 0;
          return acc;
        }, {} as Record<string, number>);

        // تحديث عدد التعليقات
        postsData.forEach(post => {
          post.comments_count = commentsCounts[post.id] || 0;
        });

        const postsWithType = postsData.map(post => ({ ...post, type: 'post' as const }));
        
        if (append) {
          setPosts(prev => [...prev, ...postsWithType]);
        } else {
          setPosts(postsWithType);
        }

        setHasMore(postsData.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error in fetchHashtagPosts:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [hashtag]);

  // تحميل البيانات الأولية
  useEffect(() => {
    if (hashtag) {
      // جلب العدد الإجمالي أولاً
      fetchTotalCount();
      fetchHashtagPosts(1, false);
      setPage(1);
      
      // إعداد الاشتراك في التحديثات الفورية
      const postsChannel = supabase
        .channel('hashtag-posts-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hashtag_posts'
          },
          (payload) => {
            // تحديث فقط إذا كان المنشور يحتوي على هاشتاق الصفحة الحالية
            if (payload.new && 
                typeof payload.new === 'object' && 
                'hashtags' in payload.new && 
                Array.isArray(payload.new.hashtags) && 
                payload.new.hashtags.includes(hashtag)) {
              fetchTotalCount(); // تحديث العدد الإجمالي
              fetchHashtagPosts(1, false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(postsChannel);
      };
    }
  }, [hashtag, fetchHashtagPosts, fetchTotalCount]);

  // تحميل المزيد من المنشورات
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHashtagPosts(nextPage, true);
    }
  }, [page, isLoadingMore, hasMore, fetchHashtagPosts]);

  // معالجة اللولبة للتحميل التلقائي
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isLoadingMore) {
        return;
      }
      loadMore();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoadingMore]);

  const extractHashtags = useCallback((text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  }, []);

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
      await fetchTotalCount();
      await fetchHashtagPosts(1, false);
      setPage(1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostLikeChange = useCallback(() => {
    // تحديث محدود - لا نعيد تحميل كل البيانات
  }, []);

  const handleRefresh = useCallback(() => {
    setPage(1);
    fetchTotalCount();
    fetchHashtagPosts(1, false);
  }, [fetchHashtagPosts, fetchTotalCount]);

  // حساب الإحصائيات
  const isTrending = totalPostsCount >= 35;

  // عرض التحميل الأولي
  if (isLoading && posts.length === 0) {
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
      <div className="max-w-6xl mx-auto p-3 md:p-6 pb-20 md:pb-32 overflow-y-auto">
        {/* Header - محسن للجوال */}
        <div className="flex items-center justify-between mb-4 md:mb-6 sticky top-0 bg-zinc-950 py-2 z-10">
          <div className="flex items-center space-x-3 space-x-reverse">
            <button 
              onClick={() => navigate('/hashtags')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} className="text-white md:w-5 md:h-5" />
            </button>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Hash size={20} className="text-blue-400 md:w-6 md:h-6" />
              <h1 className="text-lg md:text-xl font-bold text-white">{hashtag}</h1>
              {isTrending && (
                <TrendingUp size={16} className="text-orange-400 md:w-5 md:h-5" />
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={`text-white md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Hashtag Stats - محسن للجوال */}
        <div className="bg-zinc-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 md:gap-6">
              <div>
                <p className="text-xs md:text-sm text-zinc-400">عدد المنشورات</p>
                <p className="text-base md:text-lg font-bold text-white">{totalPostsCount}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-zinc-400">المحملة حالياً</p>
                <p className="text-base md:text-lg font-bold text-blue-400">{posts.length}</p>
              </div>
            </div>
            {isTrending && (
              <div className="flex items-center space-x-2 space-x-reverse bg-orange-500/20 px-2 md:px-3 py-1 rounded-full">
                <TrendingUp size={14} className="text-orange-400" />
                <span className="text-xs md:text-sm text-orange-400 font-medium">ترند</span>
              </div>
            )}
          </div>
        </div>

        {/* Create Post - محسن للجوال */}
        {user && (
          <div className="bg-zinc-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs md:text-sm font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={`شارك شيئاً عن #${hashtag}...`}
                    className="w-full bg-transparent border-0 text-white placeholder-zinc-400 resize-none text-sm md:text-lg focus:outline-none min-h-20 md:min-h-24"
                    maxLength={500}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                <span className="text-xs md:text-sm text-zinc-400">
                  {postContent.length}/500
                </span>
                <Button
                  type="submit"
                  disabled={!postContent.trim() || isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-sm md:text-base"
                  size="sm"
                >
                  {isSubmitting ? 'جاري النشر...' : 'نشر'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Feed - محسن للجوال */}
        <div className="space-y-4 md:space-y-6">
          {totalPostsCount === 0 ? (
            <div className="text-center py-8">
              <Hash size={40} className="mx-auto text-zinc-600 mb-4 md:w-12 md:h-12" />
              <p className="text-zinc-400 text-sm md:text-base">لا يوجد منشورات لهذا الهاشتاق بعد</p>
              <p className="text-zinc-500 text-xs md:text-sm">كن أول من ينشر!</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <div key={`post-${post.id}`} className="relative">
                  <HashtagPost 
                    post={{
                      ...post,
                      hashtag: hashtag || ''
                    }} 
                    onLikeChange={handlePostLikeChange}
                    hideCommentsButton={false}
                    preventClick={false}
                  />
                  {/* زر البلاغ */}
                  <div className="absolute top-2 left-2 md:top-3 md:left-3">
                    <ReportButton type="post" targetId={post.id} size="sm" />
                  </div>
                </div>
              ))}
              
              {/* Load More Button - محسن للجوال */}
              {hasMore && posts.length < totalPostsCount && (
                <div className="text-center py-6 md:py-8 mb-6 md:mb-8">
                  {isLoadingMore ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-sm md:text-base">جاري تحميل المزيد...</p>
                    </div>
                  ) : (
                    <button
                      onClick={loadMore}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
                    >
                      تحميل المزيد ({totalPostsCount - posts.length} متبقي)
                    </button>
                  )}
                </div>
              )}
              
              {posts.length >= totalPostsCount && totalPostsCount > 0 && (
                <div className="text-center py-6 md:py-8 mb-6 md:mb-8">
                  <p className="text-gray-400 text-sm md:text-base">تم عرض جميع المنشورات ({totalPostsCount})</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HashtagPage;
