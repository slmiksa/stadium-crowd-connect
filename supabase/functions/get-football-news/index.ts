
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== تم استدعاء API الأخبار الرياضية ===')
  
  if (req.method === 'OPTIONS') {
    console.log('معالجة طلب CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const newsApiKey = '821aee6f9e3f494ab98d299588b8ad53'
    
    console.log('استخدام مفتاح NewsAPI:', newsApiKey.substring(0, 8) + '...')
    console.log('جلب الأخبار الرياضية الحقيقية من NewsAPI...')

    let allNews = []

    // 1. أخبار الدوري السعودي والأندية السعودية
    console.log('جلب أخبار الدوري السعودي...')
    try {
      const saudiQueries = [
        'الهلال كرة القدم',
        'النصر السعودي',
        'الاتحاد السعودي', 
        'الأهلي السعودي',
        'الدوري السعودي روشن',
        'الشباب السعودي'
      ]

      for (const query of saudiQueries) {
        try {
          const saudiResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`)

          if (saudiResponse.ok) {
            const saudiData = await saudiResponse.json()
            console.log(`أخبار ${query}: ${saudiData.articles?.length || 0} مقال`)
            
            const saudiNews = saudiData.articles?.map((article: any, index: number) => ({
              id: `saudi-${query.replace(/\s+/g, '-')}-${index}-${Date.now()}`,
              title: article.title || 'أخبار الدوري السعودي',
              description: article.description || article.content?.substring(0, 200) + '...' || 'أحدث أخبار الدوري السعودي والأندية السعودية',
              image: article.urlToImage || '/placeholder.svg',
              video: null,
              date: article.publishedAt,
              source: article.source?.name || 'مصدر سعودي',
              url: article.url,
              category: 'الدوري السعودي',
              content: article.content || article.description || 'المحتوى غير متوفر'
            })).filter((news: any) => 
              news.title && 
              news.description && 
              !news.title.includes('[Removed]') &&
              news.title !== 'أخبار الدوري السعودي'
            ) || []
            
            allNews = [...allNews, ...saudiNews]
          } else {
            console.error(`خطأ في استجابة API للاستعلام ${query}:`, saudiResponse.status)
          }
        } catch (error) {
          console.error(`خطأ في جلب أخبار ${query}:`, error)
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('خطأ في جلب الأخبار السعودية:', error)
    }

    // 2. أخبار الدوريات الأوروبية
    console.log('جلب أخبار الدوريات الأوروبية...')
    try {
      const europeQueries = [
        'ريال مدريد',
        'برشلونة',
        'ليفربول',
        'مانشستر سيتي',
        'إنتر ميلان',
        'بايرن ميونيخ',
        'باريس سان جيرمان'
      ]

      for (const query of europeQueries) {
        try {
          const europeResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&pageSize=3&apiKey=${newsApiKey}`)

          if (europeResponse.ok) {
            const europeData = await europeResponse.json()
            console.log(`أخبار ${query}: ${europeData.articles?.length || 0} مقال`)
            
            const europeNews = europeData.articles?.map((article: any, index: number) => ({
              id: `europe-${query.replace(/\s+/g, '-')}-${index}-${Date.now()}`,
              title: article.title || 'أخبار الدوريات الأوروبية',
              description: article.description || article.content?.substring(0, 200) + '...' || 'أحدث أخبار الدوريات الأوروبية',
              image: article.urlToImage || '/placeholder.svg',
              video: null,
              date: article.publishedAt,
              source: article.source?.name || 'مصدر أوروبي',
              url: article.url,
              category: 'دوريات أوروبية',
              content: article.content || article.description || 'المحتوى غير متوفر'
            })).filter((news: any) => 
              news.title && 
              news.description && 
              !news.title.includes('[Removed]') &&
              news.title !== 'أخبار الدوريات الأوروبية'
            ) || []
            
            allNews = [...allNews, ...europeNews]
          } else {
            console.error(`خطأ في استجابة API للاستعلام ${query}:`, europeResponse.status)
          }
        } catch (error) {
          console.error(`خطأ في جلب أخبار ${query}:`, error)
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('خطأ في جلب الأخبار الأوروبية:', error)
    }

    // 3. أخبار الانتقالات والميركاتو
    console.log('جلب أخبار الانتقالات...')
    try {
      const transferQueries = [
        'انتقالات كرة القدم',
        'صفقات جديدة',
        'ميركاتو شتوي',
        'انتقال لاعب'
      ]

      for (const query of transferQueries) {
        try {
          const transfersResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&pageSize=3&apiKey=${newsApiKey}`)

          if (transfersResponse.ok) {
            const transferData = await transfersResponse.json()
            console.log(`أخبار ${query}: ${transferData.articles?.length || 0} مقال`)
            
            const transferNews = transferData.articles?.map((article: any, index: number) => ({
              id: `transfer-${query.replace(/\s+/g, '-')}-${index}-${Date.now()}`,
              title: article.title || 'أخبار الانتقالات',
              description: article.description || article.content?.substring(0, 200) + '...' || 'آخر أخبار انتقالات اللاعبين والميركاتو',
              image: article.urlToImage || '/placeholder.svg',
              video: null,
              date: article.publishedAt,
              source: article.source?.name || 'مصدر رياضي',
              url: article.url,
              category: 'انتقالات وميركاتو',
              content: article.content || article.description || 'المحتوى غير متوفر'
            })).filter((news: any) => 
              news.title && 
              news.description && 
              !news.title.includes('[Removed]') &&
              news.title !== 'أخبار الانتقالات'
            ) || []
            
            allNews = [...allNews, ...transferNews]
          } else {
            console.error(`خطأ في استجابة API للاستعلام ${query}:`, transfersResponse.status)
          }
        } catch (error) {
          console.error(`خطأ في جلب أخبار ${query}:`, error)
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('خطأ في جلب أخبار الانتقالات:', error)
    }

    // إذا لم نحصل على أخبار حقيقية، نرجع قائمة فارغة مع رسالة
    if (allNews.length === 0) {
      console.log('لا توجد أخبار حقيقية متاحة')
      return new Response(
        JSON.stringify({ 
          news: [],
          success: false,
          message: 'لا توجد أخبار متاحة في الوقت الحالي. يرجى المحاولة لاحقاً.',
          source: 'api-unavailable',
          language: 'ar'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إزالة الأخبار المكررة وترتيبها
    const uniqueNews = allNews.filter((news, index, self) => 
      index === self.findIndex(n => n.title === news.title)
    )
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    uniqueNews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // أخذ أفضل 25 خبر حقيقي
    const finalNews = uniqueNews.slice(0, 25)

    console.log(`=== إرجاع ${finalNews.length} خبر رياضي حقيقي ===`)

    return new Response(
      JSON.stringify({ 
        news: finalNews,
        success: true,
        source: 'real-newsapi',
        totalCategories: 3,
        language: 'ar'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== خطأ في API الأخبار الرياضية ===', error)
    
    return new Response(
      JSON.stringify({ 
        news: [],
        success: false,
        error: 'خطأ في الخادم',
        message: 'حدث خطأ في جلب الأخبار',
        source: 'error',
        language: 'ar'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
