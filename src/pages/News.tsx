
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
  image?: string;
  url: string;
}

const News = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    console.log('🔍 جاري جلب الأخبار الرياضية');
    setIsLoading(true);
    try {
      const response = await fetch(`https://zuvpksebzsthinjsxebt.supabase.co/functions/v1/get-football-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnBrc2VienN0aGluanN4ZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDAyMzQsImV4cCI6MjA2NDIxNjIzNH0.HPOH1UvYlwf7KeA97NtNHJAC2bXkLxVSKtLDcs2cjeU`
        }
      });

      console.log('📡 استجابة API الأخبار:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ بيانات الأخبار المستلمة:', result);
        
        if (result.success && result.news) {
          setNews(result.news);
          console.log(`📰 عدد الأخبار: ${result.news.length}`);
        } else {
          console.warn('⚠️ لا توجد أخبار متاحة');
        }
      } else {
        console.error('❌ خطأ في استجابة API الأخبار:', response.status);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الأخبار:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب الأخبار الرياضية",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openArticle = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">الأخبار الرياضية</h1>
                <p className="text-gray-400">آخر الأخبار والتطورات الرياضية</p>
              </div>
              <Button
                onClick={fetchNews}
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw size={16} className={`ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-32 h-24 bg-zinc-700 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-zinc-700 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-zinc-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-zinc-700 rounded w-2/3 mb-3"></div>
                      <div className="h-3 bg-zinc-700 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                <Calendar size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">لا توجد أخبار متاحة حالياً</h3>
              <p className="text-gray-400 mb-4">سنعرض الأخبار عند توفرها</p>
              <Button onClick={fetchNews} variant="outline">
                <RefreshCw size={16} className="ml-2" />
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((article) => (
                <div
                  key={article.id}
                  onClick={() => openArticle(article.url)}
                  className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700"
                >
                  <div className="flex gap-4">
                    {article.image && (
                      <div className="w-32 h-24 flex-shrink-0">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-gray-300 mb-3 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-400 text-sm">
                          <Calendar size={14} className="ml-1" />
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 text-sm ml-2">{article.source.name}</span>
                          <ExternalLink size={14} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default News;
