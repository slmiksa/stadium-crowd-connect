
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import HashtagPost from '@/components/HashtagPost';
import HashtagTabs from '@/components/HashtagTabs';
import { TrendingUp, Hash } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch popular posts (posts with many likes)
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
        .order('likes_count', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error fetching popular posts:', postsError);
      } else {
        setPopularPosts(popularPostsData || []);
      }

      // Fetch trending hashtags
      const { data: trendsData, error: trendsError } = await supabase
        .from('hashtag_trends')
        .select('hashtag, posts_count')
        .eq('is_trending', true)
        .order('posts_count', { ascending: false })
        .limit(10);

      if (trendsError) {
        console.error('Error fetching trending hashtags:', trendsError);
      } else {
        const formattedTrends = (trendsData || []).map(trend => ({
          hashtag: trend.hashtag,
          post_count: trend.posts_count
        }));
        setTrendingHashtags(formattedTrends);
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
    <HashtagPost 
      key={post.id} 
      post={post} 
      onLikeChange={fetchData}
    />
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
              {hashtagData.post_count} منشور
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
        <div className="text-center mb-8">
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

        <HashtagTabs 
          popularPosts={popularPosts}
          trendingHashtags={trendingHashtags}
          onPostLikeChange={fetchData}
          renderPost={renderPost}
          renderTrendingHashtag={renderTrendingHashtag}
        />
      </div>
    </div>
  );
};

export default Hashtags;
