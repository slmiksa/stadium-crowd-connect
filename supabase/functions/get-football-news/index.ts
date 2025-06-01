
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

    // جلب أخبار الدوري السعودي فقط
    console.log('جلب أخبار الدوري السعودي...')
    try {
      const saudiQueries = [
        'الهلال كرة القدم',
        'النصر السعودي', 
        'الدوري السعودي'
      ]

      for (const query of saudiQueries) {
        try {
          const saudiResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&pageSize=8&apiKey=${newsApiKey}`)

          if (saudiResponse.ok) {
            const saudiData = await saudiResponse.json()
            console.log(`أخبار ${query}: ${saudiData.articles?.length || 0} مقال`)
            
            if (saudiData.articles && saudiData.articles.length > 0) {
              const saudiNews = saudiData.articles.map((article: any, index: number) => ({
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
              )
              
              allNews = [...allNews, ...saudiNews]
            }
          } else {
            console.error(`خطأ في استجابة API للاستعلام ${query}:`, saudiResponse.status)
          }
        } catch (error) {
          console.error(`خطأ في جلب أخبار ${query}:`, error)
        }
        
        // تأخير قصير بين الطلبات
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('خطأ في جلب الأخبار السعودية:', error)
    }

    // إزالة الأخبار المكررة وترتيبها
    const uniqueNews = allNews.filter((news, index, self) => 
      index === self.findIndex(n => n.title === news.title)
    )
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    uniqueNews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // أخذ أفضل 20 خبر حقيقي
    const finalNews = uniqueNews.slice(0, 20)

    console.log(`=== إرجاع ${finalNews.length} خبر رياضي حقيقي ===`)

    return new Response(
      JSON.stringify({ 
        news: finalNews,
        success: true,
        source: 'real-newsapi',
        totalCategories: 1,
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
