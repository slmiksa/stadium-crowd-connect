
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
import { 
  LogOut, 
  Users, 
  Flag, 
  BarChart3, 
  Settings,
  Shield
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
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">لوحة تحكم السوبر أدمن</h1>
                <p className="text-zinc-400">مرحباً {adminData?.username}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-white border-zinc-700 hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-zinc-900">
              <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                الإحصائيات
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
                <Users className="h-4 w-4 mr-2" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600">
                <Flag className="h-4 w-4 mr-2" />
                البلاغات
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
                <Settings className="h-4 w-4 mr-2" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <StatsOverview />
            </TabsContent>

            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsManagement />
            </TabsContent>

            <TabsContent value="settings">
              <PasswordChange adminId={adminData?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;
