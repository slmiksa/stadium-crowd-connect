import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Clock, Users, MapPin, RefreshCw } from 'lucide-react';

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

const Matches = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching matches...');
      
      const { data, error } = await supabase.functions.invoke('get-football-matches');

      console.log('Matches response:', data, error);

      if (data && data.matches) {
        setMatches(data.matches);
      } else {
        console.log('No matches found');
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchMatches();
  };

  const handleMatchClick = (matchId: string) => {
    console.log('Navigating to match details:', matchId);
    navigate(`/match-details/${matchId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMatchesByStatus = (status: string) => {
    return matches.filter(match => match.status === status);
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

  const MatchCard = ({ match }: { match: Match }) => (
    <div 
      onClick={() => handleMatchClick(match.id)}
      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
    >
      {/* Competition Badge */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2 space-x-reverse bg-blue-600/15 border border-blue-500/25 rounded-xl px-3 py-1.5">
          {match.leagueFlag && (
            <img src={match.leagueFlag} alt="" className="w-4 h-3 object-cover rounded shadow-sm" />
          )}
          <span className="text-blue-300 font-bold text-xs">{match.competition}</span>
        </div>
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between mb-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className="w-12 h-12 bg-gray-700/40 rounded-xl p-2 mx-auto mb-2 flex items-center justify-center border border-gray-600/30">
            {match.homeLogo ? (
              <img src={match.homeLogo} alt={match.homeTeam} className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
            )}
          </div>
          <p className="font-bold text-white text-sm">{match.homeTeam}</p>
        </div>

        {/* Score and Status */}
        <div className="mx-4 text-center min-w-[100px]">
          {match.status === 'live' && (
            <div className="flex items-center justify-center mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1"></div>
              <span className="text-red-400 text-xs font-bold">مباشر</span>
              {match.minute && (
                <span className="text-red-400 text-xs mr-1 bg-red-500/20 px-1 py-0.5 rounded">
                  {match.minute}'
                </span>
              )}
            </div>
          )}
          
          <div className="bg-gray-700/50 rounded-xl px-3 py-2 border border-gray-600/40">
            {match.homeScore !== null && match.homeScore !== undefined && 
             match.awayScore !== null && match.awayScore !== undefined ? (
              <div className="text-2xl font-bold text-white">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-gray-300 text-lg font-medium">
                {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
              </div>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className="w-12 h-12 bg-gray-700/40 rounded-xl p-2 mx-auto mb-2 flex items-center justify-center border border-gray-600/30">
            {match.awayLogo ? (
              <img src={match.awayLogo} alt={match.awayTeam} className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
            )}
          </div>
          <p className="font-bold text-white text-sm">{match.awayTeam}</p>
        </div>
      </div>

      {/* Match Info */}
      <div className="border-t border-gray-700/50 pt-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-gray-400">
            <Clock size={12} className="ml-1 text-blue-400" />
            <span>{formatTime(match.date)}</span>
          </div>
          <span className={`font-medium px-2 py-1 rounded-lg text-xs ${
            match.status === 'live' ? 'text-red-400 bg-red-500/20' : 
            match.status === 'finished' ? 'text-green-400 bg-green-500/20' : 
            'text-blue-400 bg-blue-500/20'
          }`}>
            {getMatchStatus(match.status)}
          </span>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-300 text-xl font-medium">جاري تحميل المباريات...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const liveMatches = getMatchesByStatus('live');
  const upcomingMatches = getMatchesByStatus('upcoming');
  const finishedMatches = getMatchesByStatus('finished');

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        <div className="p-4 space-y-6 pb-20">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-between mb-2">
              <div></div>
              <h1 className="text-3xl font-bold text-white">المباريات</h1>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-gray-400">تابع أحدث المباريات والنتائج</p>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-1 border border-gray-700/50">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setActiveTab('live')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'live'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                مباشر ({liveMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                قادمة ({upcomingMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'finished'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                انتهت ({finishedMatches.length})
              </button>
            </div>
          </div>

          {/* Matches Content */}
          <div className="space-y-4">
            {activeTab === 'live' && (
              <>
                {liveMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔴</span>
                    </div>
                    <p className="text-gray-400 text-lg">لا توجد مباريات مباشرة الآن</p>
                  </div>
                ) : (
                  liveMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                )}
              </>
            )}

            {activeTab === 'upcoming' && (
              <>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⏰</span>
                    </div>
                    <p className="text-gray-400 text-lg">لا توجد مباريات قادمة</p>
                  </div>
                ) : (
                  upcomingMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                )}
              </>
            )}

            {activeTab === 'finished' && (
              <>
                {finishedMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-gray-400 text-lg">لا توجد مباريات منتهية</p>
                  </div>
                ) : (
                  finishedMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Matches;
