
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: "تم تثبيت التطبيق",
        description: "يمكنك الآن تشغيل TIFUE من شاشتك الرئيسية.",
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "التثبيت غير مدعوم",
        description: "متصفحك لا يدعم تثبيت التطبيق، أو أنه مثبت بالفعل.",
        variant: "destructive",
      });
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (isAppInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstallClick} 
      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
      aria-label="تثبيت التطبيق"
    >
      <Download className="ml-2 h-4 w-4" />
      تثبيت التطبيق
    </Button>
  );
};

export default InstallPwaButton;
