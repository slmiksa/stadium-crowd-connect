
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, RefreshCw, Calendar, Clock, CalendarDays } from 'lucide-react';

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

interface LiveMatchManagerProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userId: string;
}

const LiveMatchManager: React.FC<LiveMatchManagerProps> = ({
  isOpen,
  onClose,
  roomId,
  userId
}) => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [yesterdayMatches, setYesterdayMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchActiveMatch();
      fetchDataForTab(activeTab);
    }
  }, [isOpen, roomId, activeTab]);

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
        description: `فشل في جلب المباريات ${status === 'live' ? 'المباشرة' : status === 'upcoming' ? 'اليوم' : 'الأمس'}`,
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
    } else if (tab === 'yesterday') {
      const matches = await fetchMatches('finished');
      setYesterdayMatches(matches);
      console.log(`📆 مباريات الأمس: ${matches.length}`);
    }
  };

  const fetchActiveMatch = async () => {
    try {
      const { data, error } = await supabase
        .from('room_live_matches')
        .select('match_data')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setActiveMatch(data.match_data as unknown as Match);
        console.log(`🎯 المباراة النشطة الحالية:`, data.match_data);
      } else {
        setActiveMatch(null);
        console.log(`ℹ️ لا توجد مباراة نشطة حالياً`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المباراة النشطة:', error);
    }
  };

  const activateMatch = async (match: Match) => {
    console.log(`🎮 تفعيل مباراة: ${match.homeTeam} vs ${match.awayTeam}`);
    try {
      // إزالة أي مباراة نشطة حالياً
      await supabase
        .from('room_live_matches')
        .update({ is_active: false })
        .eq('room_id', roomId);

      // تفعيل المباراة الجديدة
      const { error } = await supabase
        .from('room_live_matches')
        .insert({
          room_id: roomId,
          match_id: match.id,
          match_data: match as any,
          activated_by: userId
        });

      if (error) throw error;

      setActiveMatch(match);
      toast({
        title: "تم تفعيل النقل المباشر",
        description: `تم تفعيل نقل مباراة ${match.homeTeam} vs ${match.awayTeam}`,
      });

      console.log(`✅ تم تفعيل المباراة بنجاح`);
      onClose();
    } catch (error) {
      console.error('❌ خطأ في تفعيل المباراة:', error);
      toast({
        title: "خطأ",
        description: "فشل في تفعيل النقل المباشر",
        variant: "destructive"
      });
    }
  };

  const deactivateMatch = async () => {
    console.log(`🛑 إيقاف النقل المباشر`);
    try {
      await supabase
        .from('room_live_matches')
        .update({ is_active: false })
        .eq('room_id', roomId);

      setActiveMatch(null);
      toast({
        title: "تم إيقاف النقل المباشر",
        description: "تم إيقاف نقل المباراة المباشرة",
      });
      console.log(`✅ تم إيقاف النقل المباشر بنجاح`);
    } catch (error) {
      console.error('❌ خطأ في إيقاف النقل المباشر:', error);
      toast({
        title: "خطأ",
        description: "فشل في إيقاف النقل المباشر",
        variant: "destructive"
      });
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
      case 'yesterday':
        return yesterdayMatches;
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
      case 'yesterday':
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

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'live':
        return 'المباريات المباشرة';
      case 'today':
        return 'مباريات اليوم';
      case 'yesterday':
        return 'مباريات الأمس';
      default:
        return '';
    }
  };

  const getEmptyMessage = (tab: string) => {
    switch (tab) {
      case 'live':
        return 'لا توجد مباريات مباشرة حالياً';
      case 'today':
        return 'لا توجد مباريات اليوم';
      case 'yesterday':
        return 'لا توجد مباريات الأمس';
      default:
        return 'لا توجد مباريات';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-800 text-white border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">إدارة النقل المباشر</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* المباراة النشطة حالياً */}
          {activeMatch && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-400">المباراة النشطة حالياً</h3>
                <Button
                  onClick={deactivateMatch}
                  size="sm"
                  variant="destructive"
                  className="h-7"
                >
                  <Square size={14} className="ml-1" />
                  إيقاف
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{activeMatch.homeTeam}</span>
                <span className="text-sm font-bold text-white">
                  {activeMatch.homeScore ?? 0} - {activeMatch.awayScore ?? 0}
                </span>
                <span className="text-sm text-white">{activeMatch.awayTeam}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {activeMatch.competition}
              </div>
            </div>
          )}

          {/* تبويبات المباريات */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-700">
              <TabsTrigger value="live" className="text-xs data-[state=active]:bg-red-500">
                {getTabIcon('live')}
                مباشر
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs data-[state=active]:bg-blue-500">
                {getTabIcon('today')}
                اليوم
              </TabsTrigger>
              <TabsTrigger value="yesterday" className="text-xs data-[state=active]:bg-gray-500">
                {getTabIcon('yesterday')}
                الأمس
              </TabsTrigger>
            </TabsList>

            {/* رأس القائمة مع زر التحديث */}
            <div className="flex items-center justify-between mt-4">
              <h3 className="text-sm font-medium text-white">
                {getTabTitle(activeTab)}
                <span className="text-xs text-gray-400 ml-2">
                  ({getCurrentMatches().length})
                </span>
              </h3>
              <Button
                onClick={refreshCurrentTab}
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="h-7 text-gray-400 hover:text-white"
              >
                <RefreshCw size={14} className={`ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>

            <TabsContent value={activeTab} className="mt-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-zinc-700 rounded-lg p-3 animate-pulse">
                      <div className="h-4 bg-zinc-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-zinc-600 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : getCurrentMatches().length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">
                    {getEmptyMessage(activeTab)}
                  </p>
                  <Button 
                    onClick={refreshCurrentTab} 
                    size="sm" 
                    variant="outline" 
                    className="mt-3"
                  >
                    <RefreshCw size={14} className="ml-1" />
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {getCurrentMatches().map((match) => (
                    <div
                      key={match.id}
                      className="bg-zinc-700 rounded-lg p-3 hover:bg-zinc-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusBadge(match.status, match.minute)}
                          <span className="text-xs text-gray-400">
                            {formatMatchTime(match.date)}
                          </span>
                        </div>
                        <Button
                          onClick={() => activateMatch(match)}
                          size="sm"
                          disabled={activeMatch?.id === match.id}
                          className="h-7"
                        >
                          <Play size={14} className="ml-1" />
                          تفعيل
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white truncate flex-1">{match.homeTeam}</span>
                        <span className="font-bold text-white mx-3">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </span>
                        <span className="text-white truncate flex-1 text-right">{match.awayTeam}</span>
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {match.competition}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveMatchManager;
