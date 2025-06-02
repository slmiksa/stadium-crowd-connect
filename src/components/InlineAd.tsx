
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
      
      // First, let's check all ads
      const { data: allAds, error: allAdsError } = await supabase
        .from('advertisements')
        .select('*');
      
      console.log('All ads in database:', allAds);
      console.log('All ads error:', allAdsError);

      // Now let's check active ads step by step
      const { data: activeAds, error: activeError } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true);
      
      console.log('Active ads:', activeAds);
      console.log('Active ads error:', activeError);

      if (activeAds && activeAds.length > 0) {
        // Check each ad's scheduling
        activeAds.forEach(ad => {
          console.log(`Ad ${ad.id}:`, {
            title: ad.title,
            is_active: ad.is_active,
            scheduled_at: ad.scheduled_at,
            expires_at: ad.expires_at,
            current_time: new Date().toISOString(),
            can_show: (!ad.scheduled_at || new Date(ad.scheduled_at) <= new Date()) &&
                     (!ad.expires_at || new Date(ad.expires_at) > new Date())
          });
        });

        // Filter ads that can be shown
        const validAds = activeAds.filter(ad => 
          (!ad.scheduled_at || new Date(ad.scheduled_at) <= new Date()) &&
          (!ad.expires_at || new Date(ad.expires_at) > new Date())
        );

        console.log('Valid ads after filtering:', validAds);

        if (validAds.length > 0) {
          const randomAd = validAds[Math.floor(Math.random() * validAds.length)];
          console.log('Selected random ad:', randomAd);
          setAd(randomAd);

          // Record the view
          await recordAdView(randomAd.id, location);
        } else {
          console.log('No valid ads found after date filtering');
        }
      } else {
        console.log('No active ads found in database');
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
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

  if (isLoading) {
    console.log('InlineAd is loading...');
    return (
      <Card className={`bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <span className="text-blue-400 text-sm">جاري تحميل الإعلان...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!ad) {
    console.log('No ad to display, showing placeholder');
    return (
      <Card className={`bg-gradient-to-r from-gray-900/20 to-gray-800/20 border-gray-600/30 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <span className="text-gray-400 text-sm">لا توجد إعلانات متاحة حالياً</span>
          </div>
        </CardContent>
      </Card>
    );
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
