
import React from 'react';
import Layout from '@/components/Layout';
import ApiKeyForm from '@/components/ApiKeyForm';
import { useLanguage } from '@/contexts/LanguageContext';

const ApiSettings = () => {
  const { t, isRTL } = useLanguage();

  return (
    <Layout>
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            إعدادات API
          </h1>
          
          <div className="space-y-6">
            <ApiKeyForm />
            
            <div className="bg-zinc-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-3">تعليمات مهمة:</h2>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm">
                <li>احصلي على مفتاح API من موقع api-football.com</li>
                <li>في لوحة تحكم api-football.com، اذهبي إلى إعدادات API Key</li>
                <li>في قسم "Allowed Domains"، اتركي القائمة فارغة تماماً</li>
                <li>أو أضيفي: *.supabase.co إلى القائمة المسموحة</li>
                <li>بعد إدخال المفتاح هنا، ستحتاجين إلى تحديثه في إعدادات Supabase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiSettings;
