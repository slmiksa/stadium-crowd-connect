
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import HashtagTabs from '@/components/HashtagTabs';
import { Search, Hash, TrendingUp, Plus, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
interface HashtagPostWithProfile {
  id: string;
  content: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  shares_count?: number;
  created_at: string;
  image_url?: string;
  user_id: string;
  type: 'post';
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
    verification_status?: string;
  };
  hashtag_likes: Array<{
    user_id: string;
  }>;
}
interface TrendingHashtag {
  hashtag: string;
  post_count: number;
}
const Hashtags = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [popularPosts, setPopularPosts] = useState<HashtagPostWithProfile[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    posts: HashtagPostWithProfile[];
    hashtags: TrendingHashtag[];
  }>({
    posts: [],
    hashtags: []
  });
  const [isSearching, setIsSearching] = useState(false);

  // جلب المنشورات الشائعة
  const fetchPopularPosts = useCallback(async () => {
    try {
      const {
        data: postsData,
        error: postsError
      } = await supabase.from('hashtag_posts').select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verification_status
          ),
          hashtag_likes (
            user_id
          )
        `).not('hashtags', 'eq', '{}')
        .order('created_at', {
        ascending: false
      }).limit(20);
      if (postsError) {
        console.error('Error fetching popular posts:', postsError);
        return;
      }
      if (postsData) {
        // جلب عدد التعليقات لكل منشور
        const postIds = postsData.map(post => post.id);
        const {
          data: commentsData
        } = await supabase.from('hashtag_comments').select('post_id').in('post_id', postIds);
        const commentsCounts = postIds.reduce((acc, postId) => {
          acc[postId] = commentsData?.filter(comment => comment.post_id === postId).length || 0;
          return acc;
        }, {} as Record<string, number>);
        postsData.forEach(post => {
          post.comments_count = commentsCounts[post.id] || 0;
        });
        const postsWithType = postsData.map(post => ({
          ...post,
          type: 'post' as const
        }));
        setPopularPosts(postsWithType);
      }
    } catch (error) {
      console.error('Error in fetchPopularPosts:', error);
    }
  }, []);

  // جلب الهاشتاقات الترند
  const fetchTrendingHashtags = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('hashtag_trends').select('hashtag, posts_count').gte('posts_count', 35).order('posts_count', {
        ascending: false
      }).limit(20);
      if (error) {
        console.error('Error fetching trending hashtags:', error);
        return;
      }
      const trendingData = (data || []).map(item => ({
        hashtag: item.hashtag,
        post_count: item.posts_count
      }));
      setTrendingHashtags(trendingData);
    } catch (error) {
      console.error('Error in fetchTrendingHashtags:', error);
    }
  }, []);

  // تحميل البيانات الأولية
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPopularPosts(), fetchTrendingHashtags()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchPopularPosts, fetchTrendingHashtags]);

  // إضافة وظيفة التحديث
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPopularPosts(), fetchTrendingHashtags()]);
    setIsRefreshing(false);
    toast({
      title: 'تم التحديث',
      description: 'تم تحديث المحتوى بنجاح'
    });
  };

  // البحث
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({
        posts: [],
        hashtags: []
      });
      return;
    }
    setIsSearching(true);
    try {
      const searchTerm = query.toLowerCase().trim();

      // البحث في المنشورات
      const {
        data: postsData,
        error: postsError
      } = await supabase.from('hashtag_posts').select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verification_status
          ),
          hashtag_likes (
            user_id
          )
        `).or(`content.ilike.%${searchTerm}%,hashtags.cs.{${searchTerm.startsWith('#') ? searchTerm.slice(1) : searchTerm}}`).order('created_at', {
        ascending: false
      }).limit(20);

      // البحث في الهاشتاقات
      const {
        data: hashtagsData,
        error: hashtagsError
      } = await supabase.from('hashtag_trends').select('hashtag, posts_count').ilike('hashtag', `%${searchTerm.startsWith('#') ? searchTerm.slice(1) : searchTerm}%`).order('posts_count', {
        ascending: false
      }).limit(10);
      if (postsError) {
        console.error('Error searching posts:', postsError);
      }
      if (hashtagsError) {
        console.error('Error searching hashtags:', hashtagsError);
      }

      // معالجة نتائج المنشورات
      let processedPosts: HashtagPostWithProfile[] = [];
      if (postsData) {
        const postIds = postsData.map(post => post.id);
        const {
          data: commentsData
        } = await supabase.from('hashtag_comments').select('post_id').in('post_id', postIds);
        const commentsCounts = postIds.reduce((acc, postId) => {
          acc[postId] = commentsData?.filter(comment => comment.post_id === postId).length || 0;
          return acc;
        }, {} as Record<string, number>);
        postsData.forEach(post => {
          post.comments_count = commentsCounts[post.id] || 0;
        });
        processedPosts = postsData.map(post => ({
          ...post,
          type: 'post' as const
        }));
      }

      // معالجة نتائج الهاشتاقات
      const processedHashtags = (hashtagsData || []).map(item => ({
        hashtag: item.hashtag,
        post_count: item.posts_count
      }));
      setSearchResults({
        posts: processedPosts,
        hashtags: processedHashtags
      });
    } catch (error) {
      console.error('Error in search:', error);
      toast({
        title: 'خطأ في البحث',
        description: 'حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // تأخير البحث
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults({
          posts: [],
          hashtags: []
        });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);
  const handlePostLikeChange = useCallback(() => {
    // إعادة جلب البيانات عند تغيير الإعجابات
    fetchPopularPosts();
  }, [fetchPopularPosts]);
  const renderPost = (post: HashtagPostWithProfile) => <HashtagPost key={post.id} post={post} onPostUpdate={handlePostLikeChange} showComments={true} />;
  const renderTrendingHashtag = (hashtagData: TrendingHashtag, index: number) => <div key={hashtagData.hashtag} onClick={() => navigate(`/hashtag/${encodeURIComponent(hashtagData.hashtag)}`)} className="group relative overflow-hidden bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Hash size={24} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
              #{hashtagData.hashtag}
            </h3>
            <p className="text-gray-400 text-sm">
              {hashtagData.post_count} منشور
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-2xl font-bold text-blue-400">#{index + 1}</span>
          <TrendingUp size={20} className="text-orange-400" />
        </div>
      </div>
    </div>;
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults({
      posts: [],
      hashtags: []
    });
  };
  if (isLoading) {
    return <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="max-w-6xl mx-auto p-3 md:p-6 pb-20 md:pb-32 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 sticky top-0 z-10 my-[7px] py-[3px] bg-[#1b3340] mx-px px-[22px] rounded-3xl">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Hash size={24} className="text-blue-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white">الهاشتاقات</h1>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse py-0 rounded-sm px-[6px] mx-[13px] my-[16px]">
            <Button onClick={handleRefresh} disabled={isRefreshing} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-slate-50">
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={() => setShowSearch(!showSearch)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-slate-50">
              <Search size={18} />
            </Button>
            <Button onClick={() => navigate('/create-hashtag-post')} className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-slate-50">
              <Plus size={18} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && <div className="mb-6 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث عن منشور أو هاشتاق..." className="bg-zinc-900 border-zinc-600 text-white pr-10 pl-10" />
              {searchQuery && <button onClick={clearSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>}
            </div>
            {isSearching && <div className="flex items-center justify-center mt-4">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="mr-2 text-zinc-400">جاري البحث...</span>
              </div>}
          </div>}

        {/* Search Results */}
        {showSearch && searchQuery && !isSearching && <div className="mb-6 space-y-6">
            <h2 className="text-lg font-bold text-white">نتائج البحث عن "{searchQuery}"</h2>
            
            {/* Hashtags Results */}
            {searchResults.hashtags.length > 0 && <div>
                <h3 className="text-md font-medium text-zinc-300 mb-3 flex items-center space-x-2 space-x-reverse">
                  <Hash size={18} />
                  <span>الهاشتاقات ({searchResults.hashtags.length})</span>
                </h3>
                <div className="grid gap-3">
                  {searchResults.hashtags.map((hashtag, index) => renderTrendingHashtag(hashtag, index))}
                </div>
              </div>}

            {/* Posts Results */}
            {searchResults.posts.length > 0 && <div>
                <h3 className="text-md font-medium text-zinc-300 mb-3">
                  المنشورات ({searchResults.posts.length})
                </h3>
                <div className="space-y-4">
                  {searchResults.posts.map(renderPost)}
                </div>
              </div>}

            {/* No Results */}
            {searchResults.posts.length === 0 && searchResults.hashtags.length === 0 && <div className="text-center py-8">
                <Search size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">لا توجد نتائج للبحث عن "{searchQuery}"</p>
                <p className="text-zinc-500 text-sm">جرب كلمات مختلفة أو تأكد من الإملاء</p>
              </div>}
          </div>}

        {/* Main Content - Hide when showing search results */}
        {!showSearch || !searchQuery ? <HashtagTabs popularPosts={popularPosts} trendingHashtags={trendingHashtags} onPostLikeChange={handlePostLikeChange} renderPost={renderPost} renderTrendingHashtag={renderTrendingHashtag} /> : null}
      </div>
    </Layout>;
};
export default Hashtags;
