
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  shouldShowSuggestions: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setShouldShowSuggestions: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isInitialized: false,
  shouldShowSuggestions: false,
  login: async () => false,
  register: async () => false,
  signOut: async () => {},
  setShouldShowSuggestions: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data?.user) {
        setUser(data.user);
        // التحقق من عدد المتابعين بعد تسجيل الدخول بنجاح
        setTimeout(() => {
          checkFollowersCount(data.user.id);
        }, 100);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowersCount = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('following_count')
        .eq('id', userId)
        .single();

      // إذا كان المستخدم يتابع أقل من 10 أشخاص، اعرض الاقتراحات
      if (profile && profile.following_count < 10) {
        setShouldShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error checking followers count:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setShouldShowSuggestions(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // لا نتحقق من المتابعين هنا لتجنب تأخير التحميل
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setShouldShowSuggestions(false);
        }
        
        setIsLoading(false);
        setIsInitialized(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    isInitialized,
    shouldShowSuggestions,
    login,
    register,
    signOut,
    setShouldShowSuggestions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
