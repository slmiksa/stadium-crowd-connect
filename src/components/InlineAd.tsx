
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
    fetchRandomAd();
  }, [location]);

  const fetchRandomAd = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .or('scheduled_at.is.null,scheduled_at.lte.' + new Date().toISOString())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        console.error('Error fetching ads:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // اختيار إعلان عشوائي
        const randomAd = data[Math.floor(Math.random() * data.length)];
        setAd(randomAd);

        // تسجيل المشاهدة
        await recordAdView(randomAd.id, location);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordAdView = async (adId: string, pageLocation: string) => {
    try {
      await supabase
        .from('advertisement_views')
        .insert([{
          advertisement_id: adId,
          page_location: pageLocation
        }]);
    } catch (error) {
      console.error('Error recording ad view:', error);
    }
  };

  const handleClick = () => {
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  if (isLoading || !ad) return null;

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
