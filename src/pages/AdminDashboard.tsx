import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Hash, 
  Shield, 
  Key,
  Megaphone,
  MessageSquare
} from 'lucide-react';

// Import admin components
import StatsOverview from '@/components/admin/StatsOverview';
import UsersManagement from '@/components/admin/UsersManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';
import HashtagsManagement from '@/components/admin/HashtagsManagement';
import AdvertisementsManagement from '@/components/admin/AdvertisementsManagement';
import AdRequestsManagement from '@/components/admin/AdRequestsManagement';
import PasswordChange from '@/components/admin/PasswordChange';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  
  // Check if user is admin
  const adminData = localStorage.getItem('admin_user');
  if (!adminData) {
    return <Navigate to="/admin-login" replace />;
  }

  const admin = JSON.parse(adminData);

  const tabs = [
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'reports', label: 'البلاغات', icon: FileText },
    { id: 'hashtags', label: 'الهاشتاغات', icon: Hash },
    { id: 'advertisements', label: 'الإعلانات', icon: Megaphone },
    { id: 'ad-requests', label: 'طلبات الإعلانات', icon: MessageSquare },
    { id: 'password', label: 'كلمة المرور', icon: Key },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return <StatsOverview />;
      case 'users':
        return <UsersManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'hashtags':
        return <HashtagsManagement />;
      case 'advertisements':
        return <AdvertisementsManagement />;
      case 'ad-requests':
        return <AdRequestsManagement />;
      case 'password':
        return <PasswordChange adminId={admin.id} />;
      default:
        return <StatsOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-700 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse mb-8">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
                <p className="text-zinc-400 text-sm">مرحباً {admin.username}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`w-full justify-start text-right ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IconComponent className="h-4 w-4 ml-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Card className="bg-zinc-900 border-zinc-800 min-h-[calc(100vh-3rem)]">
            <CardContent className="p-6">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
