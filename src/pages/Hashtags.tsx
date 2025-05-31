
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

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
}

const Hashtags = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [popularPosts, setPopularPosts] = useState<HashtagPostWithProfile[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [searchResults, setSearchResults] = useState<{posts: HashtagPostWithProfile[], hashtags: string[]}>({posts: [], hashtags: []});
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchTrendingHashtags();
    
    // Set up real-time subscription for new posts
    const channel = supabase
      .channel('hashtag-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hashtag_posts'
        },
        async (payload) => {
          console.log('New post created:', payload.new);
          // Refetch posts when a new post is created
          await fetchPosts();
          await fetchTrendingHashtags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      console.log('=== Starting fetchPosts ===');
      
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

      console.log('Raw data from database:', data);
      console.log('Total posts fetched:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('No posts found in database');
        setPopularPosts([]);
        setIsLoading(false);
        return;
      }

      // Log each post's hashtags in detail
      data.forEach((post, index) => {
        console.log(`Post ${index + 1} (ID: ${post.id}):`, {
          content: post.content.substring(0, 100),
          hashtags: post.hashtags,
          hashtagsType: typeof post.hashtags,
          hashtagsLength: post.hashtags?.length,
          isArray: Array.isArray(post.hashtags),
          likes_count: post.likes_count,
          created_at: post.created_at
        });
      });

      // Simple filter - just check if hashtags array exists and has content
      const postsWithHashtags = data.filter(post => {
        const hasHashtags = post.hashtags && 
                           Array.isArray(post.hashtags) && 
                           post.hashtags.length > 0;
        
        console.log(`Post ${post.id} filter result:`, {
          hasHashtags,
          hashtags: post.hashtags,
          content: post.content.substring(0, 50)
        });
        
        return hasHashtags;
      });
      
      console.log('=== Filter Results ===');
      console.log('Posts with hashtags:', postsWithHashtags.length);
      console.log('Filtered posts IDs:', postsWithHashtags.map(p => p.id));
      
      // Don't sort by likes for popular - just show all posts with hashtags in chronological order
      const popular = [...postsWithHashtags];
      
      console.log('=== Final Results ===');
      console.log('Popular posts count:', popular.length);
      
      setPopularPosts(popular);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrendingHashtags = async () => {
    try {
      console.log('=== Starting fetchTrendingHashtags ===');
      
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select('hashtags')
        .not('hashtags', 'is', null);

      if (error) {
        console.error('Error fetching hashtags:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No hashtag data found');
        setTrendingHashtags([]);
        return;
      }

      // Count hashtag occurrences
      const hashtagCounts = new Map<string, number>();
      
      data.forEach(post => {
        if (post.hashtags && Array.isArray(post.hashtags)) {
          post.hashtags.forEach(hashtag => {
            if (hashtag && hashtag.trim()) {
              const cleanHashtag = hashtag.trim();
              hashtagCounts.set(cleanHashtag, (hashtagCounts.get(cleanHashtag) || 0) + 1);
            }
          });
        }
      });

      // Filter hashtags with more than 35 posts and sort by count
      const trendingHashtagsArray = Array.from(hashtagCounts.entries())
        .filter(([hashtag, count]) => count > 35)
        .sort((a, b) => b[1] - a[1])
        .map(([hashtag, count]) => ({
          hashtag,
          post_count: count
        }));

      console.log('Trending hashtags (>35 posts):', trendingHashtagsArray);
      setTrendingHashtags(trendingHashtagsArray);
    } catch (error) {
      console.error('Error in fetchTrendingHashtags:', error);
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

      // Extract unique hashtags from all sources and calculate their popularity
      const hashtagCounts = new Map<string, number>();
      
      // Count hashtags from posts - only from posts that have hashtags
      postsData?.filter(post => post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0)
        .forEach(post => {
          post.hashtags?.forEach(tag => {
            if (tag.toLowerCase().includes(searchQuery)) {
              hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
            }
          });
        });

      // Count hashtags from comments
      commentsData?.forEach(comment => {
        comment.hashtags?.forEach(tag => {
          if (tag.toLowerCase().includes(searchQuery)) {
            hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
          }
        });
      });

      // Add exact match if not already included
      if (searchQuery) {
        if (!hashtagCounts.has(searchQuery)) {
          hashtagCounts.set(searchQuery, 0);
        }
      }

      // Sort hashtags by popularity and take top 10
      const sortedHashtags = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      // Filter search results to only include posts with hashtags
      const filteredPostsData = (postsData || []).filter(post => 
        post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0
      );

      setSearchResults({
        posts: filteredPostsData,
        hashtags: sortedHashtags
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePostLikeChange = () => {
    // لا نعيد تحميل المنشورات عندما تتغير الإعجابات - هذا كان يسبب اختفاء المنشورات
    // الاشتراكات في الوقت الفعلي في المنشورات الفردية ستتولى تحديث عدد الإعجابات
    console.log('Post like changed, keeping current view');
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

  const renderTrendingHashtag = (hashtagData: TrendingHashtag, index: number) => (
    <div 
      key={hashtagData.hashtag}
      onClick={() => navigate(`/hashtag/${hashtagData.hashtag}`)}
      className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:scale-105 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:border-purple-400/50 transition-colors">
            <Hash size={24} className="text-purple-400 group-hover:text-purple-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              #{hashtagData.hashtag}
            </h3>
            <p className="text-gray-400 text-sm">
              {hashtagData.post_count} منشور
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
            #{index + 1}
          </div>
          <div className="text-xs text-gray-500">الترتيب</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <TrendingUp size={16} className="text-purple-400" />
        <span>هاشتاق شائع</span>
      </div>
    </div>
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
              trendingHashtags={trendingHashtags}
              onPostLikeChange={handlePostLikeChange}
              renderPost={renderPost}
              renderTrendingHashtag={renderTrendingHashtag}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Hashtags;
