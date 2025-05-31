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
      <div className="min-h-screen bg-gray-900 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">المباريات</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <div className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* API Status */}
        {apiStatus === 'error' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-red-300">مشكلة في الاتصال بـ API. تحقق من إعدادات المفتاح.</p>
            </div>
          </div>
        )}

        {apiStatus === 'working' && !isLoading && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <p className="text-green-300">API يعمل بشكل طبيعي</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl p-1 mb-6">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">
              {activeTab === 'live' && 'جاري تحميل المباريات المباشرة...'}
              {activeTab === 'upcoming' && 'جاري تحميل المباريات القادمة...'}
              {activeTab === 'finished' && 'جاري تحميل المباريات المنتهية...'}
            </p>
          </div>
        )}

        {/* Matches List */}
        {!isLoading && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                  <div className="text-5xl mb-4 opacity-50">⚽</div>
                  <p className="text-gray-300 text-lg mb-2">
                    {activeTab === 'live' && 'لا توجد مباريات مباشرة حالياً'}
                    {activeTab === 'upcoming' && 'لا توجد مباريات قادمة'}
                    {activeTab === 'finished' && 'لا توجد مباريات منتهية'}
                  </p>
                  <p className="text-gray-500">جرب تحديث الصفحة أو العودة لاحقاً</p>
                </div>
              </div>
            ) : (
              matches.map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => handleMatchClick(match.id)}
                  className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-all duration-200 cursor-pointer border border-gray-700/50 hover:border-blue-500/30"
                >
                  {/* Competition Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{match.competition}</span>
                      {match.leagueFlag && (
                        <img src={match.leagueFlag} alt="" className="w-5 h-4 object-cover rounded" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(match.date)} • {formatTime(match.date)}
                    </span>
                  </div>
                  
                  {/* Match Details */}
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center text-right">
                      {match.homeLogo && (
                        <img src={match.homeLogo} alt={match.homeTeam} className="w-10 h-10 object-contain ml-3" />
                      )}
                      <p className="font-semibold text-white text-base truncate">{match.homeTeam}</p>
                    </div>
                    
                    {/* Score/Status */}
                    <div className="mx-6 text-center min-w-[100px]">
                      {match.status === 'live' && (
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1"></div>
                          <span className="text-red-400 text-xs font-semibold">مباشر</span>
                          {match.minute && (
                            <span className="text-red-400 text-xs mr-1">{match.minute}'</span>
                          )}
                        </div>
                      )}
                      
                      {match.homeScore !== null && match.homeScore !== undefined && 
                       match.awayScore !== null && match.awayScore !== undefined ? (
                        <div className="text-2xl font-bold text-white bg-gray-700/50 rounded-lg px-3 py-1">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-base bg-gray-700/30 rounded-lg px-3 py-1">
                          {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
                        </div>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex-1 flex items-center flex-row-reverse text-left">
                      <p className="font-semibold text-white text-base truncate">{match.awayTeam}</p>
                      {match.awayLogo && (
                        <img src={match.awayLogo} alt={match.awayTeam} className="w-10 h-10 object-contain mr-3" />
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
