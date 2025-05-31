
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Hash } from 'lucide-react';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
}

interface HashtagTabsProps {
  popularPosts: any[];
  trendingHashtags: TrendingHashtag[];
  onPostLikeChange: () => void;
  renderPost: (post: any) => React.ReactNode;
  renderTrendingHashtag: (hashtagData: TrendingHashtag, index: number) => React.ReactNode;
}

const HashtagTabs: React.FC<HashtagTabsProps> = ({ 
  popularPosts, 
  trendingHashtags, 
  onPostLikeChange, 
  renderPost,
  renderTrendingHashtag
}) => {
  return (
    <Tabs defaultValue="popular" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-900/80 backdrop-blur-md mb-6 p-1 rounded-xl border border-gray-700/30 shadow-2xl">
        <TabsTrigger 
          value="popular" 
          className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 rounded-lg transition-all duration-300 py-2 px-4 font-medium text-sm hover:text-white hover:bg-gray-700/50"
        >
          <Hash size={16} className="ml-1" />
          هاشتاقات شائعة
        </TabsTrigger>
        <TabsTrigger 
          value="trending"
          className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 rounded-lg transition-all duration-300 py-2 px-4 font-medium text-sm hover:text-white hover:bg-gray-700/50"
        >
          <TrendingUp size={16} className="ml-1" />
          هاشتاقات ترند ({trendingHashtags.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="popular" className="space-y-4 px-6 pb-6">
        {popularPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/30 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                <Hash size={40} className="text-gray-400" />
              </div>
              <h3 className="text-gray-300 text-xl font-semibold mb-3">لا توجد منشورات شائعة حالياً</h3>
              <p className="text-gray-500 text-base">كن أول من ينشر محتوى مميز واكتشف عالم الهاشتاقات!</p>
            </div>
          </div>
        ) : (
          popularPosts.map(renderPost)
        )}
      </TabsContent>
      
      <TabsContent value="trending" className="space-y-4 px-6 pb-6">
        {trendingHashtags.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/30 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                <TrendingUp size={40} className="text-gray-400" />
              </div>
              <h3 className="text-gray-300 text-xl font-semibold mb-3">لا توجد هاشتاقات ترند حالياً</h3>
              <p className="text-gray-500 text-base">الهاشتاقات التي تحصل على 35+ منشور في آخر 24 ساعة تظهر هنا</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {trendingHashtags.map((hashtagData, index) => renderTrendingHashtag(hashtagData, index))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default HashtagTabs;
