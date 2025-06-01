
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Hash, TrendingUp, Settings, RefreshCw } from 'lucide-react';

interface HashtagStats {
  total_hashtags: number;
  trending_hashtags: number;
  top_hashtag: string;
  top_hashtag_count: number;
}

interface HashtagTrend {
  id: string;
  hashtag: string;
  posts_count: number;
  is_trending: boolean;
  updated_at: string;
}

const HashtagsManagement = () => {
  const [stats, setStats] = useState<HashtagStats | null>(null);
  const [trends, setTrends] = useState<HashtagTrend[]>([]);
  const [trendThreshold, setTrendThreshold] = useState(35);
  const [newThreshold, setNewThreshold] = useState(35);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // جلب الإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_hashtag_statistics');
      if (statsError) {
        console.error('Error fetching hashtag stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // جلب قائمة الهاشتاقات
      const { data: trendsData, error: trendsError } = await supabase
        .from('hashtag_trends')
        .select('*')
        .order('posts_count', { ascending: false })
        .limit(20);

      if (trendsError) {
        console.error('Error fetching trends:', trendsError);
      } else {
        setTrends(trendsData || []);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrendThreshold = async () => {
    if (newThreshold < 1) {
      toast({
        title: 'خطأ',
        description: 'يجب أن يكون الحد الأدنى 1 على الأقل',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_trending_threshold', {
        new_threshold: newThreshold
      });

      if (error) {
        console.error('Error updating threshold:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تحديث الحد الأدنى',
          variant: 'destructive'
        });
        return;
      }

      setTrendThreshold(newThreshold);
      toast({
        title: 'تم التحديث',
        description: `تم تحديث الحد الأدنى للترند إلى ${newThreshold} منشور`
      });

      // إعادة تحميل البيانات
      await fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="animate-pulse pb-2">
                <div className="h-3 md:h-4 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-6 md:h-8 bg-zinc-700 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg md:text-2xl font-bold text-white mb-2">إدارة الهاشتاقات</h2>
        <p className="text-zinc-400 text-sm md:text-base">إحصائيات وإعدادات الهاشتاقات والترند</p>
      </div>

      {/* إحصائيات الهاشتاقات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي الهاشتاقات
            </CardTitle>
            <Hash className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {stats?.total_hashtags || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              هاشتاقات ترند
            </CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-orange-400">
              {stats?.trending_hashtags || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              أشهر هاشتاق
            </CardTitle>
            <Hash className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-sm md:text-lg font-bold text-green-400 truncate">
              #{stats?.top_hashtag || 'لا يوجد'}
            </div>
            <div className="text-xs md:text-sm text-zinc-400">
              {stats?.top_hashtag_count || 0} منشور
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              حد الترند الحالي
            </CardTitle>
            <Settings className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-purple-400">
              {trendThreshold}
            </div>
            <div className="text-xs md:text-sm text-zinc-400">منشور</div>
          </CardContent>
        </Card>
      </div>

      {/* إعدادات حد الترند */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-white text-base md:text-lg">إعدادات حد الترند</CardTitle>
          <CardDescription className="text-zinc-400 text-sm">
            تحديد الحد الأدنى لعدد المنشورات لكي يصبح الهاشتاق ترند
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
            <div className="flex-1">
              <Label htmlFor="threshold" className="text-white text-sm">
                الحد الأدنى لعدد المنشورات
              </Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
            <Button
              onClick={updateTrendThreshold}
              disabled={isUpdating || newThreshold === trendThreshold}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {isUpdating ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </div>
          <p className="text-xs md:text-sm text-zinc-400">
            الحد الحالي: {trendThreshold} منشور. أي هاشتاق يحتوي على {trendThreshold} منشور أو أكثر سيظهر كترند.
          </p>
        </CardContent>
      </Card>

      {/* قائمة أشهر الهاشتاقات */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 md:p-6">
          <div>
            <CardTitle className="text-white text-base md:text-lg">أشهر الهاشتاقات</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              قائمة بأكثر الهاشتاقات استخداماً
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-white border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto"
          >
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-2 md:space-y-3 p-4 md:p-6 pt-0">
              {trends.length === 0 ? (
                <div className="text-center py-8">
                  <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400">لا توجد هاشتاقات بعد</p>
                </div>
              ) : (
                trends.map((trend, index) => (
                  <div
                    key={trend.id}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-zinc-700 rounded-full text-xs md:text-sm font-bold text-white flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                          <span className="text-white font-medium text-sm md:text-base truncate">#{trend.hashtag}</span>
                          {trend.is_trending && (
                            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-zinc-400">
                          {trend.posts_count} منشور
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        trend.is_trending 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {trend.is_trending ? 'ترند' : 'عادي'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HashtagsManagement;
