
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Settings, Edit, Users, Hash, MessageSquare, LogOut } from 'lucide-react';

const Profile = () => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const stats = [
    { label: t('followers'), value: user?.followers || 0, icon: Users },
    { label: t('following'), value: user?.following || 0, icon: Users },
    { label: t('posts'), value: 23, icon: Hash }
  ];

  const handleLanguageToggle = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('profile')}</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Settings size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user?.username}</h2>
              <p className="text-zinc-400">{user?.email}</p>
              {user?.favoriteTeam && (
                <p className="text-blue-400 text-sm mt-1">
                  ⚽ {user.favoriteTeam}
                </p>
              )}
            </div>
            
            {/* Edit Button */}
            <button className="p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">
              <Edit size={18} className="text-zinc-300" />
            </button>
          </div>

          {/* Bio */}
          <p className="text-zinc-300 mb-4">
            {user?.bio || (isRTL ? 'مشجع رياضي عاشق للكرة' : 'Sports enthusiast and football lover')}
          </p>

          {/* Stats */}
          <div className="flex justify-around py-4 border-t border-zinc-700">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors">
            <Hash size={24} className="text-blue-400 mx-auto mb-2" />
            <p className="text-white font-medium">
              {isRTL ? 'منشوراتي' : 'My Posts'}
            </p>
          </button>
          
          <button className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors">
            <MessageSquare size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-white font-medium">
              {isRTL ? 'غرفي' : 'My Rooms'}
            </p>
          </button>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-6">{t('settings')}</h2>
              
              <div className="space-y-4">
                {/* Language Setting */}
                <div className="flex items-center justify-between py-3 border-b border-zinc-700">
                  <span className="text-white">
                    {isRTL ? 'اللغة' : 'Language'}
                  </span>
                  <button
                    onClick={handleLanguageToggle}
                    className="px-3 py-1 bg-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors"
                  >
                    {language === 'ar' ? 'العربية' : 'English'}
                  </button>
                </div>

                {/* Account Info */}
                <div className="py-3 border-b border-zinc-700">
                  <p className="text-zinc-400 text-sm">{isRTL ? 'معلومات الحساب' : 'Account Information'}</p>
                  <p className="text-white">{user?.email}</p>
                  <p className="text-zinc-300 text-sm">{isRTL ? 'منذ:' : 'Member since:'} {isRTL ? 'مايو 2024' : 'May 2024'}</p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut size={18} />
                  <span>{t('logout')}</span>
                </button>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
