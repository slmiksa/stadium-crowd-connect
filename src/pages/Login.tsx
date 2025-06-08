
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, register, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }

    if (isSignUp && !username) {
      setError(isRTL ? 'يرجى إدخال اسم المستخدم' : 'Please enter a username');
      return;
    }

    try {
      let success = false;
      
      if (isSignUp) {
        success = await register(email, password, username);
        if (success) {
          setError(isRTL ? 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول' : 'Account created successfully! Please log in');
          setIsSignUp(false);
          setPassword('');
          setUsername('');
        } else {
          setError(isRTL ? 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.' : 'Failed to create account. Please try again.');
        }
      } else {
        success = await login(email, password);
        if (!success) {
          setError(isRTL ? 'بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.' : 'Invalid login credentials. Please check your email and password.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(isRTL ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' : 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          {/* App Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/befc9f3d-22fa-48f9-988f-ae24ad434089.png" 
                alt="TIFUE Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'مرحباً بك' : 'Welcome'}
            </h1>
            <p className="text-zinc-400">
              {isSignUp 
                ? (isRTL ? 'إنشاء حساب جديد' : 'Create a new account')
                : (isRTL ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account')
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRTL ? 'اسم المستخدم' : 'Username'}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                  required={isSignUp}
                />
              </div>
            )}

            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
                required
              />
            </div>

            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                className="w-full pl-10 pr-10 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-950/20 border border-red-900/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isSignUp 
                  ? (isRTL ? 'إنشاء حساب' : 'Sign Up')
                  : (isRTL ? 'تسجيل الدخول' : 'Sign In')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setPassword('');
                setUsername('');
              }}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              {isSignUp
                ? (isRTL ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign In')
                : (isRTL ? 'ليس لديك حساب؟ إنشاء حساب' : "Don't have an account? Sign Up")
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
