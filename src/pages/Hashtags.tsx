
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash, TrendingUp, Clock, Users, ChevronDown } from 'lucide-react';
import HashtagPost from '@/components/HashtagPost';
import InlineAd from '@/components/InlineAd';
import AdPopup from '@/components/AdPopup';

interface HashtagTrend {
  hashtag: string;
  posts_count: number;
  trend_score: number;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  hashtags: string[];
  user_id: string;
  likes_count: number | null;
  comments_count: number | null;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
    verification_status?: string;
  };
}

const Hashtags = () => {
  const [trendingHashtags, setTrendingHashtags] = useState<HashtagTrend[]>([]);
  const [recentHashtags, setRecentHashtags] = useState<HashtagTrend[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View states for showing limited/all items
  const [showAllRecentHashtags, setShowAllRecentHashtags] = useState(false);
  const [showAllTrendingPosts, setShowAllTrendingPosts] = useState(false);
  const [showAllRecentPosts, setShowAllRecentPosts] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTrendingHashtags();
    fetchRecentHashtags();
    fetchAllPosts();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_trends')
        .select('hashtag, posts_count, trend_score')
        .eq('is_trending', true)
        .order('trend_score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching trending hashtags:', error);
        return;
      }

      setTrendingHashtags(data || []);
      await fetchTrendingPosts(data?.map(h => h.hashtag) || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRecentHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_trends')
        .select('hashtag, posts_count, trend_score')
        .order('updated_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('Error fetching recent hashtags:', error);
        return;
      }

      setRecentHashtags(data || []);
      await fetchRecentPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTrendingPosts = async (hashtags: string[]) => {
    if (hashtags.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          hashtags,
          user_id,
          likes_count,
          comments_count,
          profiles!hashtag_posts_user_id_fkey (
            id,
            username,
            avatar_url,
            verification_status
          )
        `)
        .overlaps('hashtags', hashtags)
        .order('likes_count', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching trending posts:', error);
        return;
      }

      setTrendingPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          hashtags,
          user_id,
          likes_count,
          comments_count,
          profiles!hashtag_posts_user_id_fkey (
            id,
            username,
            avatar_url,
            verification_status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching recent posts:', error);
        return;
      }

      setRecentPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllPosts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          hashtags,
          user_id,
          likes_count,
          comments_count,
          profiles!hashtag_posts_user_id_fkey (
            id,
            username,
            avatar_url,
            verification_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all posts:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في جلب المنشورات',
          variant: 'destructive',
        });
        return;
      }

      setAllPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to get limited items
  const getDisplayedRecentHashtags = () => {
    return showAllRecentHashtags ? recentHashtags : recentHashtags.slice(0, 5);
  };

  const getDisplayedTrendingPosts = () => {
    return showAllTrendingPosts ? trendingPosts : trendingPosts.slice(0, 4);
  };

  const getDisplayedRecentPosts = () => {
    return showAllRecentPosts ? recentPosts : recentPosts.slice(0, 4);
  };

  const getDisplayedAllPosts = () => {
    return showAllPosts ? allPosts : allPosts.slice(0, 4);
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <AdPopup />
      
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-4xl mx-auto p-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">الهاشتاقات</h1>
            <p className="text-zinc-400">اكتشف أحدث المواضيع والهاشتاقات الرائجة</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="trending" className="w-full">
          <div className="sticky top-[120px] z-40 bg-zinc-900/95 backdrop-blur-sm pb-4">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
              <TabsTrigger value="trending" className="data-[state=active]:bg-blue-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                ترند
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-blue-600">
                <Clock className="h-4 w-4 mr-2" />
                حديثة
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
                <Hash className="h-4 w-4 mr-2" />
                جميع المنشورات
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="trending" className="space-y-6">
            {trendingHashtags.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
                    الهاشتاقات الرائجة
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    أكثر الهاشتاقات نشاطاً ومتابعة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {trendingHashtags.map((hashtag) => (
                      <div
                        key={hashtag.hashtag}
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Hash className="h-4 w-4 text-orange-400" />
                          <span className="text-white text-sm font-medium truncate">
                            {hashtag.hashtag}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-zinc-400">
                          <span>{hashtag.posts_count} منشور</span>
                          <span className="text-orange-400">🔥</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <InlineAd location="trending" className="my-6" />
            
            {trendingPosts.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
                      منشورات ترند
                    </div>
                    {trendingPosts.length > 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllTrendingPosts(!showAllTrendingPosts)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {showAllTrendingPosts ? 'إظهار أقل' : 'مشاهدة الكل'}
                        <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllTrendingPosts ? 'rotate-180' : ''}`} />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    أحدث المنشورات من الهاشتاقات الأكثر رواجاً
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getDisplayedTrendingPosts().map((post, index) => (
                    <React.Fragment key={post.id}>
                      <HashtagPost post={post} />
                      {(index + 1) % 3 === 0 && (
                        <InlineAd location="trending-posts" />
                      )}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {recentHashtags.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-400" />
                      الهاشتاقات الحديثة
                    </div>
                    {recentHashtags.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllRecentHashtags(!showAllRecentHashtags)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {showAllRecentHashtags ? 'إظهار أقل' : 'مشاهدة الكل'}
                        <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllRecentHashtags ? 'rotate-180' : ''}`} />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    آخر الهاشتاقات المحدثة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {getDisplayedRecentHashtags().map((hashtag) => (
                      <div
                        key={hashtag.hashtag}
                        className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Hash className="h-4 w-4 text-blue-400" />
                          <span className="text-white text-sm font-medium truncate">
                            {hashtag.hashtag}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          {hashtag.posts_count} منشور
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <InlineAd location="recent" className="my-6" />
            
            {recentPosts.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-400" />
                      آخر المنشورات
                    </div>
                    {recentPosts.length > 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllRecentPosts(!showAllRecentPosts)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {showAllRecentPosts ? 'إظهار أقل' : 'مشاهدة الكل'}
                        <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllRecentPosts ? 'rotate-180' : ''}`} />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    أحدث المنشورات من جميع الهاشتاقات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getDisplayedRecentPosts().map((post, index) => (
                    <React.Fragment key={post.id}>
                      <HashtagPost post={post} />
                      {(index + 1) % 4 === 0 && (
                        <InlineAd location="recent-posts" />
                      )}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <InlineAd location="all-posts" className="my-6" />
            
            {allPosts.length > 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <Hash className="h-5 w-5 mr-2 text-green-400" />
                      جميع المنشورات
                    </div>
                    {allPosts.length > 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllPosts(!showAllPosts)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {showAllPosts ? 'إظهار أقل' : 'مشاهدة الكل'}
                        <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllPosts ? 'rotate-180' : ''}`} />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    جميع المنشورات مرتبة حسب التاريخ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getDisplayedAllPosts().map((post, index) => (
                    <React.Fragment key={post.id}>
                      <HashtagPost post={post} />
                      {(index + 1) % 5 === 0 && (
                        <InlineAd location="all-posts-list" />
                      )}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="text-center py-8">
                  <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400">لا توجد منشورات بعد</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Hashtags;
