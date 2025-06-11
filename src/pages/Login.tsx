import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
const Login = () => {
  const navigate = useNavigate();
  const {
    t,
    isRTL
  } = useLanguage();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (error) throw error;
      toast({
        title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
        description: isRTL ? 'مرحباً بك مرة أخرى!' : 'Welcome back!'
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: isRTL ? 'خطأ في تسجيل الدخول' : 'Login error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          {/* App Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img alt="TIFUE Logo" className="w-32 h-32 object-contain" src="/lovable-uploads/ad1928bd-582a-46ab-abbe-762126dc7ea7.png" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'مرحباً بك' : 'Welcome'}
            </h1>
            <p className="text-zinc-400">
              {isRTL ? 'سجل دخولك للمتابعة' : 'Sign in to continue'}
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="register">{t('register')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} placeholder={t('emailPlaceholder')} required />
                </div>
                <div>
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} name="password" id="password" value={formData.password} onChange={handleInputChange} placeholder={t('passwordPlaceholder')} required className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Toggle password</span>
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <>
                      <LogIn className="mr-2 h-4 w-4 animate-spin" />
                      {t('loggingIn')}
                    </> : <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('login')}
                    </>}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form className="space-y-4">
                <div>
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input type="text" name="username" id="username" value={formData.username} onChange={handleInputChange} placeholder={t('usernamePlaceholder')} required />
                </div>
                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input type="email" name="email" id="register-email" value={formData.email} onChange={handleInputChange} placeholder={t('emailPlaceholder')} required />
                </div>
                <div>
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} name="password" id="register-password" value={formData.password} onChange={handleInputChange} placeholder={t('passwordPlaceholder')} required className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Toggle password</span>
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder={t('confirmPasswordPlaceholder')} required className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Toggle password</span>
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <>
                      <UserPlus className="mr-2 h-4 w-4 animate-spin" />
                      {t('registering')}
                    </> : <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('register')}
                    </>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>;
};
export default Login;