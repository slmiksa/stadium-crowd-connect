
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Clock, Users, MapPin, RefreshCw, Newspaper, ExternalLink } from 'lucide-react';

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

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  video?: string;
  date: string;
  source: string;
  url?: string;
  category?: string;
  content?: string;
}

const Matches = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [allMatches, setAllMatches] = useState<{
    live: Match[];
    upcoming: Match[];
    finished: Match[];
  }>({
    live: [],
    upcoming: [],
    finished: []
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished' | 'news'>('live');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all matches data...');
      
      // جلب المباريات المباشرة
      const { data: liveData } = await supabase.functions.invoke('get-football-matches', {
        body: { 
          status: 'live',
          date: new Date().toISOString().split('T')[0]
        }
      });

      // جلب المباريات القادمة
      const { data: upcomingData } = await supabase.functions.invoke('get-football-matches', {
        body: { 
          status: 'upcoming',
          date: new Date().toISOString().split('T')[0]
        }
      });

      // جلب المباريات المنتهية
      const { data: finishedData } = await supabase.functions.invoke('get-football-matches', {
        body: { 
          status: 'finished',
          date: new Date().toISOString().split('T')[0]
        }
      });

      // جلب الأخبار
      const { data: newsData } = await supabase.functions.invoke('get-football-news', {
        body: { limit: 50 }
      });

      setAllMatches({
        live: liveData?.matches || [],
        upcoming: upcomingData?.matches || [],
        finished: finishedData?.matches || []
      });

      setNews(newsData?.news || []);

      console.log('All data fetched:', {
        live: liveData?.matches?.length || 0,
        upcoming: upcomingData?.matches?.length || 0,
        finished: finishedData?.matches?.length || 0,
        news: newsData?.news?.length || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  const handleMatchClick = (matchId: string) => {
    console.log('Navigating to match details:', matchId);
    navigate(`/match-details/${matchId}`);
  };

  const handleNewsClick = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
  };

  const handleNewsUrlClick = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
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
      day: 'numeric',
      month: 'short'
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
          
          {match.status === 'upcoming' && (
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(match.date)}
            </div>
          )}
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

  const NewsCard = ({ newsItem }: { newsItem: NewsItem }) => (
    <div 
      onClick={() => handleNewsClick(newsItem)}
      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
    >
      {/* News Image */}
      {newsItem.image && newsItem.image !== '/placeholder.svg' && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img 
            src={newsItem.image} 
            alt={newsItem.title} 
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* News Content */}
      <div className="space-y-3">
        {/* Category Badge */}
        {newsItem.category && (
          <div className="inline-block">
            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-lg text-xs font-medium">
              {newsItem.category}
            </span>
          </div>
        )}

        <h3 className="text-lg font-bold text-white leading-relaxed line-clamp-2">{newsItem.title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{newsItem.description}</p>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
          <span className="text-xs text-gray-400">{newsItem.source}</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs text-gray-400">{formatDate(newsItem.date)}</span>
            {newsItem.url && newsItem.url !== '#' && (
              <ExternalLink size={12} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // News Modal
  const NewsModal = () => {
    if (!selectedNews) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{selectedNews.title}</h2>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Image */}
            {selectedNews.image && selectedNews.image !== '/placeholder.svg' && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{selectedNews.source}</span>
                <span>{formatDate(selectedNews.date)}</span>
              </div>

              {selectedNews.category && (
                <span className="inline-block bg-purple-600/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium">
                  {selectedNews.category}
                </span>
              )}

              <p className="text-gray-300 leading-relaxed">{selectedNews.description}</p>
              
              {selectedNews.content && selectedNews.content !== selectedNews.description && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <p className="text-gray-300 leading-relaxed">{selectedNews.content}</p>
                </div>
              )}

              {selectedNews.url && selectedNews.url !== '#' && (
                <button
                  onClick={() => handleNewsUrlClick(selectedNews.url!)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <span>قراءة المقال كاملاً</span>
                  <ExternalLink size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentMatches = allMatches[activeTab as keyof typeof allMatches] || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-300 text-xl font-medium">جاري تحميل البيانات...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        <div className="p-4 space-y-6 pb-20">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-between mb-2">
              <div></div>
              <h1 className="text-3xl font-bold text-white">المباريات والأخبار</h1>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-gray-400">تابع أحدث المباريات والنتائج والأخبار الرياضية</p>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-1 border border-gray-700/50">
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setActiveTab('live')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === 'live'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                مباشر ({allMatches.live.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                قادمة ({allMatches.upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === 'finished'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                انتهت ({allMatches.finished.length})
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === 'news'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                أخبار ({news.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {activeTab === 'news' ? (
              news.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Newspaper size={24} className="text-white" />
                  </div>
                  <p className="text-gray-400 text-lg">لا توجد أخبار متاحة حالياً</p>
                </div>
              ) : (
                news.map((newsItem) => (
                  <NewsCard key={newsItem.id} newsItem={newsItem} />
                ))
              )
            ) : (
              currentMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 bg-gradient-to-r ${
                    activeTab === 'live' ? 'from-red-600 to-red-400' :
                    activeTab === 'upcoming' ? 'from-blue-600 to-blue-400' :
                    'from-green-600 to-green-400'
                  } rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl">
                      {activeTab === 'live' ? '🔴' : activeTab === 'upcoming' ? '⏰' : '✅'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-lg">
                    {activeTab === 'live' ? 'لا توجد مباريات مباشرة الآن' :
                     activeTab === 'upcoming' ? 'لا توجد مباريات قادمة' :
                     'لا توجد مباريات منتهية'}
                  </p>
                </div>
              ) : (
                currentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))
              )
            )}
          </div>
        </div>

        {/* News Modal */}
        <NewsModal />
      </div>
    </Layout>
  );
};

export default Matches;
