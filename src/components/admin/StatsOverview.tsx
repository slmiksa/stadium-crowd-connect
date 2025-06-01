
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Hash, MessageCircle, Home, Flag } from 'lucide-react';

interface Stats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  total_rooms: number;
  total_messages: number;
  total_reports: number;
  pending_reports: number;
}

const StatsOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_app_statistics');
      
      if (error) {
        console.error('Error fetching stats:', error);
      } else if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
              <div className="h-8 bg-zinc-700 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'إجمالي المنشورات',
      value: stats?.total_posts || 0,
      icon: Hash,
      color: 'text-green-400'
    },
    {
      title: 'إجمالي التعليقات',
      value: stats?.total_comments || 0,
      icon: MessageSquare,
      color: 'text-yellow-400'
    },
    {
      title: 'غرف الدردشة',
      value: stats?.total_rooms || 0,
      icon: Home,
      color: 'text-purple-400'
    },
    {
      title: 'إجمالي الرسائل',
      value: stats?.total_messages || 0,
      icon: MessageCircle,
      color: 'text-indigo-400'
    },
    {
      title: 'إجمالي البلاغات',
      value: stats?.total_reports || 0,
      icon: Flag,
      color: 'text-orange-400'
    },
    {
      title: 'البلاغات المعلقة',
      value: stats?.pending_reports || 0,
      icon: Flag,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">إحصائيات التطبيق</h2>
        <p className="text-zinc-400">نظرة عامة على جميع بيانات التطبيق</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StatsOverview;
