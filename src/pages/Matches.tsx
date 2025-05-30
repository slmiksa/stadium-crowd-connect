
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

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
  const { t, isRTL } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = async (status: string) => {
    console.log('Fetching matches for status:', status);
    try {
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.functions.invoke('get-football-matches', {
        method: 'GET'
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error;
      }

      console.log('Function response:', data);
      
      if (data && data.matches) {
        // فلترة المباريات حسب الحالة المطلوبة
        const filteredMatches = data.matches.filter((match: Match) => match.status === status);
        setMatches(filteredMatches);
        console.log(`Set ${filteredMatches.length} matches for status ${status}`);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(activeTab);
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMatches(activeTab);
    setIsRefreshing(false);
  };

  const handleTabChange = (newTab: 'live' | 'upcoming' | 'finished') => {
    setActiveTab(newTab);
  };

  const tabs = [
    { id: 'live' as const, label: t('liveMatches'), color: 'text-red-400' },
    { id: 'upcoming' as const, label: t('upcomingMatches'), color: 'text-blue-400' },
    { id: 'finished' as const, label: t('finishedMatches'), color: 'text-green-400' }
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('matches')}</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-zinc-400">جاري تحميل المباريات...</p>
          </div>
        )}

        {/* Matches List */}
        {!isLoading && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400">
                  {activeTab === 'live' && (isRTL ? 'لا توجد مباريات مباشرة حالياً' : 'No live matches currently')}
                  {activeTab === 'upcoming' && (isRTL ? 'لا توجد مباريات قادمة اليوم' : 'No upcoming matches today')}
                  {activeTab === 'finished' && (isRTL ? 'لا توجد مباريات منتهية اليوم' : 'No finished matches today')}
                </p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="bg-zinc-800 rounded-lg p-4 relative overflow-hidden">
                  {/* League Flag Background */}
                  {match.leagueFlag && (
                    <div className="absolute top-2 right-2 opacity-10">
                      <img src={match.leagueFlag} alt="" className="w-8 h-6 object-cover" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-400">{match.competition}</span>
                      {match.leagueFlag && (
                        <img src={match.leagueFlag} alt="" className="w-5 h-4 object-cover rounded" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatDate(match.date)} • {formatTime(match.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className={`flex-1 flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${isRTL ? 'text-right' : 'text-left'}`}>
                      {match.homeLogo && (
                        <img src={match.homeLogo} alt={match.homeTeam} className="w-8 h-8 object-contain mr-2" />
                      )}
                      <p className="font-medium text-white text-sm truncate">{match.homeTeam}</p>
                    </div>
                    
                    {/* Score/Status */}
                    <div className="mx-4 text-center min-w-[80px]">
                      {match.status === 'live' && (
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                          <span className="text-red-400 text-xs font-medium">مباشر</span>
                          {match.minute && (
                            <span className="text-red-400 text-xs ml-1">{match.minute}'</span>
                          )}
                        </div>
                      )}
                      
                      {match.homeScore !== null && match.homeScore !== undefined && 
                       match.awayScore !== null && match.awayScore !== undefined ? (
                        <div className="text-xl font-bold text-white">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="text-zinc-400 text-sm">
                          {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
                        </div>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className={`flex-1 flex items-center ${isRTL ? 'flex-row' : 'flex-row-reverse'} ${isRTL ? 'text-left' : 'text-right'}`}>
                      <p className="font-medium text-white text-sm truncate">{match.awayTeam}</p>
                      {match.awayLogo && (
                        <img src={match.awayLogo} alt={match.awayTeam} className="w-8 h-8 object-contain ml-2" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Matches;
