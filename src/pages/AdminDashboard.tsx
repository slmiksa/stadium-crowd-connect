
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AdminGuard from '@/components/AdminGuard';
import UsersManagement from '@/components/admin/UsersManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';
import StatsOverview from '@/components/admin/StatsOverview';
import PasswordChange from '@/components/admin/PasswordChange';
import HashtagsManagement from '@/components/admin/HashtagsManagement';
import { 
  LogOut, 
  Users, 
  Flag, 
  BarChart3, 
  Settings,
  Shield,
  Hash
} from 'lucide-react';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const admin = localStorage.getItem('admin_user');
    if (admin) {
      setAdminData(JSON.parse(admin));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    toast({
      title: 'تم تسجيل الخروج',
      description: 'تم تسجيل خروجك بنجاح'
    });
    navigate('/admin/login');
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
        {/* Header - محسن للجوال */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
              <div>
                <h1 className="text-lg md:text-2xl font-bold">لوحة تحكم السوبر أدمن</h1>
                <p className="text-zinc-400 text-sm">مرحباً {adminData?.username}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-white border-zinc-700 hover:bg-zinc-800 text-xs md:text-sm"
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Main Content - محسن للجوال */}
        <div className="max-w-7xl mx-auto p-3 md:p-6 pb-6">
          <Tabs defaultValue="stats" className="space-y-4 md:space-y-6">
            {/* Tabs Navigation - محسن للجوال */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-5 bg-zinc-900 min-w-[500px]">
                <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600 text-xs md:text-sm">
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  الإحصائيات
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 text-xs md:text-sm">
                  <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  المستخدمين
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 text-xs md:text-sm">
                  <Flag className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  البلاغات
                </TabsTrigger>
                <TabsTrigger value="hashtags" className="data-[state=active]:bg-blue-600 text-xs md:text-sm">
                  <Hash className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  الهاشتاقات
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 text-xs md:text-sm">
                  <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  الإعدادات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="overflow-hidden">
              <TabsContent value="stats">
                <StatsOverview />
              </TabsContent>

              <TabsContent value="users">
                <UsersManagement />
              </TabsContent>

              <TabsContent value="reports">
                <ReportsManagement />
              </TabsContent>

              <TabsContent value="hashtags">
                <HashtagsManagement />
              </TabsContent>

              <TabsContent value="settings">
                <PasswordChange adminId={adminData?.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;
