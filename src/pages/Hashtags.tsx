
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Hash, Heart, MessageSquare, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type HashtagPost = Tables<'hashtag_posts'> & {
  profiles: Tables<'profiles'>;
  hashtag_likes: { user_id: string }[];
};

const Hashtags = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [newPost, setNewPost] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('hashtag_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashtag_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url),
          hashtag_likes(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'فشل في تحميل المنشورات' : 'Failed to load posts',
          variant: 'destructive',
        });
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

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    return text.match(hashtagRegex) || [];
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim() || !user) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى كتابة منشور صالح' : 'Please write a valid post',
        variant: 'destructive',
      });
      return;
    }

    try {
      const hashtags = extractHashtags(newPost).map(h => h.substring(1));
      
      const { error } = await supabase
        .from('hashtag_posts')
        .insert({
          user_id: user.id,
          content: newPost,
          hashtags: hashtags,
        });

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'فشل في نشر المنشور' : 'Failed to create post',
          variant: 'destructive',
        });
        return;
      }

      setNewPost('');
      toast({
        title: isRTL ? 'تم' : 'Success',
        description: isRTL ? 'تم نشر المنشور بنجاح' : 'Post created successfully',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('hashtag_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) console.error('Error unliking post:', error);
      } else {
        const { error } = await supabase
          .from('hashtag_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) console.error('Error liking post:', error);
      }
      
      // Refresh posts to update like counts
      await fetchPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredPosts = selectedHashtag 
    ? posts.filter(post => post.hashtags.includes(selectedHashtag))
    : posts;

  const allHashtags = Array.from(new Set(posts.flatMap(post => post.hashtags)));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

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

        {/* New Post */}
        {user && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={isRTL ? 'شارك رأيك مع #هاشتاغ...' : 'Share your thoughts with #hashtag...'}
              className="w-full bg-transparent text-white placeholder-zinc-400 resize-none focus:outline-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-zinc-500">
                {extractHashtags(newPost).length} hashtags
              </span>
              <button
                onClick={handlePostSubmit}
                disabled={!newPost.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRTL ? 'نشر' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Popular Hashtags */}
        {allHashtags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              {isRTL ? 'الهاشتاغات الشائعة' : 'Popular Hashtags'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedHashtag(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !selectedHashtag 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {isRTL ? 'الكل' : 'All'}
              </button>
              {allHashtags.slice(0, 10).map((hashtag) => (
                <button
                  key={hashtag}
                  onClick={() => setSelectedHashtag(hashtag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedHashtag === hashtag
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  #{hashtag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isLiked = user ? post.hashtag_likes.some(like => like.user_id === user.id) : false;
            
            return (
              <div key={post.id} className="bg-zinc-800 rounded-lg p-4">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{post.profiles?.username || 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{formatTimestamp(post.created_at!)}</p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-white mb-3 leading-relaxed">{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => handleLike(post.id, isLiked)}
                      className={`flex items-center space-x-2 transition-colors ${
                        isLiked 
                          ? 'text-red-400' 
                          : 'text-zinc-400 hover:text-red-400'
                      }`}
                    >
                      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                      <span className="text-sm">{post.likes_count || 0}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-zinc-400 hover:text-blue-400 transition-colors">
                      <MessageSquare size={18} />
                      <span className="text-sm">0</span>
                    </button>
                    <button className="text-zinc-400 hover:text-green-400 transition-colors">
                      <Share size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-8">
            <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400">
              {selectedHashtag 
                ? (isRTL ? `لا توجد منشورات لهاشتاغ #${selectedHashtag}` : `No posts for #${selectedHashtag}`)
                : (isRTL ? 'لا توجد منشورات حالياً' : 'No posts yet')
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Hashtags;
