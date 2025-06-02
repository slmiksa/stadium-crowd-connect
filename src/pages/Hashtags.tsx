
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import HashtagPost from '@/components/HashtagPost';
import HashtagTabs from '@/components/HashtagTabs';
import { TrendingUp, Hash, Search, RefreshCw, Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VerificationBadge from '@/components/VerificationBadge';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
}

interface PopularPost {
  id: string;
  content: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  image_url?: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
    verification_status?: string;
  };
}

const Hashtags = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<PopularPost[]>([]);
  const [filteredHashtags, setFilteredHashtags] = useState<TrendingHashtag[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // تصفية النتائج بناءً على البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      const filtered = popularPosts.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(query)) ||
        post.profiles.username.toLowerCase().includes(query)
      );
      setFilteredPosts(filtered);

      const filteredHashtagsList = trendingHashtags.filter(hashtag =>
        hashtag.hashtag.toLowerCase().includes(query)
      );
      setFilteredHashtags(filteredHashtagsList);
    } else {
      setFilteredPosts(popularPosts);
      setFilteredHashtags(trendingHashtags);
    }
  }, [searchQuery, popularPosts, trendingHashtags]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all popular posts (posts with many likes) - removed limit
      const { data: popularPostsData, error: postsError } = await supabase
        .from('hashtag_posts')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url,
            verification_status
          )
        `)
        .order('likes_count', { ascending: false });

      if (postsError) {
        console.error('Error fetching popular posts:', postsError);
      } else {
        setPopularPosts(popularPostsData || []);
      }

      // Fetch trending hashtags - فقط من آخر 24 ساعة
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // احصل على الهاشتاقات من المنشورات في آخر 24 ساعة
      const { data: recentPostsData, error: recentPostsError } = await supabase
        .from('hashtag_posts')
        .select('hashtags')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (recentPostsError) {
        console.error('Error fetching recent posts:', recentPostsError);
        setTrendingHashtags([]);
      } else {
        // احسب عدد المنشورات لكل هاشتاق في آخر 24 ساعة
        const hashtagCounts: { [key: string]: number } = {};
        
        recentPostsData?.forEach(post => {
          post.hashtags?.forEach((hashtag: string) => {
            hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
          });
        });

        // فلتر الهاشتاقات التي لديها 35+ منشور في آخر 24 ساعة
        const trendingList = Object.entries(hashtagCounts)
          .filter(([_, count]) => count >= 35)
          .map(([hashtag, count]) => ({
            hashtag,
            post_count: count
          }))
          .sort((a, b) => b.post_count - a.post_count)
          .slice(0, 10);

        setTrendingHashtags(trendingList);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarGradient = (userId: string) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500'
    ];
    const index = (userId?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const renderPost = (post: PopularPost) => (
    <div key={post.id} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300">
      <div className="flex items-start space-x-4 space-x-reverse mb-4">
        <div className="flex-shrink-0">
          {post.profiles?.avatar_url ? (
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.username} />
              <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(post.user_id)} text-white font-bold`}>
                {post.profiles.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarGradient(post.user_id)} rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">
                {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                if (post.user_id === user?.id) {
                  navigate('/profile');
                } else {
                  navigate(`/user-profile/${post.user_id}`);
                }
              }}
              className="font-bold text-white hover:text-blue-400 transition-colors"
            >
              {post.profiles?.username || 'مستخدم مجهول'}
            </button>
            {post.profiles?.verification_status && post.profiles.verification_status !== 'none' && (
              <VerificationBadge status={post.profiles.verification_status} />
            )}
          </div>
          <HashtagPost 
            post={{...post, hashtag: post.hashtags?.[0] || ''}} 
            onLikeChange={fetchData}
          />
        </div>
      </div>
    </div>
  );

  const renderTrendingHashtag = (hashtagData: TrendingHashtag, index: number) => (
    <div 
      key={hashtagData.hashtag}
      onClick={() => navigate(`/hashtag/${hashtagData.hashtag}`)}
      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 group-hover:scale-110 transition-transform">
            <span className="text-xl font-bold text-purple-400">#{index + 1}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse mb-1">
              <Hash className="text-purple-400" size={20} />
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                {hashtagData.hashtag}
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              {hashtagData.post_count} منشور (آخر 24 ساعة)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <TrendingUp className="text-orange-400 group-hover:scale-110 transition-transform" size={24} />
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-bold text-sm">
            ترند
          </span>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full mb-4 border border-blue-500/20">
            <Hash size={40} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            الهاشتاقات
          </h1>
          <p className="text-gray-400 text-lg">
            اكتشف أحدث الترندات والمحتوى الأكثر شعبية
          </p>
        </div>

        {/* Search and Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 px-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="ابحث في الهاشتاقات والمنشورات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800/50 border-gray-700/50 text-white pr-10 pl-4 py-3 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchData}
              variant="outline"
              className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-700/50 px-4"
            >
              <RefreshCw size={18} />
            </Button>
            <Button
              onClick={() => navigate('/create-hashtag-post')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6"
            >
              <Plus size={18} className="ml-2" />
              إنشاء منشور
            </Button>
          </div>
        </div>

        <HashtagTabs 
          popularPosts={filteredPosts}
          trendingHashtags={filteredHashtags}
          onPostLikeChange={fetchData}
          renderPost={renderPost}
          renderTrendingHashtag={renderTrendingHashtag}
        />
      </div>
    </div>
  );
};

export default Hashtags;
