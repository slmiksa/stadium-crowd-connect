
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Heart, MessageCircle, Share2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HashtagPostWithProfile {
  id: string;
  content: string;
  hashtags: string[];
  likes_count: number;
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
  const [posts, setPosts] = useState<HashtagPostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      fetchPosts();
    }
  }, [isInitialized]);

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

      setPosts(data || []);
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  if (!isInitialized || isLoading) {
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

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">
                {isRTL ? 'لا توجد منشورات حالياً' : 'No posts yet'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-zinc-800 rounded-lg p-4">
                {/* Post Header */}
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-white">
                      {post.profiles?.username || 'مستخدم مجهول'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {formatTimestamp(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-white mb-2">{post.content}</p>
                  
                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.hashtags.map((hashtag, index) => (
                        <span key={index} className="text-blue-400 text-sm">
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Image */}
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post" 
                      className="w-full h-48 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-zinc-400 hover:text-red-400 transition-colors">
                      <Heart size={18} />
                      <span className="text-sm">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-zinc-400 hover:text-blue-400 transition-colors">
                      <MessageCircle size={18} />
                      <span className="text-sm">0</span>
                    </button>
                  </div>
                  <button className="text-zinc-400 hover:text-blue-400 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <button className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
          <Plus size={24} className="text-white" />
        </button>
      </div>
    </Layout>
  );
};

export default Hashtags;
