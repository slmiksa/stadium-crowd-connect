
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Hash } from 'lucide-react';

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
      <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 backdrop-blur-sm mb-6 p-1 rounded-xl border border-gray-700/50">
        <TabsTrigger 
          value="popular" 
          className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-300 rounded-lg transition-all duration-300 py-3 px-6 font-medium"
        >
          <Hash size={18} className="ml-2" />
          هاشتاقات شائعة
        </TabsTrigger>
        <TabsTrigger 
          value="trending"
          className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-300 rounded-lg transition-all duration-300 py-3 px-6 font-medium"
        >
          <TrendingUp size={18} className="ml-2" />
          هاشتاقات ترند
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="popular" className="space-y-4 px-6 pb-6">
        {popularPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg">لا توجد منشورات شائعة حالياً</p>
              <p className="text-gray-500 text-sm mt-2">كن أول من ينشر محتوى مميز!</p>
            </div>
          </div>
        ) : (
          popularPosts.map(renderPost)
        )}
      </TabsContent>
      
      <TabsContent value="trending" className="space-y-4 px-6 pb-6">
        {trendingPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg">لا توجد منشورات ترند حالياً</p>
              <p className="text-gray-500 text-sm mt-2">المنشورات التي تحصل على 35+ تعليق تظهر هنا</p>
            </div>
          </div>
        ) : (
          trendingPosts.map(renderPost)
        )}
      </TabsContent>
    </Tabs>
  );
};

export default HashtagTabs;
