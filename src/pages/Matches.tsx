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
import { Clock, Users, RefreshCw, Newspaper, ExternalLink, AlertCircle, Filter, Globe, Trophy, MapPin, Zap, Calendar, Star } from 'lucide-react';

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

type CompetitionCategory = 'saudi' | 'european' | 'continental' | 'worldcup' | 'all';
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

  // تصنيف البطولات المحسن - أولوية لكأس العالم للأندية
  const getCompetitionCategory = (competition: string): CompetitionCategory => {
    const competitionLower = competition.toLowerCase();
    
    // كأس العالم والأندية - أولوية قصوى
    const worldcupCompetitions = [
      'fifa club world cup', 'club world cup', 'cwc',
      'world cup', 'fifa world cup',
      'world cup qualification', 'fifa world cup qualification', 'world cup qualifiers',
      'wc qualification'
    ];
    
    // البطولات السعودية
    const saudiCompetitions = [
      'saudi pro league', 'saudi professional league', 'king cup', 'saudi super cup',
      'roshn saudi league'
    ];
    
    // البطولات الأوروبية المهمة
    const europeanCompetitions = [
      'premier league', 'english premier league', 'epl',
      'la liga', 'laliga', 'spanish la liga',
      'bundesliga', 'german bundesliga',
      'serie a', 'italian serie a',
      'ligue 1', 'french ligue 1',
      'fa cup', 'copa del rey', 'dfb pokal', 'dfb-pokal', 'coppa italia', 'coupe de france'
    ];
    
    // البطولات القارية المهمة
    const continentalCompetitions = [
      'champions league', 'uefa champions league',
      'europa league', 'uefa europa league',
      'conference league', 'uefa conference league',
      'afc champions league', 'afc champions league elite', 'asian champions league',
      'uefa nations league', 'european championship', 'uefa european championship',
      'euro 2024', 'uefa euro',
      'asian cup', 'afc asian cup',
      'copa america', 'conmebol copa america'
    ];

    // فحص دقيق للبطولات بأولوية كأس العالم للأندية
    if (worldcupCompetitions.some(comp => competitionLower.includes(comp)) || 
        competitionLower.includes('world cup') || 
        competitionLower.includes('club world cup')) return 'worldcup';
    
    if (saudiCompetitions.some(comp => competitionLower.includes(comp))) return 'saudi';
    if (europeanCompetitions.some(comp => competitionLower.includes(comp))) return 'european';
    if (continentalCompetitions.some(comp => competitionLower.includes(comp))) return 'continental';

    // فلترة البطولات غير المهمة
    const ignoredCompetitions = [
      'ghana', 'nigeria', 'south africa', 'kenya', 'uganda', 'tanzania',
      'youth', 'u20', 'u19', 'u18', 'u17', 'women', 'reserve',
      'second division', 'third division', 'amateur'
    ];
    
    if (ignoredCompetitions.some(ignored => competitionLower.includes(ignored))) {
      return 'all'; // سيتم تصفيتها لاحقاً
    }

    return 'all';
  };

  // ترتيب البطولات حسب الأولوية - كأس العالم للأندية في المقدمة
  const getCompetitionPriority = (competition: string): number => {
    const competitionLower = competition.toLowerCase();
    const priorities: { [key: string]: number } = {
      // كأس العالم للأندية - أولوية قصوى
      'FIFA Club World Cup': 1,
      'Club World Cup': 1,
      
      // كأس العالم
      'FIFA World Cup': 2,
      'World Cup': 2,
      
      // البطولات السعودية
      'Saudi Pro League': 5,
      'Saudi Professional League': 5,
      'Roshn Saudi League': 5,
      'King Cup': 6,
      'Saudi Super Cup': 7,
      
      // دوري أبطال أوروبا
      'UEFA Champions League': 10,
      'Champions League': 10,
      
      // الدوريات الأوروبية الكبرى
      'Premier League': 15,
      'English Premier League': 15,
      'La Liga': 16,
      'LaLiga': 16,
      'Bundesliga': 17,
      'Serie A': 18,
      'Ligue 1': 19,
      
      // البطولات القارية
      'AFC Champions League Elite': 25,
      'AFC Champions League': 25,
      'UEFA Europa League': 30,
      'Europa League': 30,
      
      // تصفيات كأس العالم
      'World Cup Qualification': 40,
      
      // كؤوس محلية
      'FA Cup': 50,
      'Copa del Rey': 51,
      'DFB Pokal': 52,
      'Coppa Italia': 53,
      'Coupe de France': 54
    };
    
    // فحص خاص لكأس العالم للأندية
    if (competitionLower.includes('club world cup') || competitionLower.includes('fifa club world cup')) {
      return 1;
    }
    
    return priorities[competition] || 999;
  };

  // تصفية المباريات للبطولات المهمة فقط
  const filterMatchesByCategory = (matches: Match[]): Match[] => {
    // تصفية البطولات غير المهمة أولاً
    const importantMatches = matches.filter(match => {
      const category = getCompetitionCategory(match.competition);
      const competitionLower = match.competition.toLowerCase();
      
      // إزالة البطولات غير المهمة
      const ignoredKeywords = [
        'youth', 'u20', 'u19', 'u18', 'u17', 'women', 'reserve',
        'ghana', 'nigeria', 'south africa', 'kenya', 'uganda', 'tanzania',
        'second division', 'third division', 'amateur'
      ];
      
      if (ignoredKeywords.some(keyword => competitionLower.includes(keyword))) {
        return false;
      }
      
      // الاحتفاظ بالبطولات المهمة فقط
      return category !== 'all' || getCompetitionPriority(match.competition) < 900;
    });

    if (selectedCategory === 'all') return importantMatches;
    
    return importantMatches.filter(match => {
      const category = getCompetitionCategory(match.competition);
      return category === selectedCategory;
    });
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

    // ترتيب المباريات داخل كل بطولة
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

      // جلب المباريات المباشرة أولاً
      const livePromise = fetchMatchData('live');
      const newsPromise = fetchNewsData();

      await Promise.all([livePromise, newsPromise]);

      // جلب باقي البيانات
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
      console.log(`=== جلب مباريات ${status} ===`);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 20000)
      );

      const today = new Date();
      let targetDate = today;
      let apiStatus = 'upcoming';
      
      if (status === 'live') {
        apiStatus = 'live';
        console.log('جلب المباريات المباشرة...');
      } else if (status === 'today') {
        apiStatus = 'upcoming';
        targetDate = today;
        console.log('جلب مباريات اليوم...');
      } else if (status === 'tomorrow') {
        apiStatus = 'upcoming';
        targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        console.log('جلب مباريات الغد...');
      } else if (status === 'yesterday') {
        apiStatus = 'finished';
        targetDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        console.log('جلب مباريات الأمس...');
      }

      const dataPromise = supabase.functions.invoke('get-football-matches', {
        body: {
          status: apiStatus,
          date: targetDate.toISOString().split('T')[0],
          forceRefresh: true // إجبار التحديث
        }
      });

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

      if (error) {
        console.error(`خطأ في API ${status}:`, error);
        throw error;
      }

      console.log(`استجابة API ${status}:`, data);

      if (data?.success && data?.matches) {
        console.log(`تم جلب ${data.matches.length} مباراة للحالة ${status}`);
        setAllMatches(prev => ({
          ...prev,
          [status]: data.matches
        }));
        setErrorMessages(prev => ({
          ...prev,
          [status]: ''
        }));
      } else {
        console.log(`لا توجد مباريات للحالة ${status}`);
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
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 15000)
      );

      const dataPromise = supabase.functions.invoke('get-football-news', {
        body: { limit: 20 }
      });

      const { data } = await Promise.race([dataPromise, timeoutPromise]) as any;

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
    console.log('=== تحديث البيانات ===');
    await fetchInitialData();
    setIsRefreshing(false);
  };

  const handleMatchClick = (match: Match) => {
    navigate(`/match-details/${match.id}`, {
      state: { match, matchData: match }
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
      case 'live': return 'مباشر';
      case 'upcoming': return 'قادمة';
      case 'finished': return 'انتهت';
      default: return status;
    }
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'live': return 'مباشر';
      case 'today': return 'اليوم';
      case 'tomorrow': return 'غداً';
      case 'yesterday': return 'أمس';
      case 'news': return 'أخبار';
      default: return tab;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'live': return <Zap className="w-4 h-4" />;
      case 'today': return <Calendar className="w-4 h-4" />;
      case 'tomorrow': return <Clock className="w-4 h-4" />;
      case 'yesterday': return <Calendar className="w-4 h-4" />;
      case 'news': return <Newspaper className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: CompetitionCategory) => {
    switch (category) {
      case 'saudi': return <Star className="w-4 h-4 text-green-400" />;
      case 'european': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'continental': return <Trophy className="w-4 h-4 text-purple-400" />;
      case 'worldcup': return <Trophy className="w-4 h-4 text-yellow-400" />;
      default: return <Filter className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: CompetitionCategory) => {
    switch (category) {
      case 'saudi': return 'البطولات السعودية';
      case 'european': return 'الدوريات الأوروبية';
      case 'continental': return 'البطولات القارية';
      case 'worldcup': return 'كأس العالم والأندية';
      default: return 'جميع البطولات المهمة';
    }
  };

  const AnimatedSoccerBall = ({
    size = "w-8 h-8",
    className = ""
  }: {
    size?: string;
    className?: string;
  }) => {
    return <div className={`${size} ${className} relative animate-spin`}>
        <div className="w-full h-full bg-white rounded-full border-2 border-gray-800 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
        </div>
      </div>;
  };

  const SoccerPlayerAnimation = () => <div className="flex items-center justify-center py-8">
      <div className="relative">
        <AnimatedSoccerBall size="w-10 h-10" className="animate-pulse" />
        <div className="absolute -right-16 top-0 animate-bounce delay-75"></div>
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
            <span className={`font-bold px-3 py-1 rounded-lg text-xs border ${
              match.status === 'live' 
                ? 'text-red-400 bg-red-500/20 border-red-500/30' 
                : match.status === 'finished' 
                ? 'text-green-400 bg-green-500/20 border-green-500/30' 
                : 'text-blue-400 bg-blue-500/20 border-blue-500/30'
            }`}>
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
    const priority = getCompetitionPriority(competition);
    const isHighPriority = priority <= 20;
    const isClubWorldCup = competition.toLowerCase().includes('club world cup');
    
    return <AccordionItem value={competition} className={`border rounded-xl overflow-hidden mb-4 backdrop-blur-sm ${
      isClubWorldCup 
        ? 'border-yellow-400/60 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 shadow-lg shadow-yellow-500/20' 
        : isHighPriority 
        ? 'border-yellow-500/40 bg-gradient-to-r from-yellow-900/20 to-amber-900/20' 
        : 'border-gray-700/30 bg-gradient-to-r from-gray-800/40 to-gray-700/40'
    }`}>
        <AccordionTrigger className={`font-bold px-6 py-4 transition-all duration-300 ${
          isClubWorldCup 
            ? 'text-yellow-200 hover:text-yellow-100' 
            : isHighPriority 
            ? 'text-yellow-300 hover:text-yellow-200' 
            : 'text-gray-300 hover:text-gray-200'
        } ${isMobile ? 'text-sm' : 'text-base'}`}>
          <div className="flex items-center space-x-4 space-x-reverse w-full">
            {matches[0]?.leagueFlag && <div className="relative">
                <img src={matches[0].leagueFlag} alt="" className="w-8 h-6 object-cover rounded-md shadow-md border border-gray-600/50" />
              </div>}
            
            {isClubWorldCup && <div className="flex items-center space-x-2 space-x-reverse">
                <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
                <span className="text-xs bg-yellow-400/30 text-yellow-200 px-2 py-1 rounded-full border border-yellow-400/40">
                  🏆 يبدأ غداً
                </span>
              </div>}
            
            {isHighPriority && !isClubWorldCup && <Star className="w-5 h-5 text-yellow-400" />}
            {getCategoryIcon(category)}
            
            <div className="text-right flex-1">
              <div className="flex items-center justify-between">
                <span className={isMobile ? 'text-sm' : 'text-base'}>
                  {isMobile && competition.length > 25 ? competition.substring(0, 25) + '...' : competition}
                </span>
                {isClubWorldCup && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full border border-yellow-400/30 animate-pulse">
                    🏆 استثنائية
                  </span>
                )}
                {isHighPriority && !isClubWorldCup && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full border border-yellow-400/30">
                    مهمة
                  </span>
                )}
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

  // ترتيب البطولات حسب الأولوية - كأس العالم للأندية في المقدمة
  const sortedCompetitions = Object.keys(groupedMatches).sort((a, b) => 
    getCompetitionPriority(a) - getCompetitionPriority(b)
  );

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
                <div className="text-center">
                  <h1 className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                    المباريات والأخبار
                  </h1>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    🏆 كأس العالم للأندية يبدأ غداً!
                  </p>
                </div>
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className={`grid w-full grid-cols-5 bg-gray-800/60 backdrop-blur-sm border border-gray-700/30 ${isMobile ? 'h-14' : 'h-16'} rounded-xl`}>
                {(['live', 'today', 'tomorrow', 'yesterday', 'news'] as const).map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab} 
                    className={`flex flex-col items-center justify-center space-y-1 text-xs font-bold transition-all duration-300 rounded-lg ${
                      activeTab === tab 
                        ? tab === 'live' 
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25' 
                          : tab === 'today' 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                          : tab === 'tomorrow' 
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/25' 
                          : tab === 'yesterday' 
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/25' 
                          : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/60'
                    } ${isMobile ? 'px-2 py-3' : 'px-4 py-4'}`}
                  >
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {getTabIcon(tab)}
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>
                        {getTabTitle(tab)}
                      </span>
                    </div>
                    <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded-full">
                      ({tab === 'news' ? news.length : allMatches[tab as keyof typeof allMatches].length})
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Filters for matches */}
              {activeTab !== 'news' && (
                <div className="flex items-center justify-center py-4 space-x-4 space-x-reverse">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm font-medium">البطولات المهمة:</span>
                  </div>
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CompetitionCategory)}>
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
                      <SelectItem value="worldcup" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('worldcup')}
                          <span>{getCategoryName('worldcup')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="saudi" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getCategoryIcon('saudi')}
                          <span>{getCategoryName('saudi')}</span>
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
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Content */}
              <div className="px-2 py-6 pb-24">
                {(['live', 'today', 'tomorrow', 'yesterday'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    {isTabLoading ? (
                      <div className="text-center py-16">
                        <AnimatedSoccerBall size="w-12 h-12" className="mx-auto mb-4" />
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium">جاري التحميل...</p>
                      </div>
                    ) : sortedCompetitions.length === 0 ? (
                      <EmptyState 
                        type={tab} 
                        message={errorMessages[tab] || `لا توجد مباريات ${getTabTitle(tab)} في ${getCategoryName(selectedCategory)}`} 
                      />
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3 space-x-reverse mb-6">
                          {getCategoryIcon(selectedCategory)}
                          <AnimatedSoccerBall size="w-6 h-6" />
                          <h2 className={`font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                            {getCategoryName(selectedCategory)}
                          </h2>
                          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                          <span className="text-sm text-gray-400 bg-blue-500/10 px-3 py-1 rounded-full">
                            {sortedCompetitions.length} بطولة
                          </span>
                        </div>
                        
                        <Accordion type="multiple" className="space-y-4">
                          {sortedCompetitions.map((competition) => (
                            <CompetitionSection 
                              key={competition} 
                              competition={competition} 
                              matches={groupedMatches[competition]} 
                            />
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </TabsContent>
                ))}

                <TabsContent value="news">
                  {!dataLoaded.news ? (
                    <div className="text-center py-16">
                      <AnimatedSoccerBall size="w-12 h-12" className="mx-auto mb-4" />
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400 font-medium">جاري التحميل...</p>
                    </div>
                  ) : news.length === 0 ? (
                    <EmptyState type="news" message={errorMessages.news || 'لا توجد أخبار متاحة حالياً'} />
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 space-x-reverse mb-6">
                        <Newspaper className="w-6 h-6 text-purple-400" />
                        <AnimatedSoccerBall size="w-6 h-6" />
                        <h2 className={`font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                          الأخبار الرياضية
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                      </div>
                      
                      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {news.map((newsItem) => (
                          <NewsCard key={newsItem.id} newsItem={newsItem} />
                        ))}
                      </div>
                    </div>
                  )}
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
