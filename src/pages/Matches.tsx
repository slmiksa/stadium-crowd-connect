import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Clock, Users, MapPin, RefreshCw, Newspaper, ExternalLink, AlertCircle } from 'lucide-react';

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
  const [dataLoaded, setDataLoaded] = useState({
    live: false,
    upcoming: false,
    finished: false,
    news: false
  });
  const [errorMessages, setErrorMessages] = useState({
    live: '',
    upcoming: '',
    finished: '',
    news: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      console.log('بدء تحميل البيانات...');
      
      // تحميل المباريات المباشرة أولاً (الأهم)
      const livePromise = fetchMatchData('live');
      const newsPromise = fetchNewsData();
      
      // تحميل البيانات المباشرة والأخبار بسرعة
      await Promise.all([livePromise, newsPromise]);
      
      // تحميل باقي البيانات في الخلفية
      fetchMatchData('upcoming');
      fetchMatchData('finished');
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchData = async (status: 'live' | 'upcoming' | 'finished') => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 15000)
      );
      
      const dataPromise = supabase.functions.invoke('get-football-matches', {
        body: { 
          status,
          date: new Date().toISOString().split('T')[0]
        }
      });

      const { data } = await Promise.race([dataPromise, timeoutPromise]) as any;
      
      if (data?.success && data?.matches) {
        setAllMatches(prev => ({
          ...prev,
          [status]: data.matches
        }));
        setErrorMessages(prev => ({ ...prev, [status]: '' }));
      } else {
        setAllMatches(prev => ({
          ...prev,
          [status]: []
        }));
        setErrorMessages(prev => ({ 
          ...prev, 
          [status]: data?.message || `لا توجد مباريات ${
            status === 'live' ? 'مباشرة الآن' :
            status === 'upcoming' ? 'غدا' :
            'أمس'
          }` 
        }));
      }
      
      setDataLoaded(prev => ({ ...prev, [status]: true }));
      
      console.log(`تم تحميل ${status}:`, data?.matches?.length || 0);
      
    } catch (error) {
      console.error(`خطأ في تحميل ${status}:`, error);
      setAllMatches(prev => ({
        ...prev,
        [status]: []
      }));
      setErrorMessages(prev => ({ 
        ...prev, 
        [status]: `حدث خطأ في تحميل المباريات ${
          status === 'live' ? 'المباشرة' :
          status === 'upcoming' ? 'غدا' :
          'أمس'
        }. يرجى المحاولة لاحقاً.` 
      }));
      setDataLoaded(prev => ({ ...prev, [status]: true }));
    }
  };

  const fetchNewsData = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 15000)
      );
      
      const dataPromise = supabase.functions.invoke('get-football-news', {
        body: { limit: 20 }
      });

      const { data } = await Promise.race([dataPromise, timeoutPromise]) as any;
      
      if (data?.success && data?.news) {
        setNews(data.news);
        setErrorMessages(prev => ({ ...prev, news: '' }));
      } else {
        setNews([]);
        setErrorMessages(prev => ({ 
          ...prev, 
          news: data?.message || 'لا توجد أخبار متاحة في الوقت الحالي' 
        }));
      }
      
      setDataLoaded(prev => ({ ...prev, news: true }));
      
      console.log('تم تحميل الأخبار:', data?.news?.length || 0);
      
    } catch (error) {
      console.error('خطأ في تحميل الأخبار:', error);
      setNews([]);
      setErrorMessages(prev => ({ 
        ...prev, 
        news: 'حدث خطأ في تحميل الأخبار. يرجى المحاولة لاحقاً.' 
      }));
      setDataLoaded(prev => ({ ...prev, news: true }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInitialData();
    setIsRefreshing(false);
  };

  const handleMatchClick = (matchId: string) => {
    console.log('الانتقال لتفاصيل المباراة:', matchId);
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
      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center justify-center mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 space-x-reverse bg-blue-600/15 border border-blue-500/25 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5">
          {match.leagueFlag && (
            <img src={match.leagueFlag} alt="" className="w-3 h-2 sm:w-4 sm:h-3 object-cover rounded shadow-sm" />
          )}
          <span className="text-blue-300 font-bold text-xs">{match.competition}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <div className="flex-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/40 rounded-xl p-1.5 sm:p-2 mx-auto mb-2 flex items-center justify-center border border-gray-600/30">
            {match.homeLogo ? (
              <img src={match.homeLogo} alt={match.homeTeam} className="w-full h-full object-contain" />
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded-full"></div>
            )}
          </div>
          <p className="font-bold text-white text-xs sm:text-sm leading-tight px-1">{match.homeTeam}</p>
        </div>

        <div className="mx-2 sm:mx-4 text-center min-w-[80px] sm:min-w-[100px]">
          {match.status === 'live' && (
            <div className="flex items-center justify-center mb-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse ml-1"></div>
              <span className="text-red-400 text-xs font-bold">مباشر</span>
              {match.minute && (
                <span className="text-red-400 text-xs mr-1 bg-red-500/20 px-1 py-0.5 rounded">
                  {match.minute}'
                </span>
              )}
            </div>
          )}
          
          <div className="bg-gray-700/50 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-600/40">
            {match.homeScore !== null && match.homeScore !== undefined && 
             match.awayScore !== null && match.awayScore !== undefined ? (
              <div className="text-xl sm:text-2xl font-bold text-white">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-gray-300 text-base sm:text-lg font-medium">
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

        <div className="flex-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/40 rounded-xl p-1.5 sm:p-2 mx-auto mb-2 flex items-center justify-center border border-gray-600/30">
            {match.awayLogo ? (
              <img src={match.awayLogo} alt={match.awayTeam} className="w-full h-full object-contain" />
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded-full"></div>
            )}
          </div>
          <p className="font-bold text-white text-xs sm:text-sm leading-tight px-1">{match.awayTeam}</p>
        </div>
      </div>

      <div className="border-t border-gray-700/50 pt-2 sm:pt-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-gray-400">
            <Clock size={10} className="sm:size-3 ml-1 text-blue-400" />
            <span className="text-xs">{formatTime(match.date)}</span>
          </div>
          <span className={`font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs ${
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
      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-lg hover:shadow-xl mx-2 sm:mx-0"
    >
      {newsItem.image && newsItem.image !== '/placeholder.svg' && (
        <div className="mb-3 sm:mb-4 rounded-xl overflow-hidden">
          <img 
            src={newsItem.image} 
            alt={newsItem.title} 
            className="w-full h-40 sm:h-48 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {newsItem.category && (
          <div className="inline-block">
            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-lg text-xs font-medium">
              {newsItem.category}
            </span>
          </div>
        )}

        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed line-clamp-2">{newsItem.title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{newsItem.description}</p>
        
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-700/30">
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

  const NewsModal = () => {
    if (!selectedNews) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white pr-4">{selectedNews.title}</h2>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {selectedNews.image && selectedNews.image !== '/placeholder.svg' && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-48 sm:h-64 object-cover"
                />
              </div>
            )}

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

  const EmptyState = ({ type, message }: { type: string, message: string }) => (
    <div className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={20} className="sm:size-6 text-white" />
      </div>
      <p className="text-gray-400 text-base sm:text-lg px-4">{message}</p>
      <p className="text-gray-500 text-sm mt-2 px-4">يرجى المحاولة لاحقاً أو تحديث الصفحة</p>
    </div>
  );

  const currentMatches = allMatches[activeTab as keyof typeof allMatches] || [];
  const isTabLoading = !dataLoaded[activeTab as keyof typeof dataLoaded];
  const currentErrorMessage = errorMessages[activeTab as keyof typeof errorMessages];

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full h-full min-h-screen bg-gray-900 overflow-x-hidden">
        <div className="w-full h-full space-y-0">
          <div className="w-full text-center px-4 py-6 bg-gray-900">
            <div className="flex items-center justify-between mb-2 w-full">
              <div></div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">المباريات والأخبار</h1>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <RefreshCw size={18} className={`sm:size-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">تابع أحدث المباريات والنتائج والأخبار الرياضية</p>
          </div>

          <div className="w-full bg-gray-800/60 backdrop-blur-sm p-1 border-b border-gray-700/50">
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1 w-full">
              <button
                onClick={() => setActiveTab('live')}
                className={`py-3 px-2 text-xs font-bold transition-all duration-300 w-full ${
                  activeTab === 'live'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="block sm:inline">مباشر</span>
                <span className="block sm:inline"> ({allMatches.live.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 px-2 text-xs font-bold transition-all duration-300 w-full ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="block sm:inline">غدا</span>
                <span className="block sm:inline"> ({allMatches.upcoming.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`py-3 px-2 text-xs font-bold transition-all duration-300 w-full ${
                  activeTab === 'finished'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="block sm:inline">أمس</span>
                <span className="block sm:inline"> ({allMatches.finished.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`py-3 px-2 text-xs font-bold transition-all duration-300 w-full ${
                  activeTab === 'news'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="block sm:inline">أخبار</span>
                <span className="block sm:inline"> ({news.length})</span>
              </button>
            </div>
          </div>

          <div className="w-full space-y-3 sm:space-y-4 p-4 pb-20">
            {isTabLoading ? (
              <div className="text-center py-8 sm:py-12 w-full">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">جاري التحميل...</p>
              </div>
            ) : activeTab === 'news' ? (
              news.length === 0 ? (
                <EmptyState type="news" message={currentErrorMessage || 'لا توجد أخبار متاحة حالياً'} />
              ) : (
                news.map((newsItem) => (
                  <NewsCard key={newsItem.id} newsItem={newsItem} />
                ))
              )
            ) : (
              currentMatches.length === 0 ? (
                <EmptyState 
                  type={activeTab} 
                  message={currentErrorMessage || `لا توجد مباريات ${
                    activeTab === 'live' ? 'مباشرة الآن' :
                    activeTab === 'upcoming' ? 'غدا' :
                    'أمس'
                  }`} 
                />
              ) : (
                currentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))
              )
            )}
          </div>
        </div>

        <NewsModal />
      </div>
    </Layout>
  );
};

export default Matches;
