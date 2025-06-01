
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

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
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        {/* Header - محسن للجوال */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-3 md:p-4 sticky top-0 z-50 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Shield className="h-5 w-5 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base md:text-2xl font-bold truncate">لوحة تحكم السوبر أدمن</h1>
                <p className="text-zinc-400 text-xs md:text-sm truncate">مرحباً {adminData?.username}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="text-white border-zinc-700 hover:bg-zinc-800 text-xs md:text-sm flex-shrink-0"
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              {!isMobile && "خروج"}
            </Button>
          </div>
        </div>

        {/* Main Content - مع scroll محسن */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full p-3 md:p-6 flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="stats" className="flex-1 flex flex-col min-h-0">
              {/* Tabs Navigation - محسن للجوال */}
              <div className="flex-shrink-0 mb-4 md:mb-6">
                <ScrollArea className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-zinc-900 min-w-[500px] h-auto">
                    <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600 text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">الإحصائيات</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <Users className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">المستخدمين</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <Flag className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">البلاغات</span>
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="data-[state=active]:bg-blue-600 text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <Hash className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">الهاشتاقات</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row items-center gap-1 md:gap-2">
                      <Settings className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">الإعدادات</span>
                    </TabsTrigger>
                  </TabsList>
                </ScrollArea>
              </div>

              {/* Tab Contents - مع scroll محسن */}
              <div className="flex-1 min-h-0">
                <TabsContent value="stats" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="pr-4">
                      <StatsOverview />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="users" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="pr-4">
                      <UsersManagement />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="reports" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="pr-4">
                      <ReportsManagement />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="hashtags" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="pr-4">
                      <HashtagsManagement />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="settings" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="pr-4">
                      <PasswordChange adminId={adminData?.id} />
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;
