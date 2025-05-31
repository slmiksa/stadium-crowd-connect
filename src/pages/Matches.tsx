
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
        body: { 
          status: status,
          date: today
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
        setMatches(data.matches);
        console.log(`Set ${data.matches.length} matches for status ${status}`);
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
        {/* Header with better styling */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">المباريات</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
          >
            <div className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* API Status */}
        {apiStatus === 'working' && !isLoading && (
          <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-green-300 font-medium">الـ API يعمل بشكل طبيعي - {matches.length} مباراة</p>
            </div>
          </div>
        )}

        {apiStatus === 'error' && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <p className="text-red-300 font-medium">خطأ في الـ API - تحقق من المفتاح</p>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-2 mb-8 border border-gray-700/50">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTabChange('live')}
              className={`py-4 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'live'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {activeTab === 'live' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                مباشرة
              </div>
            </button>
            <button
              onClick={() => handleTabChange('upcoming')}
              className={`py-4 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              القادمة
            </button>
            <button
              onClick={() => handleTabChange('finished')}
              className={`py-4 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'finished'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              المنتهية
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-300 text-xl font-medium">
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
              <div className="text-center py-20">
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50">
                  <div className="text-6xl mb-6 opacity-50">⚽</div>
                  <p className="text-gray-300 text-xl mb-3 font-medium">
                    {activeTab === 'live' && 'لا توجد مباريات مباشرة حالياً'}
                    {activeTab === 'upcoming' && 'لا توجد مباريات قادمة'}
                    {activeTab === 'finished' && 'لا توجد مباريات منتهية'}
                  </p>
                  <p className="text-gray-500 text-base">جرب تحديث الصفحة أو العودة لاحقاً</p>
                </div>
              </div>
            ) : (
              matches.map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => handleMatchClick(match.id)}
                  className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 hover:bg-gray-750/80 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  {/* Competition Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {match.leagueFlag && (
                        <img src={match.leagueFlag} alt="" className="w-8 h-6 object-cover rounded shadow-sm" />
                      )}
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
                        <span className="text-blue-300 font-bold text-sm">{match.competition}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-400 mb-1">{formatDate(match.date)}</div>
                      <div className="text-sm text-gray-300 font-medium">{formatTime(match.date)}</div>
                    </div>
                  </div>
                  
                  {/* Match Details */}
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center text-right min-w-0">
                      <div className="flex items-center space-x-4 space-x-reverse flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-lg truncate">{match.homeTeam}</p>
                        </div>
                        {match.homeLogo && (
                          <div className="w-14 h-14 bg-gray-700/50 rounded-xl p-2 flex items-center justify-center">
                            <img src={match.homeLogo} alt={match.homeTeam} className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Score/Status */}
                    <div className="mx-8 text-center min-w-[140px]">
                      {match.status === 'live' && (
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-2"></div>
                          <span className="text-red-400 text-sm font-bold">مباشر</span>
                          {match.minute && (
                            <span className="text-red-400 text-sm mr-2 bg-red-500/20 px-2 py-1 rounded-md">
                              {match.minute}'
                            </span>
                          )}
                        </div>
                      )}
                      
                      {match.homeScore !== null && match.homeScore !== undefined && 
                       match.awayScore !== null && match.awayScore !== undefined ? (
                        <div className="bg-gray-700/60 rounded-2xl px-6 py-4 border border-gray-600/50">
                          <div className="text-3xl font-bold text-white">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700/40 rounded-2xl px-6 py-4 border border-gray-600/30">
                          <div className="text-gray-300 text-lg font-medium">
                            {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex-1 flex items-center text-left min-w-0">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {match.awayLogo && (
                          <div className="w-14 h-14 bg-gray-700/50 rounded-xl p-2 flex items-center justify-center">
                            <img src={match.awayLogo} alt={match.awayTeam} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-lg truncate">{match.awayTeam}</p>
                        </div>
                      </div>
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
