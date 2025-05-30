
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
}

const Matches = () => {
  const { t, isRTL } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - in real app, this would come from API
  const mockMatches: Match[] = [
    {
      id: '1',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      homeScore: 2,
      awayScore: 1,
      status: 'live',
      date: '2024-05-30T20:00:00Z',
      competition: 'La Liga'
    },
    {
      id: '2',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      status: 'upcoming',
      date: '2024-05-31T15:00:00Z',
      competition: 'Premier League'
    },
    {
      id: '3',
      homeTeam: 'Chelsea',
      awayTeam: 'Arsenal',
      homeScore: 0,
      awayScore: 2,
      status: 'finished',
      date: '2024-05-29T17:30:00Z',
      competition: 'Premier League'
    }
  ];

  useEffect(() => {
    setMatches(mockMatches);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setMatches([...mockMatches]);
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredMatches = matches.filter(match => match.status === activeTab);

  const tabs = [
    { id: 'live' as const, label: t('liveMatches'), color: 'text-red-400' },
    { id: 'upcoming' as const, label: t('upcomingMatches'), color: 'text-blue-400' },
    { id: 'finished' as const, label: t('finishedMatches'), color: 'text-green-400' }
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('matches')}</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
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
              onClick={() => setActiveTab(tab.id)}
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

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">
                {activeTab === 'live' && (isRTL ? 'لا توجد مباريات مباشرة حالياً' : 'No live matches currently')}
                {activeTab === 'upcoming' && (isRTL ? 'لا توجد مباريات قادمة' : 'No upcoming matches')}
                {activeTab === 'finished' && (isRTL ? 'لا توجد مباريات منتهية' : 'No finished matches')}
              </p>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div key={match.id} className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{match.competition}</span>
                  <span className="text-xs text-zinc-500">{formatTime(match.date)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="font-medium text-white">{match.homeTeam}</p>
                  </div>
                  
                  <div className="mx-4 text-center">
                    {match.status === 'live' && (
                      <div className="flex items-center justify-center mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                        <span className="text-red-400 text-xs font-medium">LIVE</span>
                      </div>
                    )}
                    
                    {match.homeScore !== undefined && match.awayScore !== undefined ? (
                      <div className="text-xl font-bold text-white">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    ) : (
                      <div className="text-zinc-400 text-sm">vs</div>
                    )}
                  </div>
                  
                  <div className={`flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                    <p className="font-medium text-white">{match.awayTeam}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Matches;
