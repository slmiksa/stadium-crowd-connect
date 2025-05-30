
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LoadingSpinner = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">{t('loading')}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
