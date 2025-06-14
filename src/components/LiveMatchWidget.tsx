import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchData {
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

interface LiveMatchWidgetProps {
  roomId: string;
  isOwnerOrModerator: boolean;
  onRemove?: () => void;
}

const LiveMatchWidget: React.FC<LiveMatchWidgetProps> = ({ 
  roomId, 
  isOwnerOrModerator,
  onRemove 
}) => {
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateInterval, setUpdateInterval] = useState<number>(2);

  const updateMatchData = useCallback(async () => {
    if (!matchData) return;

    try {
      console.log('🔄 تحديث بيانات المباراة...');
      
      const response = await fetch(`https://zuvpksebzsthinjsxebt.supabase.co/functions/v1/get-football-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnBrc2VienN0aGluanN4ZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDAyMzQsImV4cCI6MjA2NDIxNjIzNH0.HPOH1UvYlwf7KeA97NtNHJAC2bXkLxVSKtLDcs2cjeU`
        },
        body: JSON.stringify({ status: 'live' })
      });

      if (response.ok) {
        const result = await response.json();
        const updatedMatch = result.matches?.find((match: any) => match.id === matchData.id);
        
        if (updatedMatch) {
          console.log('✅ تم تحديث بيانات المباراة:', updatedMatch);
          setMatchData(updatedMatch);
          
          // تحديث قاعدة البيانات
          const { error: updateError } = await supabase
            .from('room_live_matches')
            .update({ 
              match_data: updatedMatch as any,
              updated_at: new Date().toISOString()
            })
            .eq('room_id', roomId);

          if (updateError) {
            console.error('خطأ في تحديث قاعدة البيانات:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating match data:', error);
    }
  }, [matchData, roomId]);

  const fetchLiveMatch = useCallback(async () => {
    try {
      console.log('📡 جلب المباراة النشطة للغرفة:', roomId);
      
      const { data, error } = await supabase
        .from('room_live_matches')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('خطأ في جلب المباراة النشطة:', error);
        setMatchData(null);
        setIsLoading(false);
        return;
      }

      if (data) {
        const match = data.match_data as unknown as MatchData;
        console.log('✅ تم جلب المباراة النشطة:', match);
        setMatchData(match);
        
        if ((match as any).update_interval_minutes) {
          setUpdateInterval((match as any).update_interval_minutes);
        }
      } else {
        console.log('📭 لا توجد مباراة نشطة للغرفة');
        setMatchData(null);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching live match:', error);
      setMatchData(null);
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchLiveMatch();
    
    // إعداد الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel(`room-live-match-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_live_matches',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('📡 تحديث فوري من قاعدة البيانات:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.is_active) {
              const newMatchData = payload.new.match_data as unknown as MatchData;
              console.log('📡 تحديث المباراة من real-time:', newMatchData);
              setMatchData(newMatchData);
              
              if ((newMatchData as any).update_interval_minutes) {
                setUpdateInterval((newMatchData as any).update_interval_minutes);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('📡 حذف المباراة من real-time');
            setMatchData(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة الاشتراك في real-time:', status);
      });

    return () => {
      console.log('📡 إلغاء الاشتراك في real-time');
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchLiveMatch]);

  // تحديث تلقائي للمباراة حسب الفترة المحددة
  useEffect(() => {
    if (!matchData?.status || matchData.status !== 'live') return;

    const intervalMs = updateInterval * 60 * 1000;
    console.log(`⏰ إعداد تحديث تلقائي كل ${updateInterval} دقيقة`);
    
    const interval = setInterval(updateMatchData, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [matchData, updateInterval, updateMatchData]);

  const removeLiveMatch = async () => {
    try {
      console.log('🗑️ إزالة المباراة النشطة...');
      
      const { error } = await supabase
        .from('room_live_matches')
        .delete()
        .eq('room_id', roomId);

      if (!error) {
        setMatchData(null);
        onRemove?.();
        console.log('✅ تم إزالة المباراة بنجاح');
      } else {
        console.error('خطأ في إزالة المباراة:', error);
      }
    } catch (error) {
      console.error('Error removing live match:', error);
    }
  };

  const handleMatchClick = () => {
    if (matchData) {
      sessionStorage.setItem('returnToRoom', roomId);
      navigate(`/match-details/${matchData.id}`);
    }
  };

  const getStatusText = (status: string, minute?: number) => {
    switch (status) {
      case 'live':
        return minute ? `${minute}'` : 'مباشر';
      case 'upcoming':
        return 'لم تبدأ';
      case 'finished':
        return 'انتهت';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'finished':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-3 animate-pulse mb-2">
        <div className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (!matchData) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(matchData.status)} animate-pulse`}></div>
          <span className="text-sm font-medium text-green-400">
            {getStatusText(matchData.status, matchData.minute)}
          </span>
          <span className="text-xs text-gray-400">
            {matchData.competition}
          </span>
          {matchData.status === 'live' && (
            <span className="text-xs text-gray-500">
              (تحديث كل {updateInterval} دقيقة)
            </span>
          )}
        </div>
        {isOwnerOrModerator && (
          <Button
            onClick={removeLiveMatch}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
            title="إيقاف النقل المباشر (للمشرفين فقط)"
          >
            <X size={12} />
          </Button>
        )}
      </div>

      {/* منطقة المباراة القابلة للضغط */}
      <div 
        onClick={handleMatchClick}
        className="cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors"
        title="اضغط لعرض تفاصيل المباراة"
      >
        <div className="flex items-center justify-between">
          {/* الفريق المحلي */}
          <div className="flex items-center space-x-2 space-x-reverse flex-1">
            {matchData.homeLogo && (
              <img 
                src={matchData.homeLogo} 
                alt={matchData.homeTeam}
                className="w-6 h-6 object-contain"
              />
            )}
            <span className="text-white font-medium text-sm truncate">
              {matchData.homeTeam}
            </span>
          </div>

          {/* النتيجة */}
          <div className="flex items-center space-x-3 space-x-reverse mx-4">
            <div className="bg-gray-800/50 rounded-lg px-3 py-1">
              <span className="text-white font-bold text-lg">
                {matchData.homeScore ?? 0} - {matchData.awayScore ?? 0}
              </span>
            </div>
          </div>

          {/* الفريق الضيف */}
          <div className="flex items-center space-x-2 space-x-reverse flex-1 justify-end">
            <span className="text-white font-medium text-sm truncate">
              {matchData.awayTeam}
            </span>
            {matchData.awayLogo && (
              <img 
                src={matchData.awayLogo} 
                alt={matchData.awayTeam}
                className="w-6 h-6 object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {matchData.status === 'live' && (
        <div className="flex items-center justify-center mt-2 space-x-2 space-x-reverse">
          <Clock size={12} className="text-red-400" />
          <span className="text-xs text-red-400 animate-pulse">
            مباراة مباشرة - اضغط للتفاصيل
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveMatchWidget;
