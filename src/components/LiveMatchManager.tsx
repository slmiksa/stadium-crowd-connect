
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, RefreshCw } from 'lucide-react';

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
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchLiveMatches();
      fetchActiveMatch();
    }
  }, [isOpen, roomId]);

  const fetchLiveMatches = async () => {
    setIsLoading(true);
    try {
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
        setMatches(result.matches || []);
      }
    } catch (error) {
      console.error('Error fetching live matches:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب المباريات المباشرة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
      } else {
        setActiveMatch(null);
      }
    } catch (error) {
      console.error('Error fetching active match:', error);
    }
  };

  const activateMatch = async (match: Match) => {
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

      onClose();
    } catch (error) {
      console.error('Error activating match:', error);
      toast({
        title: "خطأ",
        description: "فشل في تفعيل النقل المباشر",
        variant: "destructive"
      });
    }
  };

  const deactivateMatch = async () => {
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
    } catch (error) {
      console.error('Error deactivating match:', error);
      toast({
        title: "خطأ",
        description: "فشل في إيقاف النقل المباشر",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white">مباشر</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500 text-white">قادمة</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500 text-white">انتهت</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            </div>
          )}

          {/* قائمة المباريات المباشرة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">المباريات المباشرة</h3>
              <Button
                onClick={fetchLiveMatches}
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="h-7 text-gray-400 hover:text-white"
              >
                <RefreshCw size={14} className={`ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-700 rounded-lg p-3 animate-pulse">
                    <div className="h-4 bg-zinc-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-zinc-600 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400">لا توجد مباريات مباشرة حالياً</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-zinc-700 rounded-lg p-3 hover:bg-zinc-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusBadge(match.status)}
                        {match.minute && (
                          <span className="text-xs text-gray-400">{match.minute}'</span>
                        )}
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
                      <span className="text-white">{match.homeTeam}</span>
                      <span className="font-bold text-white">
                        {match.homeScore ?? 0} - {match.awayScore ?? 0}
                      </span>
                      <span className="text-white">{match.awayTeam}</span>
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {match.competition}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveMatchManager;
