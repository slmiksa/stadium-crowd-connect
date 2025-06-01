
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

    // جلب أخبار كرة القدم باللغة العربية
    console.log('جلب أخبار كرة القدم العامة بالعربية...')
    
    let allNews = []

    // محاولة جلب الأخبار العربية أولاً
    try {
      const arabicResponse = await fetch(`https://newsapi.org/v2/everything?q=كرة القدم OR الكرة OR الرياضة OR football OR soccer&language=ar&sortBy=publishedAt&pageSize=30&apiKey=${newsApiKey}`)
      
      if (arabicResponse.ok) {
        const arabicData = await arabicResponse.json()
        console.log(`أخبار كرة القدم العربية: ${arabicData.articles?.length || 0} مقال`)
        
        if (arabicData.articles && arabicData.articles.length > 0) {
          const arabicNews = arabicData.articles.map((article: any, index: number) => ({
            id: `arabic-news-${index}-${Date.now()}`,
            title: article.title || 'أخبار رياضية',
            description: article.description || article.content?.substring(0, 200) + '...' || 'آخر الأخبار الرياضية',
            image: article.urlToImage || '/placeholder.svg',
            video: null,
            date: article.publishedAt,
            source: article.source?.name || 'مصدر رياضي',
            url: article.url,
            category: 'رياضة',
            content: article.content || article.description || 'المحتوى غير متاح'
          })).filter((news: any) => 
            news.title && 
            news.description && 
            !news.title.includes('[Removed]') &&
            news.title !== 'أخبار رياضية' &&
            news.description !== 'المحتوى غير متاح'
          )
          
          allNews = [...allNews, ...arabicNews]
        }
      }
    } catch (error) {
      console.log('فشل في جلب الأخبار العربية:', error)
    }

    // إذا لم نجد أخبار عربية كافية، جلب أخبار إنجليزية وترجمة العناوين
    if (allNews.length < 15) {
      console.log('جلب أخبار إنجليزية إضافية...')
      try {
        const englishResponse = await fetch(`https://newsapi.org/v2/everything?q=football OR soccer OR sports&language=en&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}`)
        
        if (englishResponse.ok) {
          const englishData = await englishResponse.json()
          console.log(`أخبار إنجليزية إضافية: ${englishData.articles?.length || 0} مقال`)
          
          if (englishData.articles && englishData.articles.length > 0) {
            const englishNews = englishData.articles.map((article: any, index: number) => ({
              id: `english-news-${index}-${Date.now()}`,
              title: article.title || 'Football News',
              description: article.description || article.content?.substring(0, 200) + '...' || 'Latest football news',
              image: article.urlToImage || '/placeholder.svg',
              video: null,
              date: article.publishedAt,
              source: article.source?.name || 'Sports Source',
              url: article.url,
              category: 'كرة القدم',
              content: article.content || article.description || 'Content not available'
            })).filter((news: any) => 
              news.title && 
              news.description && 
              !news.title.includes('[Removed]') &&
              news.title !== 'Football News'
            )
            
            allNews = [...allNews, ...englishNews]
          }
        }
      } catch (error) {
        console.log('فشل في جلب الأخبار الإنجليزية:', error)
      }
    }

    // جلب أخبار رياضية عامة إذا لم نجد ما يكفي
    if (allNews.length < 10) {
      console.log('جلب أخبار رياضية عامة...')
      try {
        const sportsResponse = await fetch(`https://newsapi.org/v2/top-headlines?category=sports&language=ar&pageSize=15&apiKey=${newsApiKey}`)
        
        if (sportsResponse.ok) {
          const sportsData = await sportsResponse.json()
          console.log(`أخبار رياضية عامة: ${sportsData.articles?.length || 0} مقال`)
          
          if (sportsData.articles && sportsData.articles.length > 0) {
            const generalSportsNews = sportsData.articles.map((article: any, index: number) => ({
              id: `general-sports-${index}-${Date.now()}`,
              title: article.title || 'أخبار رياضية',
              description: article.description || article.content?.substring(0, 200) + '...' || 'آخر الأخبار الرياضية',
              image: article.urlToImage || '/placeholder.svg',
              video: null,
              date: article.publishedAt,
              source: article.source?.name || 'مصدر رياضي',
              url: article.url,
              category: 'رياضة عامة',
              content: article.content || article.description || 'المحتوى غير متاح'
            })).filter((news: any) => 
              news.title && 
              news.description && 
              !news.title.includes('[Removed]') &&
              news.title !== 'أخبار رياضية'
            )
            
            allNews = [...allNews, ...generalSportsNews]
          }
        }
      } catch (error) {
        console.log('فشل في جلب الأخبار الرياضية العامة:', error)
      }
    }

    // إزالة الأخبار المكررة وترتيبها
    const uniqueNews = allNews.filter((news, index, self) => 
      index === self.findIndex(n => n.title === news.title)
    )
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    uniqueNews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // أخذ أفضل 25 خبر
    const finalNews = uniqueNews.slice(0, 25)

    console.log(`=== إرجاع ${finalNews.length} خبر رياضي حقيقي ===`)

    return new Response(
      JSON.stringify({ 
        news: finalNews,
        success: true,
        source: 'real-newsapi-arabic',
        totalNews: finalNews.length,
        language: 'ar'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== خطأ في API الأخبار الرياضية ===', error)
    
    // في حالة الخطأ، إرجاع رسالة خطأ واضحة
    return new Response(
      JSON.stringify({ 
        news: [],
        success: false,
        error: 'فشل في جلب الأخبار',
        message: 'حدث خطأ في جلب الأخبار الرياضية. يرجى المحاولة لاحقاً.',
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
