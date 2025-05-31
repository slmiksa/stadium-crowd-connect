
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import HashtagTabs from '@/components/HashtagTabs';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface HashtagPostWithProfile {
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
  };
  hashtag_likes: Array<{
    user_id: string;
  }>;
}

const Hashtags = () => {
  const { t, isRTL } = useLanguage();
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [allPosts, setAllPosts] = useState<HashtagPostWithProfile[]>([]);
  const [popularPosts, setPopularPosts] = useState<HashtagPostWithProfile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<HashtagPostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized && user) {
      fetchPosts();
    }
  }, [isInitialized, user]);

  const fetchPosts = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      const posts = data || [];
      setAllPosts(posts);
      
      // الشائعة هي كل المنشورات
      setPopularPosts(posts);
      
      // الترند هي المنشورات التي لديها 35 تعليق أو أكثر، مرتبة حسب التعليقات
      const trending = posts
        .filter(post => post.comments_count >= 35)
        .sort((a, b) => b.comments_count - a.comments_count);
      setTrendingPosts(trending);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  };

  const handlePostLikeChange = () => {
    fetchPosts();
  };

  const renderPost = (post: HashtagPostWithProfile) => (
    <HashtagPost 
      key={post.id} 
      post={post} 
      onLikeChange={handlePostLikeChange}
    />
  );

  if (!isInitialized || isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-zinc-400">يرجى تسجيل الدخول لعرض الهاشتاقات</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('hashtags')}</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* Hashtag Tabs */}
        <HashtagTabs
          popularPosts={popularPosts}
          trendingPosts={trendingPosts}
          onPostLikeChange={handlePostLikeChange}
          renderPost={renderPost}
        />

        {/* Floating Action Button */}
        <button 
          onClick={() => navigate('/create-hashtag-post')}
          className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>
    </Layout>
  );
};

export default Hashtags;
