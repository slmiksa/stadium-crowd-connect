import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { ArrowRight, Clock, Users, MapPin, Target, CreditCard, UserCheck, TrendingUp } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  number: number;
}

interface Goal {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
}

interface Card {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
}

interface Lineup {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  formation: string;
  startXI: Array<{
    player: Player;
  }>;
  substitutes: Array<{
    player: Player;
  }>;
}

interface MatchDetails {
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
  goals?: Goal[];
  cards?: Card[];
  lineups?: Lineup[];
  statistics?: any[];
}

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'lineups' | 'stats'>('overview');

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching details for match ID:', matchId);
      
      // جلب المباراة من قائمة المباريات
      const { data, error } = await supabase.functions.invoke('get-football-match-details', {
        body: { matchId }
      });

      console.log('Match details response:', data, error);

      if (data && data.match) {
        setMatch(data.match);
      } else {
        console.log('No match details found');
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setIsLoading(false);
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
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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

  const getCardIcon = (type: string) => {
    if (type === 'Yellow Card') return '🟨';
    if (type === 'Red Card') return '🟥';
    return '🟨';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-300 text-xl font-medium">جاري تحميل تفاصيل المباراة...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900">
          <div className="p-4">
            <button
              onClick={() => navigate('/matches')}
              className="flex items-center text-blue-400 mb-4 hover:text-blue-300 transition-colors"
            >
              <ArrowRight size={20} className="ml-2" />
              العودة للمباريات
            </button>
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center bg-gray-800/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50">
                <div className="text-6xl mb-6 opacity-50">⚽</div>
                <p className="text-gray-300 text-xl mb-3 font-medium">لم يتم العثور على المباراة</p>
                <p className="text-gray-500 text-base">تحقق من رقم المباراة أو جرب مرة أخرى</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate('/matches')}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowRight size={20} className="ml-2" />
              العودة
            </button>
            <h1 className="text-xl font-bold text-white">تفاصيل المباراة</h1>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Competition Badge */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 space-x-reverse bg-blue-600/15 border border-blue-500/25 rounded-2xl px-6 py-3">
              {match.leagueFlag && (
                <img src={match.leagueFlag} alt="" className="w-6 h-4 object-cover rounded shadow-sm" />
              )}
              <span className="text-blue-300 font-bold text-base">{match.competition}</span>
            </div>
          </div>

          {/* Match Header */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50">
            {/* Teams and Score */}
            <div className="flex items-center justify-between mb-6">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-gray-700/40 rounded-2xl p-3 mx-auto mb-3 flex items-center justify-center border border-gray-600/30">
                  {match.homeLogo ? (
                    <img src={match.homeLogo} alt={match.homeTeam} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                  )}
                </div>
                <p className="font-bold text-white text-lg mb-1">{match.homeTeam}</p>
                <p className="text-gray-400 text-sm">الفريق المضيف</p>
              </div>

              {/* Score and Status */}
              <div className="mx-6 text-center min-w-[140px]">
                {match.status === 'live' && (
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></div>
                    <span className="text-red-400 text-sm font-bold">مباشر</span>
                    {match.minute && (
                      <span className="text-red-400 text-xs mr-2 bg-red-500/20 px-2 py-1 rounded-lg">
                        {match.minute}'
                      </span>
                    )}
                  </div>
                )}
                
                <div className="bg-gray-700/50 rounded-2xl px-4 py-3 border border-gray-600/40">
                  {match.homeScore !== null && match.homeScore !== undefined && 
                   match.awayScore !== null && match.awayScore !== undefined ? (
                    <div className="text-3xl font-bold text-white">
                      {match.homeScore} - {match.awayScore}
                    </div>
                  ) : (
                    <div className="text-gray-300 text-xl font-medium">
                      {match.status === 'upcoming' ? formatTime(match.date) : 'vs'}
                    </div>
                  )}
                </div>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-gray-700/40 rounded-2xl p-3 mx-auto mb-3 flex items-center justify-center border border-gray-600/30">
                  {match.awayLogo ? (
                    <img src={match.awayLogo} alt={match.awayTeam} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                  )}
                </div>
                <p className="font-bold text-white text-lg mb-1">{match.awayTeam}</p>
                <p className="text-gray-400 text-sm">الفريق الضيف</p>
              </div>
            </div>

            {/* Match Info */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-400">
                  <Clock size={16} className="ml-2 text-blue-400" />
                  <span>التوقيت: {formatTime(match.date)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Users size={16} className="ml-2 text-green-400" />
                  <span>الحالة: {getMatchStatus(match.status)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center text-gray-500 text-sm">
                <MapPin size={16} className="ml-2 text-purple-400" />
                <span>التاريخ: {formatDate(match.date)}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-1 border border-gray-700/50">
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-3 px-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center ${
                  activeTab === 'events'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Target size={16} className="ml-1" />
                الأحداث
              </button>
              <button
                onClick={() => setActiveTab('lineups')}
                className={`py-3 px-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center ${
                  activeTab === 'lineups'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <UserCheck size={16} className="ml-1" />
                التشكيلة
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-3 px-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center ${
                  activeTab === 'stats'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <TrendingUp size={16} className="ml-1" />
                الإحصائيات
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="pb-6">
            {activeTab === 'overview' && (
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                  <MapPin size={20} className="ml-2 text-blue-400" />
                  معلومات المباراة
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700/30">
                    <span className="text-gray-400">معرف المباراة</span>
                    <span className="text-white font-medium">{match.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700/30">
                    <span className="text-gray-400">البطولة</span>
                    <span className="text-white font-medium">{match.competition}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700/30">
                    <span className="text-gray-400">الحالة</span>
                    <span className={`font-medium ${
                      match.status === 'live' ? 'text-red-400' : 
                      match.status === 'finished' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {getMatchStatus(match.status)}
                    </span>
                  </div>
                  {match.minute && match.status === 'live' && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-400">الدقيقة</span>
                      <span className="text-red-400 font-bold bg-red-500/20 px-3 py-1 rounded-lg">
                        {match.minute}'
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {/* Goals */}
                {match.goals && match.goals.length > 0 && (
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                      <Target size={20} className="ml-2" />
                      الأهداف ({match.goals.length})
                    </h3>
                    <div className="space-y-3">
                      {match.goals.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700/40 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-600/20 border border-green-500/40 flex items-center justify-center ml-3">
                              <span className="text-green-400 text-xs font-bold">⚽</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{goal.player.name}</div>
                              {goal.assist && (
                                <div className="text-gray-400 text-sm">تمريرة: {goal.assist.name}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-white font-bold">{goal.time.elapsed}'</div>
                            <div className="text-gray-400 text-sm">{goal.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cards */}
                {match.cards && match.cards.length > 0 && (
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                      <CreditCard size={20} className="ml-2" />
                      الكروت ({match.cards.length})
                    </h3>
                    <div className="space-y-3">
                      {match.cards.map((card, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700/40 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-yellow-600/20 border border-yellow-500/40 flex items-center justify-center ml-3">
                              <span className="text-xl">{getCardIcon(card.type)}</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{card.player.name}</div>
                              <div className="text-gray-400 text-sm">{card.detail}</div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-white font-bold">{card.time.elapsed}'</div>
                            <div className="text-gray-400 text-sm">{card.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!match.goals || match.goals.length === 0) && (!match.cards || match.cards.length === 0) && (
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50 text-center">
                    <div className="text-4xl mb-4 opacity-50">📝</div>
                    <p className="text-gray-400 text-lg">لا توجد أحداث مسجلة حتى الآن</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lineups' && (
              <div className="space-y-6">
                {match.lineups && match.lineups.length > 0 ? (
                  match.lineups.map((lineup, index) => (
                    <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                        <UserCheck size={20} className="ml-2" />
                        {lineup.team.name} - {lineup.formation}
                      </h3>
                      
                      {/* Starting XI */}
                      <div className="mb-6">
                        <h4 className="text-blue-400 font-medium mb-3">التشكيلة الأساسية</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lineup.startXI.map((playerData, playerIndex) => (
                            <div key={playerIndex} className="flex items-center bg-gray-700/40 rounded-lg p-3">
                              <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center ml-3">
                                <span className="text-blue-400 text-xs font-bold">{playerData.player.number}</span>
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">{playerData.player.name}</div>
                                <div className="text-gray-400 text-xs">{playerData.player.position}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Substitutes */}
                      <div>
                        <h4 className="text-green-400 font-medium mb-3">البدلاء</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lineup.substitutes.map((playerData, playerIndex) => (
                            <div key={playerIndex} className="flex items-center bg-gray-700/40 rounded-lg p-3">
                              <div className="w-8 h-8 bg-green-600/20 border border-green-500/40 rounded-full flex items-center justify-center ml-3">
                                <span className="text-green-400 text-xs font-bold">{playerData.player.number}</span>
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">{playerData.player.name}</div>
                                <div className="text-gray-400 text-xs">{playerData.player.position}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50 text-center">
                    <div className="text-4xl mb-4 opacity-50">👥</div>
                    <p className="text-gray-400 text-lg">التشكيلة غير متوفرة حالياً</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                {match.statistics && match.statistics.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg mb-4">إحصائيات المباراة</h3>
                    {/* Statistics will be implemented when available from API */}
                    <p className="text-gray-400">الإحصائيات ستكون متوفرة قريباً</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4 opacity-50">📊</div>
                    <p className="text-gray-400 text-lg">الإحصائيات غير متوفرة حالياً</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MatchDetails;
