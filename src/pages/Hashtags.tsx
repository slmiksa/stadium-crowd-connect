
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import HashtagTabs from '@/components/HashtagTabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Hash, TrendingUp, Sparkles, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [popularPosts, setPopularPosts] = useState<HashtagPostWithProfile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<HashtagPostWithProfile[]>([]);
  const [searchResults, setSearchResults] = useState<{posts: HashtagPostWithProfile[], hashtags: string[]}>({posts: [], hashtags: []});
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults({posts: [], hashtags: []});
    }
  }, [searchTerm]);

  const fetchPosts = async () => {
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      const posts = data || [];
      
      // Popular posts (most likes)
      const popular = [...posts]
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 20);
      
      // Trending posts (35+ comments)
      const trending = posts.filter(post => (post.comments_count || 0) >= 35);
      
      setPopularPosts(popular);
      setTrendingPosts(trending);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const searchQuery = searchTerm.toLowerCase().replace('#', '');
      
      // Search posts
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
        .or(`content.ilike.%${searchQuery}%,hashtags.cs.{${searchQuery}}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error searching posts:', postsError);
      }

      // Search comments for hashtags
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select('hashtags')
        .contains('hashtags', [searchQuery]);

      if (commentsError) {
        console.error('Error searching comments:', commentsError);
      }

      // Extract unique hashtags from all sources
      const allHashtags = new Set<string>();
      
      // From posts
      postsData?.forEach(post => {
        post.hashtags?.forEach(tag => {
          if (tag.toLowerCase().includes(searchQuery)) {
            allHashtags.add(tag);
          }
        });
      });

      // From comments
      commentsData?.forEach(comment => {
        comment.hashtags?.forEach(tag => {
          if (tag.toLowerCase().includes(searchQuery)) {
            allHashtags.add(tag);
          }
        });
      });

      // Add exact match if not already included
      if (searchQuery) {
        allHashtags.add(searchQuery);
      }

      setSearchResults({
        posts: postsData || [],
        hashtags: Array.from(allHashtags).slice(0, 10)
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchPosts();
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-800/50 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                  <Hash size={24} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    الهاشتاقات
                  </h1>
                  <p className="text-gray-400 text-sm">اكتشف المحتوى الشائع والمتداول</p>
                </div>
              </div>
              
              {/* Create Post Button */}
              <Button
                onClick={() => navigate('/create-hashtag-post')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Plus size={20} className="ml-2" />
                منشور جديد
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن هاشتاق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-xl h-12 text-lg backdrop-blur-sm"
              />
              {isSearching && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchTerm.trim() && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Search size={20} />
                نتائج البحث
              </h2>
              
              {/* Hashtag suggestions */}
              {searchResults.hashtags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">هاشتاقات مقترحة:</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.hashtags.map((hashtag) => (
                      <button
                        key={hashtag}
                        onClick={() => navigate(`/hashtag/${hashtag}`)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full border border-blue-500/30 transition-all duration-200 hover:scale-105"
                      >
                        #{hashtag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search results posts */}
              <div className="space-y-4">
                {searchResults.posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                      <Search size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد نتائج للبحث</p>
                      <p className="text-gray-500 text-sm mt-2">جرب البحث بكلمات مختلفة</p>
                    </div>
                  </div>
                ) : (
                  searchResults.posts.map(renderPost)
                )}
              </div>
            </div>
          )}

          {/* Main Content - only show when not searching */}
          {!searchTerm.trim() && (
            <HashtagTabs
              popularPosts={popularPosts}
              trendingPosts={trendingPosts}
              onPostLikeChange={handlePostLikeChange}
              renderPost={renderPost}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Hashtags;
