
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ApiKeyForm = () => {
  const { t, isRTL } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // تجربة استدعاء Edge Function لحفظ مفتاح API
      const { data, error } = await supabase.functions.invoke('save-api-key', {
        body: JSON.stringify({ apiKey: apiKey.trim() }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "تم بنجاح",
        description: "تم حفظ مفتاح API بنجاح",
      });
      
      setApiKey('');
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ مفتاح API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
          إدخال مفتاح API للمباريات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-zinc-200 mb-2">
              مفتاح API من api-football.com
            </label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="أدخل مفتاح API هنا..."
              className="w-full"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ مفتاح API'}
          </Button>
        </form>
        <div className="mt-4 text-xs text-zinc-400 text-center">
          <p>احصلي على مفتاح API من موقع api-football.com</p>
          <p>تأكدي من إزالة قيود النطاقات في لوحة التحكم</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyForm;
