
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
        'الهلال+كرة+القدم',
        'النصر+السعودي',
        'الاتحاد+السعودي', 
        'الأهلي+السعودي',
        'الدوري+السعودي+روشن',
        'الشباب+السعودي'
      ]

      for (const query of saudiQueries) {
        const saudiResponse = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=6&apiKey=${newsApiKey}`)

        if (saudiResponse.ok) {
          const saudiData = await saudiResponse.json()
          console.log(`أخبار ${query}: ${saudiData.articles?.length || 0} مقال`)
          
          const saudiNews = saudiData.articles?.map((article: any, index: number) => ({
            id: `saudi-${query}-${index}-${Date.now()}`,
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
        'ريال+مدريد+اليوم',
        'برشلونة+أخبار',
        'ليفربول+جديد',
        'مانشستر+سيتي+اليوم',
        'إنتر+ميلان+فوز',
        'بايرن+ميونيخ',
        'باريس+سان+جيرمان+جديد'
      ]

      for (const query of europeQueries) {
        const europeResponse = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=4&apiKey=${newsApiKey}`)

        if (europeResponse.ok) {
          const europeData = await europeResponse.json()
          console.log(`أخبار ${query}: ${europeData.articles?.length || 0} مقال`)
          
          const europeNews = europeData.articles?.map((article: any, index: number) => ({
            id: `europe-${query}-${index}-${Date.now()}`,
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
        'انتقالات+كرة+القدم+اليوم',
        'صفقات+جديدة+2025',
        'ميركاتو+شتوي',
        'لاعب+جديد+انتقال'
      ]

      for (const query of transferQueries) {
        const transfersResponse = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=4&apiKey=${newsApiKey}`)

        if (transfersResponse.ok) {
          const transferData = await transfersResponse.json()
          console.log(`أخبار ${query}: ${transferData.articles?.length || 0} مقال`)
          
          const transferNews = transferData.articles?.map((article: any, index: number) => ({
            id: `transfer-${query}-${index}-${Date.now()}`,
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
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('خطأ في جلب أخبار الانتقالات:', error)
    }

    // 4. أخبار النجوم العالميين
    console.log('جلب أخبار النجوم...')
    try {
      const starsQueries = [
        'محمد+صلاح+أخبار',
        'كريستيانو+رونالدو+النصر',
        'ليونيل+ميسي+اليوم',
        'كيليان+مبابي+ريال',
        'إيرلينغ+هالاند+جديد'
      ]

      for (const query of starsQueries) {
        const starsResponse = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=3&apiKey=${newsApiKey}`)

        if (starsResponse.ok) {
          const starsData = await starsResponse.json()
          console.log(`أخبار ${query}: ${starsData.articles?.length || 0} مقال`)
          
          const starsNews = starsData.articles?.map((article: any, index: number) => ({
            id: `stars-${query}-${index}-${Date.now()}`,
            title: article.title || 'أخبار النجوم العالميين',
            description: article.description || article.content?.substring(0, 200) + '...' || 'أحدث أخبار نجوم كرة القدم العالميين',
            image: article.urlToImage || '/placeholder.svg',
            video: null,
            date: article.publishedAt,
            source: article.source?.name || 'مصدر رياضي',
            url: article.url,
            category: 'نجوم عالميون',
            content: article.content || article.description || 'المحتوى غير متوفر'
          })).filter((news: any) => 
            news.title && 
            news.description && 
            !news.title.includes('[Removed]') &&
            news.title !== 'أخبار النجوم العالميين'
          ) || []
          
          allNews = [...allNews, ...starsNews]
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('خطأ في جلب أخبار النجوم:', error)
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
    
    // أخذ أفضل 35 خبر حقيقي
    const finalNews = uniqueNews.slice(0, 35)

    console.log(`=== إرجاع ${finalNews.length} خبر رياضي حقيقي ===`)

    return new Response(
      JSON.stringify({ 
        news: finalNews,
        success: true,
        source: 'real-newsapi',
        totalCategories: 4,
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
