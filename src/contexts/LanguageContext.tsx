
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations = {
  ar: {
    // Navigation
    matches: 'المباريات',
    hashtags: 'الهاشتاغات',
    chatRooms: 'غرف الدردشة',
    messages: 'الرسائل',
    profile: 'الملف الشخصي',
    
    // Authentication
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    username: 'اسم المستخدم',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    
    // Common
    search: 'البحث',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    save: 'حفظ',
    cancel: 'إلغاء',
    loading: 'جاري التحميل...',
    
    // Matches
    liveMatches: 'المباريات المباشرة',
    upcomingMatches: 'المباريات القادمة',
    finishedMatches: 'المباريات المنتهية',
    
    // Profile
    followers: 'المتابعون',
    following: 'المتابَعون',
    posts: 'المنشورات',
    favoriteTeam: 'الفريق المفضل',
    
    // App name
    appName: 'جمهور الملاعب'
  },
  en: {
    // Navigation
    matches: 'Matches',
    hashtags: 'Hashtags',
    chatRooms: 'Chat Rooms',
    messages: 'Messages',
    profile: 'Profile',
    
    // Authentication
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    
    // Common
    search: 'Search',
    settings: 'Settings',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    
    // Matches
    liveMatches: 'Live Matches',
    upcomingMatches: 'Upcoming Matches',
    finishedMatches: 'Finished Matches',
    
    // Profile
    followers: 'Followers',
    following: 'Following',
    posts: 'Posts',
    favoriteTeam: 'Favorite Team',
    
    // App name
    appName: 'Stadium Crowd'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('stadiumCrowdLanguage') as Language;
    if (storedLanguage && (storedLanguage === 'ar' || storedLanguage === 'en')) {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stadiumCrowdLanguage', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isRTL: language === 'ar' 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
