import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import HashtagTabs from '@/components/HashtagTabs';
import { Plus, RefreshCw, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [allPosts, setAllPosts] = useState<HashtagPostWithProfile[]>([]);
  const [popularPosts, setPopularPosts] = useState<HashtagPostWithProfile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<HashtagPostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isInitialized && user) {
      fetchPosts();
      fetchUnreadNotifications();

      // Subscribe to real-time notifications
      const notificationsChannel = supabase
        .channel('notifications_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUnreadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
      };
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
      
      // الترند - المنشورات التي لديها 35 تعليق أو أكثر
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

  const fetchUnreadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error && data) {
        setUnreadNotifications(data.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        fetchPosts(),
        fetchUnreadNotifications()
      ]);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث المنشورات والتنبيهات بنجاح",
      });
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchPosts();
    fetchUnreadNotifications();
  };

  const renderPost = (post: HashtagPostWithProfile) => (
    <HashtagPost 
      key={post.id} 
      post={{
        ...post,
        hashtag: post.hashtags?.[0] || ''
      }} 
      onLikeChange={handlePostLikeChange}
    />
  );

  if (!isInitialized || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="p-6 flex items-center justify-center min-h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="p-6 text-center">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <p className="text-gray-300 text-lg">يرجى تسجيل الدخول لعرض الهاشتاقات</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-xl">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">#</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  الهاشتاقات
                </h1>
                <p className="text-gray-400 text-sm mt-1">اكتشف المواضيع الشائعة</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications Button */}
              <button
                onClick={() => navigate('/notifications')}
                className="group relative p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Bell size={20} className="text-gray-300 group-hover:text-white transition-colors relative z-10" />
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  </div>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="group relative p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <RefreshCw 
                  size={20} 
                  className={`text-gray-300 group-hover:text-white transition-colors relative z-10 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>
          </div>

          {/* Hashtag Tabs */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
            <HashtagTabs
              popularPosts={popularPosts}
              trendingPosts={trendingPosts}
              onPostLikeChange={handlePostLikeChange}
              renderPost={renderPost}
            />
          </div>

          {/* Floating Action Button */}
          <button 
            onClick={() => navigate('/create-hashtag-post')}
            className="fixed bottom-24 right-6 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-70 group-hover:opacity-90 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                <Plus size={28} className="text-white" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Hashtags;
