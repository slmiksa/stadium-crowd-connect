
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HashtagTabsProps {
  popularPosts: any[];
  trendingPosts: any[];
  onPostLikeChange: () => void;
  renderPost: (post: any) => React.ReactNode;
}

const HashtagTabs: React.FC<HashtagTabsProps> = ({ 
  popularPosts, 
  trendingPosts, 
  onPostLikeChange, 
  renderPost 
}) => {
  return (
    <Tabs defaultValue="popular" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-800 mb-6">
        <TabsTrigger 
          value="popular" 
          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
        >
          هاشتاقات شائعة
        </TabsTrigger>
        <TabsTrigger 
          value="trending"
          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
        >
          هاشتاقات ترند
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="popular" className="space-y-4">
        {popularPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">لا توجد منشورات شائعة حالياً</p>
          </div>
        ) : (
          popularPosts.map(renderPost)
        )}
      </TabsContent>
      
      <TabsContent value="trending" className="space-y-4">
        {trendingPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">لا توجد منشورات ترند حالياً</p>
          </div>
        ) : (
          trendingPosts.map(renderPost)
        )}
      </TabsContent>
    </Tabs>
  );
};

export default HashtagTabs;
