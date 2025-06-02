
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
    console.log('AdPopup component mounted');
    checkForActiveAds();
    
    // فحص الإعلانات كل 30 ثانية للتحديث التلقائي
    const interval = setInterval(checkForActiveAds, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkForActiveAds = async () => {
    try {
      console.log('Checking for active ads...');
      const currentTime = new Date();
      console.log('Current time:', currentTime.toISOString());
      
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true);

      console.log('AdPopup query result:', { data, error });

      if (error) {
        console.error('Error fetching ads:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Found active ads:', data.length);
        
        // Filter ads based on scheduling
        const validAds = data.filter(ad => {
          const isScheduled = !ad.scheduled_at || new Date(ad.scheduled_at) <= currentTime;
          const notExpired = !ad.expires_at || new Date(ad.expires_at) > currentTime;
          
          console.log(`Popup Ad ${ad.id}:`, {
            title: ad.title,
            scheduled_at: ad.scheduled_at,
            expires_at: ad.expires_at,
            current_time: currentTime.toISOString(),
            isScheduled,
            notExpired,
            canShow: isScheduled && notExpired
          });
          
          return isScheduled && notExpired;
        });

        console.log('Valid ads after filtering:', validAds.length);

        if (validAds.length > 0) {
          // Random selection from valid ads
          const selectedAd = validAds[Math.floor(Math.random() * validAds.length)];
          console.log('Found ad for popup:', selectedAd);
          
          // Check if we shouldn't show same ad recently
          const lastShownAd = localStorage.getItem('lastShownAd');
          const lastShownTime = localStorage.getItem('lastShownAdTime');
          const currentTimeMs = Date.now();
          
          console.log('Last shown ad check:', { lastShownAd, lastShownTime, currentAd: selectedAd.id });
          
          // If same ad was shown within last hour, skip
          if (lastShownAd === selectedAd.id && lastShownTime) {
            const timeDiff = currentTimeMs - parseInt(lastShownTime);
            console.log('Time difference:', timeDiff, 'milliseconds');
            if (timeDiff < 60 * 60 * 1000) { // 1 hour
              console.log('Ad was shown recently, skipping popup');
              return;
            }
          }

          console.log('Showing popup ad');
          setAd(selectedAd);
          setIsVisible(true);

          // Record view
          await recordAdView(selectedAd.id, 'popup');

          // Save last shown ad info
          localStorage.setItem('lastShownAd', selectedAd.id);
          localStorage.setItem('lastShownAdTime', currentTimeMs.toString());
        } else {
          console.log('No valid ads found after filtering');
        }
      } else {
        console.log('No active ads found for popup');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const recordAdView = async (adId: string, location: string) => {
    try {
      console.log('Recording popup ad view for:', adId);
      await supabase
        .from('advertisement_views')
        .insert([{
          advertisement_id: adId,
          page_location: location
        }]);
      console.log('Popup ad view recorded successfully');
    } catch (error) {
      console.error('Error recording ad view:', error);
    }
  };

  const handleClose = () => {
    console.log('Closing popup ad');
    setIsVisible(false);
    setAd(null);
  };

  const handleClick = () => {
    if (ad?.link_url) {
      console.log('Opening ad link:', ad.link_url);
      window.open(ad.link_url, '_blank');
    }
    handleClose();
  };

  console.log('AdPopup render state:', { isVisible, ad: !!ad });

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
