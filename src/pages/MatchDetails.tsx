
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { ArrowRight, Clock, Users, MapPin } from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'upcoming' | 'live' | 'finished';
  date: string;
  competition: string;
  homeLogo?: string;
  awayLogo?: string;
  leagueFlag?: string;
  minute?: number;
}

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-football-matches', {
        body: JSON.stringify({ 
          status: 'live',
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (data?.matches) {
        const foundMatch = data.matches.find((m: Match) => m.id === matchId);
        if (foundMatch) {
          setMatch(foundMatch);
        } else {
          // البحث في المباريات المنتهية والقادمة
          const dates = [
            new Date().toISOString().split('T')[0], // اليوم
            new Date(Date.now() - 86400000).toISOString().split('T')[0], // أمس
            new Date(Date.now() + 86400000).toISOString().split('T')[0] // غداً
          ];
          
          for (const date of dates) {
            for (const status of ['finished', 'upcoming']) {
              const { data: dateData } = await supabase.functions.invoke('get-football-matches', {
                body: JSON.stringify({ status, date })
              });
              
              if (dateData?.matches) {
                const foundMatch = dateData.matches.find((m: Match) => m.id === matchId);
                if (foundMatch) {
                  setMatch(foundMatch);
                  return;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMatchStatus = (status: string) => {
    switch (status) {
      case 'live':
        return 'مباشر';
      case 'upcoming':
        return 'قادمة';
      case 'finished':
        return 'انتهت';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-zinc-400">جاري تحميل تفاصيل المباراة...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div className="p-4">
          <button
            onClick={() => navigate('/matches')}
            className="flex items-center text-blue-400 mb-4"
          >
            <ArrowRight size={20} className="ml-2" />
            العودة للمباريات
          </button>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚽</div>
            <p className="text-zinc-400 text-lg">لم يتم العثور على المباراة</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/matches')}
            className="flex items-center text-blue-400"
          >
            <ArrowRight size={20} className="ml-2" />
            العودة
          </button>
          <h1 className="text-xl font-bold text-white">تفاصيل المباراة</h1>
          <div></div>
        </div>

        {/* Match Card */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          {/* Competition */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              {match.leagueFlag && (
                <img src={match.leagueFlag} alt="" className="w-6 h-4 object-cover rounded" />
              )}
              <span className="text-blue-400 font-medium">{match.competition}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between mb-6">
            {/* Home Team */}
            <div className="flex-1 text-center">
              {match.homeLogo && (
                <img src={match.homeLogo} alt={match.homeTeam} className="w-16 h-16 object-contain mx-auto mb-2" />
              )}
              <p className="font-bold text-white text-lg">{match.homeTeam}</p>
            </div>

            {/* Score */}
            <div className="mx-8 text-center">
              {match.status === 'live' && (
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-2"></div>
                  <span className="text-red-400 text-sm font-medium">مباشر</span>
                  {match.minute && (
                    <span className="text-red-400 text-sm mr-2">{match.minute}'</span>
                  )}
                </div>
              )}
              
              {match.homeScore !== null && match.homeScore !== undefined && 
               match.awayScore !== null && match.awayScore !== undefined ? (
                <div className="text-4xl font-bold text-white">
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : (
                <div className="text-2xl text-zinc-400">
                  {match.status === 'upcoming' ? 'vs' : '-'}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              {match.awayLogo && (
                <img src={match.awayLogo} alt={match.awayTeam} className="w-16 h-16 object-contain mx-auto mb-2" />
              )}
              <p className="font-bold text-white text-lg">{match.awayTeam}</p>
            </div>
          </div>

          {/* Match Info */}
          <div className="border-t border-zinc-700 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-zinc-400">
                <Clock size={16} className="ml-2" />
                <span>التوقيت: {formatTime(match.date)}</span>
              </div>
              <div className="flex items-center text-zinc-400">
                <Users size={16} className="ml-2" />
                <span>الحالة: {getMatchStatus(match.status)}</span>
              </div>
            </div>
            <div className="mt-2 text-zinc-500 text-sm">
              التاريخ: {formatDate(match.date)}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-zinc-800 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">معلومات إضافية</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• معرف المباراة: {match.id}</p>
            <p>• البطولة: {match.competition}</p>
            <p>• الحالة: {getMatchStatus(match.status)}</p>
            {match.minute && match.status === 'live' && (
              <p>• الدقيقة: {match.minute}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MatchDetails;
