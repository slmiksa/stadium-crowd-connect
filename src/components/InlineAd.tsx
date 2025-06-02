
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
}

interface InlineAdProps {
  location: string;
  className?: string;
}

const InlineAd: React.FC<InlineAdProps> = ({ location, className = '' }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('InlineAd mounted with location:', location);
    fetchRandomAd();
    
    const interval = setInterval(fetchRandomAd, 30000);
    
    return () => clearInterval(interval);
  }, [location]);

  const fetchRandomAd = async () => {
    try {
      setIsLoading(true);
      const currentTime = new Date();
      console.log('Fetching ads from database for location:', location);
      console.log('Current time:', currentTime.toISOString());
      
      const { data: allAds, error: allAdsError } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true);
      
      console.log('Active ads found:', allAds?.length || 0);
      console.log('Active ads data:', allAds);

      if (allAds && allAds.length > 0) {
        const validAds = allAds.filter(ad => {
          const scheduledTime = ad.scheduled_at ? new Date(ad.scheduled_at) : null;
          const expiryTime = ad.expires_at ? new Date(ad.expires_at) : null;
          
          const isScheduled = !scheduledTime || scheduledTime <= currentTime;
          const notExpired = !expiryTime || expiryTime > currentTime;
          
          console.log(`Ad ${ad.id} "${ad.title}" for ${location}:`, {
            scheduled_at: ad.scheduled_at,
            expires_at: ad.expires_at,
            scheduledTime: scheduledTime?.toISOString(),
            expiryTime: expiryTime?.toISOString(),
            current_time: currentTime.toISOString(),
            isScheduled,
            notExpired,
            shouldShow: isScheduled && notExpired
          });
          
          return isScheduled && notExpired;
        });

        console.log(`Valid ads for ${location} after filtering:`, validAds.length);

        if (validAds.length > 0) {
          const randomAd = validAds[Math.floor(Math.random() * validAds.length)];
          console.log(`Selected random ad for ${location}:`, randomAd.title);
          setAd(randomAd);

          await recordAdView(randomAd.id, location);
        } else {
          console.log(`No valid ads found for ${location} after filtering`);
          setAd(null);
        }
      } else {
        console.log(`No active ads found in database for ${location}`);
        setAd(null);
      }
    } catch (error) {
      console.error(`Error fetching ads for ${location}:`, error);
      setAd(null);
    } finally {
      setIsLoading(false);
    }
  };

  const recordAdView = async (adId: string, pageLocation: string) => {
    try {
      console.log('Recording ad view for:', adId, 'at location:', pageLocation);
      const { data, error } = await supabase
        .from('advertisement_views')
        .insert([{
          advertisement_id: adId,
          page_location: pageLocation
        }]);
      console.log('Ad view recorded successfully:', data);
      if (error) console.error('Error recording ad view:', error);
    } catch (error) {
      console.error('Error recording ad view:', error);
    }
  };

  const handleClick = () => {
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  console.log(`InlineAd render state for ${location}:`, { isLoading, ad: !!ad });

  if (isLoading || !ad) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-orange-500/10 border-purple-400/30 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-purple-300 text-xs font-medium bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
            إعلان مميز
          </span>
          <span className="text-zinc-400 text-xs">
            {location}
          </span>
        </div>
        
        <div 
          className={`flex items-center space-x-4 space-x-reverse ${ad.link_url ? 'cursor-pointer hover:bg-purple-500/10 rounded-lg p-2 -m-2 transition-all duration-300' : ''}`}
          onClick={handleClick}
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-purple-400/20">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{ad.title}</h3>
            {ad.description && (
              <p className="text-zinc-300 text-xs truncate mt-1">{ad.description}</p>
            )}
            {ad.link_url && (
              <div className="flex items-center text-purple-300 text-xs mt-2 bg-purple-500/10 px-2 py-1 rounded-full w-fit">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span>انقر للمزيد</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InlineAd;
