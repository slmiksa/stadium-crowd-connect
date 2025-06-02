import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, TrendingUp, Clock, Users } from 'lucide-react';
import HashtagPost from '@/components/HashtagPost';
import InlineAd from '@/components/InlineAd';
import AdPopup from '@/components/AdPopup';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hashtags: string[];
  image_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
}

const Hashtags = () => {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrendingHashtags = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select('*')
        .order('likes_count', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching trending hashtags:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch trending hashtags.',
          variant: 'destructive',
        });
      } else {
        setTrendingPosts(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentHashtags = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent hashtags:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch recent hashtags.',
          variant: 'destructive',
        });
      } else {
        setRecentPosts(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPosts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all posts:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch all posts.',
          variant: 'destructive',
        });
      } else {
        setAllPosts(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingHashtags();
    fetchRecentHashtags();
    fetchAllPosts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <AdPopup />
      
      <div>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-white">الهاشتاقات</CardTitle>
          <CardDescription className="text-zinc-400">
            استكشف أحدث وأشهر الهاشتاقات
          </CardDescription>
        </CardHeader>
      </div>
      
      <Tabs defaultValue="trending" className="w-full">
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

        <TabsContent value="trending" className="space-y-6">
          
          <InlineAd location="trending" className="my-6" />
          
          {trendingPosts.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
                  منشورات ترند
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  أحدث المنشورات من الهاشتاقات الأكثر رواجاً
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingPosts.map((post, index) => (
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
          
          
          <InlineAd location="recent" className="my-6" />
          
          {recentPosts.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-400" />
                  آخر المنشورات
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  أحدث المنشورات من جميع الهاشتاقات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.map((post, index) => (
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
                <CardTitle className="text-white flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-green-400" />
                  جميع المنشورات
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  جميع المنشورات مرتبة حسب التاريخ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {allPosts.map((post, index) => (
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
  );
};

export default Hashtags;
