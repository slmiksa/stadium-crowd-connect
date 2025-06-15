
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MatchChatButton from '@/components/MatchChatButton';

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
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [yesterdayMatches, setYesterdayMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    refreshCurrentTab();
  }, [activeTab]);

  const fetchMatches = async (status: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 جاري جلب المباريات - النوع: ${status}`);
      
      let apiStatus = status;
      if (status === 'today') {
        apiStatus = 'upcoming';
      } else if (status === 'yesterday') {
        apiStatus = 'finished';
      }
      
      const response = await fetch(`https://zuvpksebzsthinjsxebt.supabase.co/functions/v1/get-football-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnBrc2VienN0aGluanN4ZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDAyMzQsImV4cCI6MjA2NDIxNjIzNH0.HPOH1UvYlwf7KeA97NtNHJAC2bXkLxVSKtLDcs2cjeU`
        },
        body: JSON.stringify({ status: apiStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('خطأ في API:', errorText);
        throw new Error(`خطأ في الشبكة: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ تم جلب المباريات بنجاح:`, result);
      
      if (!result.matches || !Array.isArray(result.matches)) {
        console.warn('⚠️ البيانات المستلمة غير صحيحة:', result);
        if (result.message) {
          setError(result.message);
        }
        return [];
      }

      return result.matches;
    } catch (error) {
      console.error('❌ خطأ في جلب المباريات:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setError(`فشل في جلب المباريات: ${errorMessage}`);
      
      toast({
        title: "خطأ في الاتصال",
        description: `فشل في جلب المباريات: ${errorMessage}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveMatches = async () => {
    console.log('🔴 جلب المباريات المباشرة...');
    const matches = await fetchMatches('live');
    setLiveMatches(matches);
  };

  const fetchTodayMatches = async () => {
    console.log('📅 جلب مباريات اليوم...');
    const matches = await fetchMatches('today');
    setTodayMatches(matches);
  };

  const fetchYesterdayMatches = async () => {
    console.log('📆 جلب مباريات الأمس...');
    const matches = await fetchMatches('yesterday');
    setYesterdayMatches(matches);
  };

  const refreshCurrentTab = () => {
    setError(null);
    if (activeTab === 'live') {
      fetchLiveMatches();
    } else if (activeTab === 'today') {
      fetchTodayMatches();
    } else if (activeTab === 'yesterday') {
      fetchYesterdayMatches();
    }
  };

  const getCurrentMatches = () => {
    switch (activeTab) {
      case 'live':
        return liveMatches;
      case 'today':
        return todayMatches;
      case 'yesterday':
        return yesterdayMatches;
      default:
        return [];
    }
  };

  const getStatusBadge = (status: string, minute?: number) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white animate-pulse">{minute ? `${minute}'` : 'مباشر'}</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500 text-white">لم تبدأ</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500 text-white">انتهت</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMatchClick = (matchId: string) => {
    navigate(`/match-details/${matchId}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg border border-zinc-700/50 overflow-hidden">
            <div className="p-6 border-b border-zinc-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Trophy className="text-yellow-500" size={28} />
                  <h1 className="text-2xl font-bold text-white">المباريات</h1>
                </div>
                <Button
                  onClick={refreshCurrentTab}
                  size="sm"
                  variant="ghost"
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw size={16} className={`ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border-b border-red-500/30">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <AlertCircle size={16} className="text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-700/50 m-4 rounded-lg">
                <TabsTrigger value="live" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  <Clock size={16} className="ml-1" />
                  مباشر
                </TabsTrigger>
                <TabsTrigger value="today" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <Calendar size={16} className="ml-1" />
                  اليوم
                </TabsTrigger>
                <TabsTrigger value="yesterday" className="data-[state=active]:bg-gray-500 data-[state=active]:text-white">
                  <Calendar size={16} className="ml-1" />
                  الأمس
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="p-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-zinc-700/30 rounded-lg p-4 animate-pulse">
                        <div className="h-6 bg-zinc-600 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-zinc-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : getCurrentMatches().length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy size={48} className="mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-4">
                      {activeTab === 'live' && 'لا توجد مباريات مباشرة حالياً'}
                      {activeTab === 'today' && 'لا توجد مباريات اليوم'}
                      {activeTab === 'yesterday' && 'لا توجد مباريات الأمس'}
                    </p>
                    <Button onClick={refreshCurrentTab} className="mt-2">
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getCurrentMatches().map((match) => (
                      <div
                        key={match.id}
                        className="bg-zinc-700/30 rounded-lg p-4 hover:bg-zinc-700/50 transition-all duration-200 border border-zinc-600/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            {getStatusBadge(match.status, match.minute)}
                            <span className="text-sm text-gray-400">
                              {formatMatchTime(match.date)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-400">{match.competition}</span>
                        </div>

                        <div 
                          className="flex items-center justify-between mb-4 cursor-pointer hover:bg-zinc-600/20 rounded-lg p-2 transition-colors"
                          onClick={() => handleMatchClick(match.id)}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse flex-1">
                            {match.homeLogo && (
                              <img src={match.homeLogo} alt={match.homeTeam} className="w-8 h-8 object-contain" />
                            )}
                            <span className="text-white font-medium">{match.homeTeam}</span>
                          </div>

                          <div className="bg-zinc-800 rounded-lg px-4 py-2 mx-4">
                            <span className="text-white font-bold text-lg">
                              {match.homeScore ?? 0} - {match.awayScore ?? 0}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 space-x-reverse flex-1 justify-end">
                            <span className="text-white font-medium">{match.awayTeam}</span>
                            {match.awayLogo && (
                              <img src={match.awayLogo} alt={match.awayTeam} className="w-8 h-8 object-contain" />
                            )}
                          </div>
                        </div>

                        <MatchChatButton match={match} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Matches;
