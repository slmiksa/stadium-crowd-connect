
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
  location: string; // 'hashtags', 'trending', 'my-posts', etc.
  className?: string;
}

const InlineAd: React.FC<InlineAdProps> = ({ location, className = '' }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('InlineAd mounted with location:', location);
    fetchRandomAd();
  }, [location]);

  const fetchRandomAd = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching ads from database...');
      console.log('Current time:', new Date().toISOString());
      
      // Fetch all active ads
      const { data: allAds, error: allAdsError } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true);
      
      console.log('Active ads found:', allAds);
      console.log('Active ads error:', allAdsError);

      if (allAds && allAds.length > 0) {
        const currentTime = new Date();
        
        // Filter ads based on scheduling
        const validAds = allAds.filter(ad => {
          const isScheduled = !ad.scheduled_at || new Date(ad.scheduled_at) <= currentTime;
          const notExpired = !ad.expires_at || new Date(ad.expires_at) > currentTime;
          
          console.log(`Ad ${ad.id}:`, {
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

        console.log('Valid ads after filtering:', validAds);

        if (validAds.length > 0) {
          // Random selection for distribution like X platform
          const randomAd = validAds[Math.floor(Math.random() * validAds.length)];
          console.log('Selected random ad:', randomAd);
          setAd(randomAd);

          // Record the view
          await recordAdView(randomAd.id, location);
        } else {
          console.log('No valid ads found after date filtering');
          setAd(null);
        }
      } else {
        console.log('No active ads found in database');
        setAd(null);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
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

  console.log('InlineAd render state:', { isLoading, ad: !!ad, location });

  // Don't render anything if loading or no ad
  if (isLoading || !ad) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-400 text-xs font-medium bg-blue-500/20 px-2 py-1 rounded">
            إعلان
          </span>
        </div>
        
        <div 
          className={`flex items-center space-x-4 space-x-reverse ${ad.link_url ? 'cursor-pointer hover:bg-zinc-800/50 rounded-lg p-2 -m-2 transition-colors' : ''}`}
          onClick={handleClick}
        >
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
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
            <h3 className="text-white font-medium text-sm truncate">{ad.title}</h3>
            {ad.description && (
              <p className="text-zinc-400 text-xs truncate mt-1">{ad.description}</p>
            )}
            {ad.link_url && (
              <div className="flex items-center text-blue-400 text-xs mt-1">
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
