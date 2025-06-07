import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Users, RefreshCw, Newspaper, ExternalLink, AlertCircle, Play, Calendar, Zap } from 'lucide-react';

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

interface GroupedMatches {
  [competition: string]: Match[];
}

const Matches = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [allMatches, setAllMatches] = useState<{
    live: Match[];
    today: Match[];
    tomorrow: Match[];
    yesterday: Match[];
  }>({
    live: [],
    today: [],
    tomorrow: [],
    yesterday: []
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'tomorrow' | 'yesterday' | 'news'>('live');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [dataLoaded, setDataLoaded] = useState({
    live: false,
    today: false,
    tomorrow: false,
    yesterday: false,
    news: false
  });
  const [errorMessages, setErrorMessages] = useState({
    live: '',
    today: '',
    tomorrow: '',
    yesterday: '',
    news: ''
  });

  // تصفية البطولات النسائية
  const isWomensCompetition = (competition: string): boolean => {
    const womensKeywords = ['Women', 'النساء', 'السيدات', 'Female', 'كأس الأمم النسائية', 'Women\'s'];
    return womensKeywords.some(keyword => 
      competition.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // ترتيب البطولات حسب الأولوية
  const getCompetitionPriority = (competition: string): number => {
    const priorities: { [key: string]: number } = {
      'دوري روشن السعودي': 1,
      'دوري أبطال آسيا': 2,
      'دوري أبطال أوروبا': 3,
      'الدوري الإنجليزي الممتاز': 4,
      'الليغا الإسبانية': 5,
      'الدوري الألماني': 6,
      'الدوري الإيطالي': 7,
      'الدوري الفرنسي': 8,
      'كأس الملك': 9,
      'كأس العالم': 10,
      'دوري أبطال أفريقيا': 11,
      'كأس الأمم الأفريقية': 12
    };
    
    return priorities[competition] || 999;
  };

  // تجميع المباريات حسب البطولة
  const groupMatchesByCompetition = (matches: Match[]): GroupedMatches => {
    const grouped: GroupedMatches = {};
    
    matches.forEach(match => {
      if (!grouped[match.competition]) {
        grouped[match.competition] = [];
      }
      grouped[match.competition].push(match);
    });

    // ترتيب المباريات داخل كل بطولة حسب التاريخ
    Object.keys(grouped).forEach(competition => {
      grouped[competition].sort((a, b) => {
        if (activeTab === 'tomorrow') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
    });

    return grouped;
  };

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
      fetchMatchData('today');
      fetchMatchData('tomorrow');
      fetchMatchData('yesterday');
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchData = async (status: 'live' | 'today' | 'tomorrow' | 'yesterday') => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 15000)
      );
      
      // تحديد التاريخ المناسب لكل تبويب
      const today = new Date();
      let targetDate = today;
      let apiStatus = 'upcoming';
      
      if (status === 'live') {
        apiStatus = 'live';
      } else if (status === 'today') {
        apiStatus = 'upcoming';
        targetDate = today;
      } else if (status === 'tomorrow') {
        apiStatus = 'upcoming';
        targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      } else if (status === 'yesterday') {
        apiStatus = 'finished';
        targetDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const dataPromise = supabase.functions.invoke('get-football-matches', {
        body: { 
          status: apiStatus,
          date: targetDate.toISOString().split('T')[0]
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
          [status]: data?.message || `لا توجد مباريات ${getTabTitle(status)}` 
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
        [status]: `حدث خطأ في تحميل المباريات. يرجى المحاولة لاحقاً.` 
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

  const handleMatchClick = (match: Match) => {
    console.log('الانتقال لتفاصيل المباراة:', match);
    navigate(`/match-details/${match.id}`, { 
      state: { 
        match,
        matchData: match 
      } 
    });
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

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'live':
        return 'مباشر';
      case 'today':
        return 'اليوم';
      case 'tomorrow':
        return 'غداً';
      case 'yesterday':
        return 'أمس';
      case 'news':
        return 'أخبار';
      default:
        return tab;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'live':
        return <Zap className="w-4 h-4" />;
      case 'today':
        return <Calendar className="w-4 h-4" />;
      case 'tomorrow':
        return <Clock className="w-4 h-4" />;
      case 'yesterday':
        return <Calendar className="w-4 h-4" />;
      case 'news':
        return <Newspaper className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // تأثير اللاعب يركض مع الكرة
  const SoccerPlayerAnimation = () => (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <div className="animate-bounce">
          <Play className="w-8 h-8 text-green-400 rotate-90" />
        </div>
        <div className="absolute -right-12 top-0 animate-pulse">
          <div className="w-6 h-10 bg-blue-500 rounded-t-full"></div>
        </div>
      </div>
    </div>
  );

  const MatchRow = ({ match }: { match: Match }) => (
    <TableRow 
      onClick={() => handleMatchClick(match)}
      className="cursor-pointer hover:bg-gray-800/60 transition-all duration-300 transform hover:scale-[1.01]"
    >
      <TableCell className="text-right p-2">
        <div className="flex items-center justify-end space-x-2 space-x-reverse">
          {match.homeLogo && (
            <img src={match.homeLogo} alt={match.homeTeam} className="w-5 h-5 object-contain" />
          )}
          <span className={`font-medium text-white ${isMobile ? 'text-sm' : 'text-base'}`}>
            {isMobile ? match.homeTeam.substring(0, 10) + (match.homeTeam.length > 10 ? '...' : '') : match.homeTeam}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="text-center p-2">
        <div className="flex flex-col items-center space-y-1">
          {match.status === 'live' && (
            <div className="flex items-center space-x-1 space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-bold">مباشر</span>
              {match.minute && (
                <span className="text-red-400 text-xs bg-red-500/20 px-1 py-0.5 rounded">
                  {match.minute}'
                </span>
              )}
            </div>
          )}
          
          <div className="bg-gray-700/50 rounded-lg px-2 py-1 border border-gray-600/40">
            {match.homeScore !== null && match.homeScore !== undefined && 
             match.awayScore !== null && match.awayScore !== undefined ? (
              <span className={`font-bold text-white ${isMobile ? 'text-sm' : 'text-lg'}`}>
                {match.homeScore} - {match.awayScore}
              </span>
            ) : (
              <span className={`text-gray-300 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
              </span>
            )}
          </div>
          
          {match.status === 'upcoming' && !isMobile && (
            <span className="text-xs text-gray-400">
              {formatDate(match.date)}
            </span>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-left p-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`font-medium text-white ${isMobile ? 'text-sm' : 'text-base'}`}>
            {isMobile ? match.awayTeam.substring(0, 10) + (match.awayTeam.length > 10 ? '...' : '') : match.awayTeam}
          </span>
          {match.awayLogo && (
            <img src={match.awayLogo} alt={match.awayTeam} className="w-5 h-5 object-contain" />
          )}
        </div>
      </TableCell>
      
      {!isMobile && (
        <>
          <TableCell className="text-center p-2">
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-xs">
              <Clock size={12} className="text-blue-400" />
              <span className="text-gray-400">{formatTime(match.date)}</span>
            </div>
          </TableCell>
          
          <TableCell className="text-center p-2">
            <span className={`font-medium px-2 py-1 rounded-lg text-xs ${
              match.status === 'live' ? 'text-red-400 bg-red-500/20' : 
              match.status === 'finished' ? 'text-green-400 bg-green-500/20' : 
              'text-blue-400 bg-blue-500/20'
            }`}>
              {getMatchStatus(match.status)}
            </span>
          </TableCell>
        </>
      )}
    </TableRow>
  );

  const CompetitionSection = ({ competition, matches, isWomens }: { 
    competition: string, 
    matches: Match[], 
    isWomens: boolean 
  }) => (
    <AccordionItem value={competition} className="border-gray-700/50">
      <AccordionTrigger className={`${
        isWomens 
          ? 'text-pink-300 hover:text-pink-200' 
          : 'text-blue-300 hover:text-blue-200'
      } font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>
        <div className="flex items-center space-x-3 space-x-reverse">
          {matches[0]?.leagueFlag && (
            <img 
              src={matches[0].leagueFlag} 
              alt="" 
              className="w-6 h-4 object-cover rounded shadow-sm" 
            />
          )}
          <div className="text-right">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className={isMobile ? 'text-sm' : 'text-base'}>
                {isMobile && competition.length > 20 ? competition.substring(0, 20) + '...' : competition}
              </span>
              {isWomens && (
                <span className="text-xs bg-pink-500/30 px-2 py-0.5 rounded">نساء</span>
              )}
            </div>
            <span className="text-gray-400 text-sm font-normal">{matches.length} مباراة</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="rounded-lg border border-gray-700/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800/40 hover:bg-gray-800/40">
                <TableHead className={`text-right text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>المضيف</TableHead>
                <TableHead className={`text-center text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>النتيجة</TableHead>
                <TableHead className={`text-left text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>الضيف</TableHead>
                {!isMobile && (
                  <>
                    <TableHead className="text-center text-gray-300 text-sm">الوقت</TableHead>
                    <TableHead className="text-center text-gray-300 text-sm">الحالة</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match, index) => (
                <MatchRow key={`${match.id}-${index}`} match={match} />
              ))}
            </TableBody>
          </Table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  const NewsCard = ({ newsItem }: { newsItem: NewsItem }) => (
    <div 
      onClick={() => handleNewsClick(newsItem)}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
    >
      {newsItem.image && newsItem.image !== '/placeholder.svg' && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img 
            src={newsItem.image} 
            alt={newsItem.title} 
            className={`w-full object-cover hover:scale-105 transition-transform duration-300 ${
              isMobile ? 'h-32' : 'h-48'
            }`}
          />
        </div>
      )}

      <div className="space-y-3">
        {newsItem.category && (
          <span className="inline-block bg-purple-600/20 text-purple-300 px-2 py-1 rounded-lg text-xs font-medium">
            {newsItem.category}
          </span>
        )}

        <h3 className={`font-bold text-white leading-relaxed line-clamp-2 ${
          isMobile ? 'text-base' : 'text-lg'
        }`}>
          {newsItem.title}
        </h3>
        <p className={`text-gray-300 leading-relaxed line-clamp-3 ${
          isMobile ? 'text-sm' : 'text-sm'
        }`}>
          {newsItem.description}
        </p>
        
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

  const NewsModal = () => {
    if (!selectedNews) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`bg-gray-800 rounded-xl w-full max-h-[90vh] overflow-y-auto ${
          isMobile ? 'max-w-full' : 'max-w-2xl'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold text-white pr-4 ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                {selectedNews.title}
              </h2>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {selectedNews.image && selectedNews.image !== '/placeholder.svg' && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className={`w-full object-cover ${
                    isMobile ? 'h-48' : 'h-64'
                  }`}
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
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <p className="text-gray-300 leading-relaxed">{selectedNews.content}</p>
                </div>
              )}

              {selectedNews.url && selectedNews.url !== '#' && (
                <button
                  onClick={() => handleNewsUrlClick(selectedNews.url!)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 space-x-reverse"
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
    <div className="text-center py-12">
      <SoccerPlayerAnimation />
      <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-white" />
      </div>
      <p className={`text-gray-400 px-4 ${isMobile ? 'text-base' : 'text-lg'}`}>{message}</p>
      <p className={`text-gray-500 mt-2 px-4 ${isMobile ? 'text-sm' : 'text-sm'}`}>
        يرجى المحاولة لاحقاً أو تحديث الصفحة
      </p>
    </div>
  );

  const currentMatches = allMatches[activeTab as keyof typeof allMatches] || [];
  const isTabLoading = !dataLoaded[activeTab as keyof typeof dataLoaded];
  const currentErrorMessage = errorMessages[activeTab as keyof typeof errorMessages];

  // تجميع المباريات حسب البطولة
  const groupedMatches = groupMatchesByCompetition(currentMatches);
  
  // فصل البطولات النسائية عن الرجالية وترتيبها
  const mensCompetitions = Object.keys(groupedMatches)
    .filter(comp => !isWomensCompetition(comp))
    .sort((a, b) => getCompetitionPriority(a) - getCompetitionPriority(b));
  
  const womensCompetitions = Object.keys(groupedMatches)
    .filter(comp => isWomensCompetition(comp))
    .sort((a, b) => getCompetitionPriority(a) - getCompetitionPriority(b));

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {!isMobile && <SoccerPlayerAnimation />}
              <div className="text-center flex-1">
                <h1 className={`font-bold text-white mb-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                  المباريات والأخبار
                </h1>
                <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  تابع أحدث المباريات والنتائج والأخبار الرياضية
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isMobile ? 'p-2' : 'p-3'
                }`}
              >
                <RefreshCw size={isMobile ? 16 : 20} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800/60 backdrop-blur-sm border-b border-gray-700/50 sticky top-[100px] z-30">
          <div className="container mx-auto px-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className={`grid w-full grid-cols-5 bg-gray-800/40 ${isMobile ? 'h-12' : 'h-14'}`}>
                {(['live', 'today', 'tomorrow', 'yesterday', 'news'] as const).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={`flex flex-col items-center justify-center space-y-1 text-xs font-bold transition-all duration-300 ${
                      activeTab === tab
                        ? tab === 'live' 
                          ? 'bg-red-600 text-white shadow-lg'
                          : tab === 'today'
                          ? 'bg-green-600 text-white shadow-lg'
                          : tab === 'tomorrow'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : tab === 'yesterday'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    } ${isMobile ? 'px-1 py-2' : 'px-3 py-3'}`}
                  >
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {getTabIcon(tab)}
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>
                        {getTabTitle(tab)}
                      </span>
                    </div>
                    <span className="text-xs opacity-80">
                      ({tab === 'news' ? news.length : allMatches[tab as keyof typeof allMatches].length})
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Content */}
              <div className="px-2 py-4 pb-20">
                {(['live', 'today', 'tomorrow', 'yesterday'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    {isTabLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">جاري التحميل...</p>
                      </div>
                    ) : allMatches[tab].length === 0 ? (
                      <EmptyState 
                        type={tab} 
                        message={errorMessages[tab] || `لا توجد مباريات ${getTabTitle(tab)}`} 
                      />
                    ) : (
                      <div className="space-y-6">
                        {/* بطولات الرجال */}
                        {mensCompetitions.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse mb-4">
                              <Users className="w-5 h-5 text-blue-400" />
                              <h2 className={`font-bold text-blue-300 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                                بطولات الرجال
                              </h2>
                              <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                            </div>
                            <Accordion type="multiple" className="space-y-3">
                              {mensCompetitions.map((competition) => (
                                <CompetitionSection
                                  key={competition}
                                  competition={competition}
                                  matches={groupedMatches[competition]}
                                  isWomens={false}
                                />
                              ))}
                            </Accordion>
                          </div>
                        )}

                        {/* بطولات النساء */}
                        {womensCompetitions.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse mb-4">
                              <Users className="w-5 h-5 text-pink-400" />
                              <h2 className={`font-bold text-pink-300 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                                بطولات النساء
                              </h2>
                              <div className="flex-1 h-px bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            <Accordion type="multiple" className="space-y-3">
                              {womensCompetitions.map((competition) => (
                                <CompetitionSection
                                  key={competition}
                                  competition={competition}
                                  matches={groupedMatches[competition]}
                                  isWomens={true}
                                />
                              ))}
                            </Accordion>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}

                <TabsContent value="news">
                  {!dataLoaded.news ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400">جاري التحميل...</p>
                    </div>
                  ) : news.length === 0 ? (
                    <EmptyState type="news" message={errorMessages.news || 'لا توجد أخبار متاحة حالياً'} />
                  ) : (
                    <div className={`grid gap-4 ${
                      isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}>
                      {news.map((newsItem) => (
                        <NewsCard key={newsItem.id} newsItem={newsItem} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <NewsModal />
      </div>
    </Layout>
  );
};

export default Matches;
