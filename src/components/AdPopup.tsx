
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
}

const AdPopup = () => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkForActiveAds();
  }, []);

  const checkForActiveAds = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .is('scheduled_at', null)
        .or('scheduled_at.lte.' + new Date().toISOString())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching ads:', error);
        return;
      }

      if (data && data.length > 0) {
        const selectedAd = data[0];
        
        // تحقق من عدم عرض نفس الإعلان مؤخراً
        const lastShownAd = localStorage.getItem('lastShownAd');
        const lastShownTime = localStorage.getItem('lastShownAdTime');
        const currentTime = Date.now();
        
        // إذا كان نفس الإعلان وتم عرضه خلال آخر ساعة، لا تعرضه مرة أخرى
        if (lastShownAd === selectedAd.id && lastShownTime) {
          const timeDiff = currentTime - parseInt(lastShownTime);
          if (timeDiff < 60 * 60 * 1000) { // ساعة واحدة
            return;
          }
        }

        setAd(selectedAd);
        setIsVisible(true);

        // تسجيل المشاهدة
        await recordAdView(selectedAd.id, 'popup');

        // حفظ معلومات آخر إعلان تم عرضه
        localStorage.setItem('lastShownAd', selectedAd.id);
        localStorage.setItem('lastShownAdTime', currentTime.toString());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const recordAdView = async (adId: string, location: string) => {
    try {
      await supabase
        .from('advertisement_views')
        .insert([{
          advertisement_id: adId,
          page_location: location
        }]);
    } catch (error) {
      console.error('Error recording ad view:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setAd(null);
  };

  const handleClick = () => {
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank');
    }
    handleClose();
  };

  if (!isVisible || !ad) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full mx-auto">
        <CardContent className="p-0 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 text-white hover:bg-zinc-800 rounded-full w-8 h-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="relative">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-64 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
              إعلان
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-white font-bold text-lg mb-2">{ad.title}</h3>
            {ad.description && (
              <p className="text-zinc-400 text-sm mb-4">{ad.description}</p>
            )}
            
            <div className="flex gap-2">
              {ad.link_url && (
                <Button
                  onClick={handleClick}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  زيارة الرابط
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleClose}
                className="text-white border-zinc-700 hover:bg-zinc-800"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdPopup;
