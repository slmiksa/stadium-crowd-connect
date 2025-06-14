
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Calendar, Clock, CalendarDays, Play } from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'live' | 'upcoming' | 'finished';
  date: string;
  competition: string;
  homeLogo?: string;
  awayLogo?: string;
  minute?: number;
}

const Matches = () => {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const { toast } = useToast();

  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchMatches = async (status: string) => {
    console.log(`🔍 جاري جلب المباريات - الحالة: ${status}`);
    setIsLoading(true);
    try {
      const response = await fetch(`https://zuvpksebzsthinjsxebt.supabase.co/functions/v1/get-football-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnBrc2VienN0aGluanN4ZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDAyMzQsImV4cCI6MjA2NDIxNjIzNH0.HPOH1UvYlwf7KeA97NtNHJAC2bXkLxVSKtLDcs2cjeU`
        },
        body: JSON.stringify({ status })
      });

      console.log(`📡 استجابة API للحالة ${status}:`, response.status);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ البيانات المستلمة للحالة ${status}:`, result);
        
        if (result.success && result.matches) {
          console.log(`📊 عدد المباريات للحالة ${status}: ${result.matches.length}`);
          return result.matches;
        } else {
          console.warn(`⚠️ لا توجد مباريات للحالة ${status}`);
          return [];
        }
      } else {
        console.error(`❌ خطأ في استجابة API للحالة ${status}:`, response.status);
        return [];
      }
    } catch (error) {
      console.error(`❌ خطأ في جلب المباريات للحالة ${status}:`, error);
      toast({
        title: "خطأ",
        description: `فشل في جلب المباريات ${status === 'live' ? 'المباشرة' : status === 'upcoming' ? 'اليوم' : 'المنتهية'}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataForTab = async (tab: string) => {
    console.log(`🔄 جاري تحديث البيانات للتبويب: ${tab}`);
    
    if (tab === 'live') {
      const matches = await fetchMatches('live');
      setLiveMatches(matches);
      console.log(`🔴 المباريات المباشرة: ${matches.length}`);
    } else if (tab === 'today') {
      const matches = await fetchMatches('upcoming');
      setTodayMatches(matches);
      console.log(`📅 مباريات اليوم: ${matches.length}`);
    } else if (tab === 'finished') {
      const matches = await fetchMatches('finished');
      setFinishedMatches(matches);
      console.log(`📆 المباريات المنتهية: ${matches.length}`);
    }
  };

  const getStatusBadge = (status: string, minute?: number) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white">{minute ? `${minute}'` : 'مباشر'}</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500 text-white">لم تبدأ</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500 text-white">انتهت</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const refreshCurrentTab = () => {
    console.log(`🔄 تحديث التبويب النشط: ${activeTab}`);
    fetchDataForTab(activeTab);
  };

  const getCurrentMatches = () => {
    switch (activeTab) {
      case 'live':
        return liveMatches;
      case 'today':
        return todayMatches;
      case 'finished':
        return finishedMatches;
      default:
        return [];
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'live':
        return <Clock size={16} className="ml-1" />;
      case 'today':
        return <Calendar size={16} className="ml-1" />;
      case 'finished':
        return <CalendarDays size={16} className="ml-1" />;
      default:
        return null;
    }
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleMatchClick = (matchId: string) => {
    navigate(`/match/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">المباريات</h1>
          <p className="text-gray-400">تابع أحدث المباريات والنتائج</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800 mb-6">
            <TabsTrigger value="live" className="text-sm data-[state=active]:bg-red-500 data-[state=active]:text-white">
              {getTabIcon('live')}
              مباشر
            </TabsTrigger>
            <TabsTrigger value="today" className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              {getTabIcon('today')}
              اليوم
            </TabsTrigger>
            <TabsTrigger value="finished" className="text-sm data-[state=active]:bg-gray-500 data-[state=active]:text-white">
              {getTabIcon('finished')}
              منتهية
            </TabsTrigger>
          </TabsList>

          {/* رأس القائمة مع زر التحديث */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">
              {activeTab === 'live' && 'المباريات المباشرة'}
              {activeTab === 'today' && 'مباريات اليوم'}
              {activeTab === 'finished' && 'المباريات المنتهية'}
              <span className="text-sm text-gray-400 ml-2">
                ({getCurrentMatches().length} مباراة)
              </span>
            </h2>
            <Button
              onClick={refreshCurrentTab}
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw size={16} className={`ml-1 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 bg-zinc-700 rounded w-32"></div>
                      <div className="h-6 bg-zinc-700 rounded w-16"></div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 bg-zinc-700 rounded w-24"></div>
                      <div className="h-8 bg-zinc-700 rounded w-20"></div>
                      <div className="h-6 bg-zinc-700 rounded w-24"></div>
                    </div>
                    <div className="h-3 bg-zinc-700 rounded w-40"></div>
                  </div>
                ))}
              </div>
            ) : getCurrentMatches().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Play size={24} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {activeTab === 'live' && 'لا توجد مباريات مباشرة حالياً'}
                  {activeTab === 'today' && 'لا توجد مباريات اليوم'}
                  {activeTab === 'finished' && 'لا توجد مباريات منتهية'}
                </h3>
                <p className="text-gray-400 mb-4">
                  سنعرض المباريات المتاحة عند توفرها
                </p>
                <Button onClick={refreshCurrentTab} variant="outline">
                  <RefreshCw size={16} className="ml-2" />
                  إعادة المحاولة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getCurrentMatches().map((match) => (
                  <div
                    key={match.id}
                    onClick={() => handleMatchClick(match.id)}
                    className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors border border-zinc-700 cursor-pointer"
                  >
                    {/* رأس المباراة */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {getStatusBadge(match.status, match.minute)}
                        <span className="text-sm text-gray-400">
                          {formatMatchTime(match.date)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatMatchDate(match.date)}
                      </div>
                    </div>

                    {/* الفرق والنتيجة */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 space-x-reverse flex-1">
                        {match.homeLogo && (
                          <img 
                            src={match.homeLogo} 
                            alt={match.homeTeam}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="font-medium text-white truncate">
                          {match.homeTeam}
                        </span>
                      </div>

                      <div className="px-4">
                        <div className="text-2xl font-bold text-white text-center">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 space-x-reverse flex-1 justify-end">
                        <span className="font-medium text-white truncate">
                          {match.awayTeam}
                        </span>
                        {match.awayLogo && (
                          <img 
                            src={match.awayLogo} 
                            alt={match.awayTeam}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* البطولة */}
                    <div className="text-sm text-gray-400 text-center">
                      {match.competition}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Matches;
