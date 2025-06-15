
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Apple, Bot, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Login = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isInstructionDialogOpen, setIsInstructionDialogOpen] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const handleInstallGuideClick = (selectedPlatform: 'ios' | 'android') => {
    setPlatform(selectedPlatform);
    setIsInstructionDialogOpen(true);
  };

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
      const { data, error } = await supabase.auth.signInWithPassword({
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
        description: isRTL ? 'يرجى التحقق من بريدك الإلكتروني' : 'Please check your email for verification'
      });
    } catch (error: any) {
      toast({
        title: isRTL ? 'خطأ في إنشاء الحساب' : 'Registration error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: isRTL ? 'خطأ في تسجيل الدخول' : 'Login error',
        description: error.message,
        variant: 'destructive'
      });
      setIsLoading(false);
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
                alt="TIFUE Logo" 
                className="w-32 h-32 object-contain" 
                src="/lovable-uploads/ad1928bd-582a-46ab-abbe-762126dc7ea7.png" 
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'مرحباً بك' : 'Welcome'}
            </h1>
            <p className="text-zinc-400">
              {isRTL ? 'سجل دخولك للمتابعة' : 'Sign in to continue'}
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white text-black hover:bg-gray-100 border-gray-300"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isRTL ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-400">
                {isRTL ? 'أو' : 'Or'}
              </span>
            </div>
          </div>

          {/* Install App Buttons */}
          <div className="mb-6 text-center">
            <p className="text-zinc-400 text-sm mb-4">
                {isRTL ? 'لأفضل تجربة، قم بتثبيت التطبيق على جهازك' : 'For the best experience, install the app on your device'}
            </p>
            <div className="flex justify-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleInstallGuideClick('android')}
                >
                    <Bot className={isRTL ? "ml-2 h-5 w-5" : "mr-2 h-5 w-5"} />
                    Android
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleInstallGuideClick('ios')}
                >
                    <Apple className={isRTL ? "ml-2 h-5 w-5" : "mr-2 h-5 w-5"} />
                    iOS
                </Button>
            </div>
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
                  <Input 
                    type="email" 
                    name="email" 
                    id="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder={t('emailPlaceholder')} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      id="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder={t('passwordPlaceholder')} 
                      required 
                      className="pr-10" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Toggle password</span>
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LogIn className="mr-2 h-4 w-4 animate-spin" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('login')}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input 
                    type="text" 
                    name="username" 
                    id="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    placeholder={t('usernamePlaceholder')} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input 
                    type="email" 
                    name="email" 
                    id="register-email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder={t('emailPlaceholder')} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      id="register-password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder={t('passwordPlaceholder')} 
                      required 
                      className="pr-10" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Toggle password</span>
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      name="confirmPassword" 
                      id="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleInputChange} 
                      placeholder={t('confirmPasswordPlaceholder')} 
                      required 
                      className="pr-10" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Toggle password</span>
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4 animate-spin" />
                      {t('registering')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('register')}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <AlertDialog open={isInstructionDialogOpen} onOpenChange={setIsInstructionDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    {platform === 'android'
                        ? (isRTL ? 'تثبيت التطبيق على أندرويد' : 'Install App on Android')
                        : (isRTL ? 'تثبيت التطبيق على iOS' : 'Install App on iOS')}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  {platform === 'android' ? (
                      <div className={`space-y-3 pt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p>{isRTL ? 'لإضافة التطبيق إلى شاشتك الرئيسية، اتبع الخطوات التالية:' : 'To add the app to your home screen, follow these steps:'}</p>
                          <ol className="list-decimal list-inside space-y-2">
                              <li>{isRTL ? 'افتح المتصفح (Chrome).' : 'Open your browser (Chrome).'}</li>
                              <li>{isRTL ? 'اضغط على قائمة الخيارات (الثلاث نقاط).' : 'Tap the menu button (three dots).'}</li>
                              <li>{isRTL ? "اختر 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'." : "Select 'Install app' or 'Add to Home Screen'."}</li>
                          </ol>
                      </div>
                  ) : (
                      <div className={`space-y-3 pt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p>{isRTL ? 'لإضافة التطبيق إلى شاشتك الرئيسية، اتبع الخطوات التالية:' : 'To add the app to your home screen, follow these steps:'}</p>
                          <ol className="list-decimal list-inside space-y-2">
                              <li>{isRTL ? 'افتح المتصفح (Safari).' : 'Open your browser (Safari).'}</li>
                              <li>{isRTL ? 'اضغط على أيقونة المشاركة (مربع به سهم لأعلى).' : 'Tap the Share icon (the square with an arrow pointing up).'}</li>
                              <li>{isRTL ? "مرر للأسفل واختر 'إضافة إلى الشاشة الرئيسية'." : "Scroll down and select 'Add to Home Screen'."}</li>
                          </ol>
                      </div>
                  )}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setIsInstructionDialogOpen(false)}>
                    {isRTL ? 'فهمت' : 'Got it'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
