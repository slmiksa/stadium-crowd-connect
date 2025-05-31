import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'working' | 'error' | 'no-key'>('working');

  const fetchMatches = async (status: string) => {
    console.log('Fetching matches for status:', status);
    try {
      setIsLoading(true);
      setApiStatus('working');
      
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Calling edge function with params:', { status, date: today });
      
      const { data, error } = await supabase.functions.invoke('get-football-matches', {
        body: JSON.stringify({ 
          status: status,
          date: today
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Error calling function:', error);
        setApiStatus('error');
        setMatches([]);
        return;
      }

      console.log('Function response:', data);
      
      if (data && data.matches) {
        const filteredMatches = data.matches.filter((match: Match) => {
          if (status === 'live') {
            return match.status === 'live';
          } else if (status === 'upcoming') {
            return match.status === 'upcoming';
          } else if (status === 'finished') {
            return match.status === 'finished';
          }
          return true;
        });
        
        setMatches(filteredMatches);
        console.log(`Set ${filteredMatches.length} matches for status ${status}`);
        console.log(`Total available: ${data.totalAvailable}, From target leagues: ${data.fromTargetLeagues}`);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setApiStatus('error');
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

  const handleMatchClick = (matchId: string) => {
    navigate(`/match/${matchId}`);
  };

  const tabs = [
    { id: 'live' as const, label: 'المباريات المباشرة', color: 'text-red-400' },
    { id: 'upcoming' as const, label: 'المباريات القادمة', color: 'text-blue-400' },
    { id: 'finished' as const, label: 'المباريات المنتهية', color: 'text-green-400' }
  ];

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
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        {/* Header with improved styling */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">المباريات</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="relative p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 shadow-lg"
          >
            <div className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* Enhanced API Status Indicator */}
        {apiStatus === 'error' && (
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-500/50 rounded-2xl p-5 mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-red-300 font-medium">مشكلة في الاتصال بـ API. تحقق من إعدادات المفتاح.</p>
            </div>
          </div>
        )}

        {apiStatus === 'working' && !isLoading && (
          <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/50 rounded-2xl p-5 mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <p className="text-green-300 font-medium">API يعمل بشكل طبيعي</p>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-2 mb-8 border border-gray-700/50">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl"></div>
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="relative mx-auto mb-6">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <div className="w-12 h-12 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
            </div>
            <p className="text-gray-300 text-lg font-medium">
              {activeTab === 'live' && 'جاري تحميل المباريات المباشرة...'}
              {activeTab === 'upcoming' && 'جاري تحميل المباريات القادمة...'}
              {activeTab === 'finished' && 'جاري تحميل المباريات المنتهية...'}
            </p>
          </div>
        )}

        {/* Enhanced Matches List */}
        {!isLoading && (
          <div className="space-y-6">
            {matches.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50">
                  <div className="text-6xl mb-6 opacity-60">⚽</div>
                  <p className="text-gray-300 text-xl mb-4 font-semibold">
                    {activeTab === 'live' && 'لا توجد مباريات مباشرة حالياً'}
                    {activeTab === 'upcoming' && 'لا توجد مباريات قادمة'}
                    {activeTab === 'finished' && 'لا توجد مباريات منتهية'}
                  </p>
                  <p className="text-gray-500 text-base">
                    جرب تحديث الصفحة أو العودة لاحقاً
                  </p>
                </div>
              </div>
            ) : (
              matches.map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => handleMatchClick(match.id)}
                  className="group bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden hover:from-gray-700/80 hover:to-gray-800/80 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1"
                >
                  {/* League Flag Background */}
                  {match.leagueFlag && (
                    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <img src={match.leagueFlag} alt="" className="w-10 h-8 object-cover" />
                    </div>
                  )}
                  
                  {/* Competition Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">{match.competition}</span>
                      {match.leagueFlag && (
                        <img src={match.leagueFlag} alt="" className="w-6 h-5 object-cover rounded border border-gray-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-400 font-medium">
                      {formatDate(match.date)} • {formatTime(match.date)}
                    </span>
                  </div>
                  
                  {/* Match Details */}
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center text-right">
                      {match.homeLogo && (
                        <img src={match.homeLogo} alt={match.homeTeam} className="w-12 h-12 object-contain ml-4 drop-shadow-lg" />
                      )}
                      <p className="font-bold text-white text-lg truncate group-hover:text-blue-100 transition-colors">{match.homeTeam}</p>
                    </div>
                    
                    {/* Score/Status */}
                    <div className="mx-8 text-center min-w-[120px]">
                      {match.status === 'live' && (
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-2"></div>
                          <span className="text-red-400 text-sm font-bold uppercase tracking-wider">مباشر</span>
                          {match.minute && (
                            <span className="text-red-400 text-sm font-bold mr-2">{match.minute}'</span>
                          )}
                        </div>
                      )}
                      
                      {match.homeScore !== null && match.homeScore !== undefined && 
                       match.awayScore !== null && match.awayScore !== undefined ? (
                        <div className="text-3xl font-black text-white bg-gray-700/50 rounded-xl px-4 py-2 border border-gray-600/50">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-lg font-semibold bg-gray-700/30 rounded-xl px-4 py-2">
                          {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
                        </div>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex-1 flex items-center flex-row-reverse text-left">
                      <p className="font-bold text-white text-lg truncate group-hover:text-blue-100 transition-colors">{match.awayTeam}</p>
                      {match.awayLogo && (
                        <img src={match.awayLogo} alt={match.awayTeam} className="w-12 h-12 object-contain mr-4 drop-shadow-lg" />
                      )}
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-transparent group-hover:to-blue-500/10 pointer-events-none transition-all duration-300"></div>
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
