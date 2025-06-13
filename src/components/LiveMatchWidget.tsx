
import React, { useState, useEffect } from 'react';
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
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatch();
    
    // Set up real-time subscription for match updates
    const channel = supabase
      .channel('live-match-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_live_matches',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchLiveMatch();
        }
      )
      .subscribe();

    // Update match data every minute
    const interval = setInterval(() => {
      if (matchData?.status === 'live') {
        updateMatchData();
      }
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [roomId]);

  const fetchLiveMatch = async () => {
    try {
      const { data, error } = await supabase
        .from('room_live_matches')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setMatchData(null);
        setIsLoading(false);
        return;
      }

      setMatchData(data.match_data as unknown as MatchData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching live match:', error);
      setMatchData(null);
      setIsLoading(false);
    }
  };

  const updateMatchData = async () => {
    if (!matchData) return;

    try {
      // استدعاء API المباريات للحصول على آخر التحديثات
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
          setMatchData(updatedMatch);
          
          // تحديث البيانات في قاعدة البيانات
          await supabase
            .from('room_live_matches')
            .update({ 
              match_data: updatedMatch as any,
              updated_at: new Date().toISOString()
            })
            .eq('room_id', roomId);
        }
      }
    } catch (error) {
      console.error('Error updating match data:', error);
    }
  };

  const removeLiveMatch = async () => {
    try {
      await supabase
        .from('room_live_matches')
        .update({ is_active: false })
        .eq('room_id', roomId);

      setMatchData(null);
      onRemove?.();
    } catch (error) {
      console.error('Error removing live match:', error);
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
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (!matchData) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(matchData.status)} animate-pulse`}></div>
          <span className="text-sm font-medium text-green-400">
            {getStatusText(matchData.status, matchData.minute)}
          </span>
          <span className="text-xs text-gray-400">
            {matchData.competition}
          </span>
        </div>
        {isOwnerOrModerator && (
          <Button
            onClick={removeLiveMatch}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
          >
            <X size={12} />
          </Button>
        )}
      </div>

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

      {matchData.status === 'live' && (
        <div className="flex items-center justify-center mt-2 space-x-2 space-x-reverse">
          <Clock size={12} className="text-red-400" />
          <span className="text-xs text-red-400 animate-pulse">
            مباراة مباشرة
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveMatchWidget;
