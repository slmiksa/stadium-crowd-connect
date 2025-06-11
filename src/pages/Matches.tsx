import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Users, RefreshCw, Newspaper, ExternalLink, AlertCircle, Filter, Globe, Trophy, MapPin, Zap, Calendar } from 'lucide-react';
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
type CompetitionCategory = 'arab' | 'european' | 'continental' | 'worldcup' | 'all';
type MatchStatus = 'live' | 'today' | 'tomorrow' | 'yesterday' | 'news';
const Matches = () => {
  const navigate = useNavigate();
  const {
    t,
    isRTL
  } = useLanguage();
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
  const [activeTab, setActiveTab] = useState<MatchStatus>('live');
  const [selectedCategory, setSelectedCategory] = useState<CompetitionCategory>('all');
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

  // تصنيف البطولات حسب النوع - محسن لجميع البطولات
  const getCompetitionCategory = (competition: string): CompetitionCategory => {
    const arabCompetitions = ['Saudi Pro League', 'Saudi Professional League', 'King Cup', 'Saudi Super Cup', 'Egyptian Premier League', 'Egypt Premier League', 'Moroccan Botola Pro', 'Moroccan Premier League', 'Tunisian Ligue Professionnelle 1', 'Jordanian Pro League', 'Lebanese Premier League', 'Kuwaiti Premier League', 'Qatar Stars League', 'UAE Pro League', 'Bahraini Premier League', 'Omani Professional League', 'Iraqi Premier League', 'Syrian Premier League', 'Arab Club Champions Cup'];
    const europeanCompetitions = ['Premier League', 'English Premier League', 'EPL', 'La Liga', 'LaLiga', 'Spanish La Liga', 'Bundesliga', 'German Bundesliga', 'Serie A', 'Italian Serie A', 'Ligue 1', 'French Ligue 1', 'Eredivisie', 'Belgian Pro League', 'Primeira Liga', 'Russian Premier League', 'Turkish Super League', 'Süper Lig', 'Scottish Premiership', 'Swiss Super League', 'Austrian Bundesliga', 'Czech First League', 'Polish Ekstraklasa', 'FA Cup', 'Copa del Rey', 'DFB Pokal', 'DFB-Pokal', 'Coppa Italia', 'Coupe de France', 'Championship', 'EFL Cup', 'League Cup', 'Carabao Cup', '2. Bundesliga', 'Serie B', 'Ligue 2'];
    const continentalCompetitions = ['Champions League', 'UEFA Champions League', 'Europa League', 'UEFA Europa League', 'Conference League', 'UEFA Conference League', 'UEFA Nations League', 'European Championship', 'UEFA European Championship', 'Euro 2024', 'UEFA Euro', 'AFC Champions League', 'AFC Champions League Elite', 'Asian Champions League', 'AFC Cup', 'Asian Cup', 'AFC Asian Cup', 'CAF Champions League', 'Africa Cup of Nations', 'AFCON', 'CAF Confederation Cup', 'CONCACAF Champions League', 'Copa Libertadores', 'Copa America', 'CONMEBOL Copa America'];
    const worldcupCompetitions = ['World Cup', 'FIFA World Cup', 'FIFA Club World Cup', 'Club World Cup', 'World Cup Qualification', 'FIFA World Cup Qualification', 'World Cup Qualifiers', 'WC Qualification', 'World Cup Qualification - Asia', 'World Cup Qualification - Europe', 'World Cup Qualification - Africa', 'World Cup Qualification - South America', 'World Cup Qualification - North America', 'World Cup Qualification - Oceania', 'World Cup Qualification Intercontinental Play-offs', 'FIFA World Cup qualification', 'FIFA Confederations Cup', 'Olympics', 'Olympic Games'];

    // البحث الأولي - مطابقة دقيقة
    if (arabCompetitions.includes(competition)) return 'arab';
    if (europeanCompetitions.includes(competition)) return 'european';
    if (continentalCompetitions.includes(competition)) return 'continental';
    if (worldcupCompetitions.includes(competition)) return 'worldcup';

    // البحث بالكلمات المفتاحية للتصفيات والبطولات التي قد تأتي بأسماء مختلفة
    const competitionLower = competition.toLowerCase();

    // تصفيات كأس العالم وكأس العالم للأندية
    if (competitionLower.includes('world cup') || competitionLower.includes('club world cup') || competitionLower.includes('fifa club world cup') || competitionLower.includes('تصفيات') || competitionLower.includes('qualification') || competitionLower.includes('qualifiers') || competitionLower.includes('wc qualification') || competitionLower.includes('confederations cup') || competitionLower.includes('olympics') || competitionLower.includes('olympic')) {
      return 'worldcup';
    }

    // البطولات القارية
    if (competitionLower.includes('champions league') || competitionLower.includes('europa league') || competitionLower.includes('conference league') || competitionLower.includes('nations league') || competitionLower.includes('euro') || competitionLower.includes('copa america') || competitionLower.includes('afcon') || competitionLower.includes('asian cup') || competitionLower.includes('libertadores') || competitionLower.includes('concacaf') || competitionLower.includes('afc cup') || competitionLower.includes('caf ')) {
      return 'continental';
    }

    // الدوريات الأوروبية
    if (competitionLower.includes('premier league') || competitionLower.includes('la liga') || competitionLower.includes('bundesliga') || competitionLower.includes('serie a') || competitionLower.includes('ligue 1') || competitionLower.includes('eredivisie') || competitionLower.includes('primeira liga') || competitionLower.includes('süper lig') || competitionLower.includes('super lig') || competitionLower.includes('premiership') || competitionLower.includes('fa cup') || competitionLower.includes('copa del rey') || competitionLower.includes('dfb') || competitionLower.includes('coppa italia') || competitionLower.includes('coupe de france')) {
      return 'european';
    }

    // الدوريات العربية
    if (competitionLower.includes('saudi') || competitionLower.includes('egypt') || competitionLower.includes('morocco') || competitionLower.includes('tunisia') || competitionLower.includes('jordan') || competitionLower.includes('lebanon') || competitionLower.includes('kuwait') || competitionLower.includes('qatar') || competitionLower.includes('uae') || competitionLower.includes('emirates') || competitionLower.includes('bahrain') || competitionLower.includes('oman') || competitionLower.includes('iraq') || competitionLower.includes('syria') || competitionLower.includes('arab')) {
      return 'arab';
    }
    return 'all';
  };

  // ترتيب البطولات حسب الأولوية
  const getCompetitionPriority = (competition: string): number => {
    const priorities: {
      [key: string]: number;
    } = {
      // بطولات عربية - أولوية عالية
      'Saudi Pro League': 1,
      'Saudi Professional League': 1,
      'King Cup': 2,
      'Egyptian Premier League': 3,
      'Egypt Premier League': 3,
      'Moroccan Botola Pro': 4,
      'Moroccan Premier League': 4,
      'Tunisian Ligue Professionnelle 1': 5,
      'Arab Club Champions Cup': 6,
      // بطولات أوروبية مهمة
      'UEFA Champions League': 10,
      'Champions League': 10,
      'Premier League': 11,
      'English Premier League': 11,
      'La Liga': 12,
      'LaLiga': 12,
      'Spanish La Liga': 12,
      'Bundesliga': 13,
      'German Bundesliga': 13,
      'Serie A': 14,
      'Italian Serie A': 14,
      'Ligue 1': 15,
      'French Ligue 1': 15,
      // بطولات قارية
      'AFC Champions League': 20,
      'AFC Champions League Elite': 20,
      'CAF Champions League': 21,
      'UEFA Europa League': 22,
      'Europa League': 22,
      // كأس العالم وتصفياته
      'FIFA World Cup': 30,
      'World Cup': 30,
      'FIFA Club World Cup': 31,
      'Club World Cup': 31,
      'World Cup Qualification': 32,
      'FIFA World Cup Qualification': 32,
      'World Cup Qualifiers': 32
    };
    return priorities[competition] || 999;
  };

  // تصفية المباريات حسب الفئة المختارة
  const filterMatchesByCategory = (matches: Match[]): Match[] => {
    if (selectedCategory === 'all') return matches;
    return matches.filter(match => getCompetitionCategory(match.competition) === selectedCategory);
  };

  // تجميع المباريات حسب البطولة
  const groupMatchesByCompetition = (matches: Match[]): GroupedMatches => {
    const filteredMatches = filterMatchesByCategory(matches);
    const grouped: GroupedMatches = {};
    filteredMatches.forEach(match => {
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
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 15000));

      // تحديد التاريخ المناسب لكل تبويب
      const today = new Date();
      let targetDate = today;
      let apiStatus = 'upcoming';
      if (status === 'live') {
        apiStatus = 'live';
      } else if (status === 'today') {
        apiStatus = 'upcoming';
        targetDate = today; // مباريات اليوم
      } else if (status === 'tomorrow') {
        apiStatus = 'upcoming';
        targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // مباريات الغد
      } else if (status === 'yesterday') {
        apiStatus = 'finished';
        targetDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // مباريات الأمس
      }
      const dataPromise = supabase.functions.invoke('get-football-matches', {
        body: {
          status: apiStatus,
          date: targetDate.toISOString().split('T')[0]
        }
      });
      const {
        data
      } = (await Promise.race([dataPromise, timeoutPromise])) as any;
      if (data?.success && data?.matches) {
        setAllMatches(prev => ({
          ...prev,
          [status]: data.matches
        }));
        setErrorMessages(prev => ({
          ...prev,
          [status]: ''
        }));
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
      setDataLoaded(prev => ({
        ...prev,
        [status]: true
      }));
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
      setDataLoaded(prev => ({
        ...prev,
        [status]: true
      }));
    }
  };
  const fetchNewsData = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 15000));
      const dataPromise = supabase.functions.invoke('get-football-news', {
        body: {
          limit: 20
        }
      });
      const {
        data
      } = (await Promise.race([dataPromise, timeoutPromise])) as any;
      if (data?.success && data?.news) {
        setNews(data.news);
        setErrorMessages(prev => ({
          ...prev,
          news: ''
        }));
      } else {
        setNews([]);
        setErrorMessages(prev => ({
          ...prev,
          news: data?.message || 'لا توجد أخبار متاحة في الوقت الحالي'
        }));
      }
      setDataLoaded(prev => ({
        ...prev,
        news: true
      }));
      console.log('تم تحميل الأخبار:', data?.news?.length || 0);
    } catch (error) {
      console.error('خطأ في تحميل الأخبار:', error);
      setNews([]);
      setErrorMessages(prev => ({
        ...prev,
        news: 'حدث خطأ في تحميل الأخبار. يرجى المحاولة لاحقاً.'
      }));
      setDataLoaded(prev => ({
        ...prev,
        news: true
      }));
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
  const getCategoryIcon = (category: CompetitionCategory) => {
    switch (category) {
      case 'arab':
        return <MapPin className="w-4 h-4" />;
      case 'european':
        return <Globe className="w-4 h-4" />;
      case 'continental':
        return <Trophy className="w-4 h-4" />;
      case 'worldcup':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };
  const getCategoryName = (category: CompetitionCategory) => {
    switch (category) {
      case 'arab':
        return 'الدوريات العربية';
      case 'european':
        return 'الدوريات الأوروبية';
      case 'continental':
        return 'البطولات القارية';
      case 'worldcup':
        return 'كأس العالم والأندية';
      default:
        return 'جميع البطولات';
    }
  };
  const AnimatedSoccerBall = ({
    size = "w-8 h-8",
    className = ""
  }: {
    size?: string;
    className?: string;
  }) => {};
  const SoccerPlayerAnimation = () => <div className="flex items-center justify-center py-8">
      <div className="relative">
        <AnimatedSoccerBall size="w-10 h-10" className="animate-pulse" />
        <div className="absolute -right-16 top-0 animate-bounce delay-75">
          
        </div>
      </div>
    </div>;
  const MatchRow = ({
    match
  }: {
    match: Match;
  }) => <TableRow onClick={() => handleMatchClick(match)} className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-900/40 hover:to-purple-900/40 transition-all duration-300 transform hover:scale-[1.01] group border-b border-gray-700/30">
      <TableCell className="text-right p-4">
        <div className="flex items-center justify-end space-x-3 space-x-reverse">
          {match.homeLogo && <div className="relative">
              <img src={match.homeLogo} alt={match.homeTeam} className="w-6 h-6 object-contain rounded-full shadow-md group-hover:scale-110 transition-transform duration-200" />
            </div>}
          <span className={`font-bold text-white group-hover:text-blue-300 transition-colors ${isMobile ? 'text-sm' : 'text-base'}`}>
            {isMobile ? match.homeTeam.substring(0, 12) + (match.homeTeam.length > 12 ? '...' : '') : match.homeTeam}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="text-center p-4">
        <div className="flex flex-col items-center space-y-2">
          {match.status === 'live' && <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-bold bg-red-500/20 px-2 py-1 rounded-full">مباشر</span>
              {match.minute && <span className="text-red-400 text-xs bg-red-500/30 px-2 py-1 rounded-full border border-red-500/50">
                  {match.minute}'
                </span>}
            </div>}
          
          <div className="bg-gradient-to-r from-gray-700/60 to-gray-600/60 rounded-xl px-4 py-2 border border-gray-600/40 shadow-lg backdrop-blur-sm">
            {match.homeScore !== null && match.homeScore !== undefined && match.awayScore !== null && match.awayScore !== undefined ? <span className={`font-bold text-white ${isMobile ? 'text-base' : 'text-xl'}`}>
                {match.homeScore} - {match.awayScore}
              </span> : <span className={`text-gray-300 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
              </span>}
          </div>
          
          {match.status === 'upcoming' && !isMobile && <span className="text-xs text-gray-400 bg-blue-500/10 px-2 py-1 rounded-lg">
              {formatDate(match.date)}
            </span>}
        </div>
      </TableCell>
      
      <TableCell className="text-left p-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className={`font-bold text-white group-hover:text-blue-300 transition-colors ${isMobile ? 'text-sm' : 'text-base'}`}>
            {isMobile ? match.awayTeam.substring(0, 12) + (match.awayTeam.length > 12 ? '...' : '') : match.awayTeam}
          </span>
          {match.awayLogo && <div className="relative">
              <img src={match.awayLogo} alt={match.awayTeam} className="w-6 h-6 object-contain rounded-full shadow-md group-hover:scale-110 transition-transform duration-200" />
            </div>}
        </div>
      </TableCell>
      
      {!isMobile && <>
          <TableCell className="text-center p-4">
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-xs bg-blue-500/10 px-3 py-1 rounded-lg">
              <Clock size={14} className="text-blue-400" />
              <span className="text-gray-300">{formatTime(match.date)}</span>
            </div>
          </TableCell>
          
          <TableCell className="text-center p-4">
            <span className={`font-bold px-3 py-1 rounded-lg text-xs border ${match.status === 'live' ? 'text-red-400 bg-red-500/20 border-red-500/30' : match.status === 'finished' ? 'text-green-400 bg-green-500/20 border-green-500/30' : 'text-blue-400 bg-blue-500/20 border-blue-500/30'}`}>
              {getMatchStatus(match.status)}
            </span>
          </TableCell>
        </>}
    </TableRow>;
  const CompetitionSection = ({
    competition,
    matches
  }: {
    competition: string;
    matches: Match[];
  }) => {
    const category = getCompetitionCategory(competition);
    const isWorldCup = category === 'worldcup';
    const isArab = category === 'arab';
    const isEuropean = category === 'european';
    const isContinental = category === 'continental';
    return <AccordionItem value={competition} className="border border-gray-700/30 rounded-xl overflow-hidden mb-4 bg-gradient-to-r from-gray-800/40 to-gray-700/40 backdrop-blur-sm">
        <AccordionTrigger className={`font-bold px-6 py-4 ${isMobile ? 'text-sm' : 'text-base'} transition-all duration-300 ${isWorldCup ? 'text-yellow-300 hover:text-yellow-200 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 hover:from-yellow-800/30 hover:to-amber-800/30' : isArab ? 'text-green-300 hover:text-green-200 bg-gradient-to-r from-green-900/20 to-emerald-900/20 hover:from-green-800/30 hover:to-emerald-800/30' : isEuropean ? 'text-blue-300 hover:text-blue-200 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 hover:from-blue-800/30 hover:to-indigo-800/30' : isContinental ? 'text-purple-300 hover:text-purple-200 bg-gradient-to-r from-purple-900/20 to-violet-900/20 hover:from-purple-800/30 hover:to-violet-800/30' : 'text-gray-300 hover:text-gray-200 bg-gradient-to-r from-gray-900/20 to-gray-800/20 hover:from-gray-800/30 hover:to-gray-700/30'}`}>
          <div className="flex items-center space-x-4 space-x-reverse">
            {matches[0]?.leagueFlag && <div className="relative">
                <img src={matches[0].leagueFlag} alt="" className="w-8 h-6 object-cover rounded-md shadow-md border border-gray-600/50" />
              </div>}
            <AnimatedSoccerBall size="w-6 h-6" />
            <div className="text-right">
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className={isMobile ? 'text-sm' : 'text-base'}>
                  {isMobile && competition.length > 25 ? competition.substring(0, 25) + '...' : competition}
                </span>
                {getCategoryIcon(category)}
              </div>
              <span className="text-gray-400 text-sm font-normal">{matches.length} مباراة</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="bg-gray-800/20 border-t border-gray-700/30">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800/60 hover:bg-gray-800/60 border-b border-gray-700/30">
                  <TableHead className={`text-right text-gray-300 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>المضيف</TableHead>
                  <TableHead className={`text-center text-gray-300 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>النتيجة</TableHead>
                  <TableHead className={`text-left text-gray-300 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>الضيف</TableHead>
                  {!isMobile && <>
                      <TableHead className="text-center text-gray-300 font-bold text-sm">الوقت</TableHead>
                      <TableHead className="text-center text-gray-300 font-bold text-sm">الحالة</TableHead>
                    </>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match, index) => <MatchRow key={`${match.id}-${index}`} match={match} />)}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>;
  };
  const NewsCard = ({
    newsItem
  }: {
    newsItem: NewsItem;
  }) => <div onClick={() => handleNewsClick(newsItem)} className="bg-gradient-to-br from-gray-800/70 to-gray-700/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:bg-gradient-to-br hover:from-gray-700/80 hover:to-gray-600/80 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-lg hover:shadow-2xl group">
      {newsItem.image && newsItem.image !== '/placeholder.svg' && <div className="mb-4 rounded-xl overflow-hidden shadow-md">
          <img src={newsItem.image} alt={newsItem.title} className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${isMobile ? 'h-36' : 'h-48'}`} />
        </div>}

      <div className="space-y-4">
        {newsItem.category && <span className="inline-block bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-300 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/30">
            {newsItem.category}
          </span>}

        <h3 className={`font-bold text-white leading-relaxed line-clamp-2 group-hover:text-blue-300 transition-colors ${isMobile ? 'text-base' : 'text-lg'}`}>
          {newsItem.title}
        </h3>
        <p className={`text-gray-300 leading-relaxed line-clamp-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>
          {newsItem.description}
        </p>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
          <span className="text-xs text-gray-400 font-medium">{newsItem.source}</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs text-gray-400">{formatDate(newsItem.date)}</span>
            {newsItem.url && newsItem.url !== '#' && <ExternalLink size={12} className="text-blue-400" />}
          </div>
        </div>
      </div>
    </div>;
  const NewsModal = () => {
    if (!selectedNews) return null;
    return <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-600/50 shadow-2xl ${isMobile ? 'max-w-full' : 'max-w-2xl'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold text-white pr-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {selectedNews.title}
              </h2>
              <button onClick={() => setSelectedNews(null)} className="text-gray-400 hover:text-white transition-colors text-xl bg-gray-700/50 hover:bg-gray-600/50 w-8 h-8 rounded-full flex items-center justify-center">
                ✕
              </button>
            </div>

            {selectedNews.image && selectedNews.image !== '/placeholder.svg' && <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                <img src={selectedNews.image} alt={selectedNews.title} className={`w-full object-cover ${isMobile ? 'h-48' : 'h-64'}`} />
              </div>}

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span className="font-medium">{selectedNews.source}</span>
                <span>{formatDate(selectedNews.date)}</span>
              </div>

              {selectedNews.category && <span className="inline-block bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-bold border border-purple-500/30">
                  {selectedNews.category}
                </span>}

              <p className="text-gray-300 leading-relaxed">{selectedNews.description}</p>
              
              {selectedNews.content && selectedNews.content !== selectedNews.description && <div className="bg-gradient-to-r from-gray-700/40 to-gray-600/40 rounded-xl p-4 border border-gray-600/30">
                  <p className="text-gray-300 leading-relaxed">{selectedNews.content}</p>
                </div>}

              {selectedNews.url && selectedNews.url !== '#' && <button onClick={() => handleNewsUrlClick(selectedNews.url!)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                  <span>قراءة المقال كاملاً</span>
                  <ExternalLink size={16} />
                </button>}
            </div>
          </div>
        </div>
      </div>;
  };
  const EmptyState = ({
    type,
    message
  }: {
    type: string;
    message: string;
  }) => <div className="text-center py-16">
      <div className="mb-8">
        <SoccerPlayerAnimation />
      </div>
      <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <AlertCircle size={32} className="text-white" />
      </div>
      <p className={`text-gray-300 px-4 font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>{message}</p>
      <p className={`text-gray-500 mt-3 px-4 ${isMobile ? 'text-sm' : 'text-sm'}`}>
        يرجى المحاولة لاحقاً أو تحديث الصفحة
      </p>
    </div>;
  const currentMatches = allMatches[activeTab as keyof typeof allMatches] || [];
  const isTabLoading = !dataLoaded[activeTab as keyof typeof dataLoaded];
  const currentErrorMessage = errorMessages[activeTab as keyof typeof errorMessages];

  // تجميع المباريات حسب البطولة
  const groupedMatches = groupMatchesByCompetition(currentMatches);

  // ترتيب البطولات حسب الأولوية
  const sortedCompetitions = Object.keys(groupedMatches).sort((a, b) => getCompetitionPriority(a) - getCompetitionPriority(b));
  if (isLoading) {
    return <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
          <div className="text-center">
            <AnimatedSoccerBall size="w-16 h-16" className="mx-auto mb-4" />
            <LoadingSpinner />
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <AnimatedSoccerBall size={isMobile ? "w-10 h-10" : "w-12 h-12"} />
                {!isMobile && <div className="hidden md:block">
                    <SoccerPlayerAnimation />
                  </div>}
              </div>
              
              <div className="text-center flex-1">
                <h1 className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 ${isMobile ? 'text-xl' : 'text-4xl'}`}>
                  المباريات والأخبار
                </h1>
                <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  تابع أحدث المباريات والنتائج والأخبار الرياضية
                </p>
              </div>
              
              <button onClick={handleRefresh} disabled={isRefreshing} className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${isMobile ? 'p-3' : 'p-4'}`}>
                <RefreshCw size={isMobile ? 18 : 22} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gradient-to-r from-gray-800/70 to-gray-700/70 backdrop-blur-sm border-b border-gray-700/50 sticky top-[120px] z-30 shadow-md">
          <div className="container mx-auto px-2">
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)} className="w-full">
              <TabsList className={`grid w-full grid-cols-5 bg-gray-800/60 backdrop-blur-sm border border-gray-700/30 ${isMobile ? 'h-14' : 'h-16'} rounded-xl`}>
                {(['live', 'today', 'tomorrow', 'yesterday', 'news'] as const).map(tab => <TabsTrigger key={tab} value={tab} className={`flex flex-col items-center justify-center space-y-1 text-xs font-bold transition-all duration-300 rounded-lg ${activeTab === tab ? tab === 'live' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25' : tab === 'today' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25' : tab === 'tomorrow' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25' : tab === 'yesterday' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25' : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25' : 'text-gray-300 hover:text-white hover:bg-gray-700/60'} ${isMobile ? 'px-2 py-3' : 'px-4 py-4'}`}>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {getTabIcon(tab)}
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>
                        {getTabTitle(tab)}
                      </span>
                    </div>
                    <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded-full">
                      ({tab === 'news' ? news.length : allMatches[tab as keyof typeof allMatches].length})
                    </span>
                  </TabsTrigger>)}
              </TabsList>

              {/* Filters for matches */}
              {activeTab !== 'news' && <div className="flex items-center justify-center py-4 space-x-4 space-x-reverse">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm font-medium">فلترة حسب:</span>
                  </div>
                  <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value as CompetitionCategory)}>
                    <SelectTrigger className="w-64 bg-gray-800/60 border-gray-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('all')}
                          <span>{getCategoryName('all')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="arab" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('arab')}
                          <span>{getCategoryName('arab')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="european" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('european')}
                          <span>{getCategoryName('european')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="continental" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('continental')}
                          <span>{getCategoryName('continental')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="worldcup" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('worldcup')}
                          <span>{getCategoryName('worldcup')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>}

              {/* Content */}
              <div className="px-2 py-6 pb-24">
                {(['live', 'today', 'tomorrow', 'yesterday'] as const).map(tab => <TabsContent key={tab} value={tab}>
                    {isTabLoading ? <div className="text-center py-16">
                        <AnimatedSoccerBall size="w-12 h-12" className="mx-auto mb-4" />
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium">جاري التحميل...</p>
                      </div> : sortedCompetitions.length === 0 ? <EmptyState type={tab} message={errorMessages[tab] || `لا توجد مباريات ${getTabTitle(tab)} في ${getCategoryName(selectedCategory)}`} /> : <div className="space-y-6">
                        <div className="flex items-center space-x-3 space-x-reverse mb-6">
                          {getCategoryIcon(selectedCategory)}
                          <AnimatedSoccerBall size="w-6 h-6" />
                          <h2 className={`font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                            {getCategoryName(selectedCategory)}
                          </h2>
                          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                        </div>
                        <Accordion type="multiple" className="space-y-4">
                          {sortedCompetitions.map(competition => <CompetitionSection key={competition} competition={competition} matches={groupedMatches[competition]} />)}
                        </Accordion>
                      </div>}
                  </TabsContent>)}

                <TabsContent value="news">
                  {!dataLoaded.news ? <div className="text-center py-16">
                      <AnimatedSoccerBall size="w-12 h-12" className="mx-auto mb-4" />
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400 font-medium">جاري التحميل...</p>
                    </div> : news.length === 0 ? <EmptyState type="news" message={errorMessages.news || 'لا توجد أخبار متاحة حالياً'} /> : <div className="space-y-6">
                      <div className="flex items-center space-x-3 space-x-reverse mb-6">
                        <Newspaper className="w-6 h-6 text-purple-400" />
                        <AnimatedSoccerBall size="w-6 h-6" />
                        <h2 className={`font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                          الأخبار الرياضية
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                      </div>
                      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {news.map(newsItem => <NewsCard key={newsItem.id} newsItem={newsItem} />)}
                      </div>
                    </div>}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <NewsModal />
      </div>
    </Layout>;
};
export default Matches;