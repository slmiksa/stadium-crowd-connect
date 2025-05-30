
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = isRegister 
        ? await register(email, password, username)
        : await login(email, password);

      if (!success) {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showBottomNav={false}>
      <div className="min-h-screen flex flex-col justify-center px-6">
        {/* Language Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors"
          >
            {language === 'ar' ? 'EN' : 'عر'}
          </button>
        </div>

        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('appName')}</h1>
          <p className="text-zinc-400 text-sm">
            {language === 'ar' ? 'منصة رياضية اجتماعية' : 'Sports Social Platform'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t('username')}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder={t('email')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder={t('password')}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('loading') : (isRegister ? t('register') : t('login'))}
          </button>
        </form>

        {/* Toggle Register/Login */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isRegister 
              ? (language === 'ar' ? 'لديك حساب؟ سجل الدخول' : 'Have an account? Login')
              : (language === 'ar' ? 'ليس لديك حساب؟ أنشئ حساب' : "Don't have an account? Register")
            }
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
