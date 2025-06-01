
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

    // جلب أخبار كرة القدم باللغة الإنجليزية (أكثر توفراً)
    console.log('جلب أخبار كرة القدم العامة بالإنجليزية...')
    
    const response = await fetch(`https://newsapi.org/v2/everything?q=football OR soccer&language=en&sortBy=publishedAt&pageSize=50&apiKey=${newsApiKey}`)

    if (!response.ok) {
      console.error('خطأ في استجابة API للأخبار:', response.status, response.statusText)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`أخبار كرة القدم: ${data.articles?.length || 0} مقال`)
    
    let allNews = []

    if (data.articles && data.articles.length > 0) {
      const news = data.articles.map((article: any, index: number) => ({
        id: `news-${index}-${Date.now()}`,
        title: article.title || 'Football News',
        description: article.description || article.content?.substring(0, 200) + '...' || 'Latest football news',
        image: article.urlToImage || '/placeholder.svg',
        video: null,
        date: article.publishedAt,
        source: article.source?.name || 'Sports Source',
        url: article.url,
        category: 'Football',
        content: article.content || article.description || 'Content not available'
      })).filter((news: any) => 
        news.title && 
        news.description && 
        !news.title.includes('[Removed]') &&
        news.title !== 'Football News' &&
        news.description !== 'Content not available'
      )
      
      allNews = [...allNews, ...news]
    }

    // إذا لم نجد أخبار كافية، جلب أخبار رياضية عامة
    if (allNews.length < 10) {
      console.log('جلب أخبار رياضية عامة إضافية...')
      const sportsResponse = await fetch(`https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=30&apiKey=${newsApiKey}`)
      
      if (sportsResponse.ok) {
        const sportsData = await sportsResponse.json()
        console.log(`أخبار رياضية إضافية: ${sportsData.articles?.length || 0} مقال`)
        
        if (sportsData.articles && sportsData.articles.length > 0) {
          const additionalNews = sportsData.articles.map((article: any, index: number) => ({
            id: `sports-${index}-${Date.now()}`,
            title: article.title || 'Sports News',
            description: article.description || article.content?.substring(0, 200) + '...' || 'Latest sports news',
            image: article.urlToImage || '/placeholder.svg',
            video: null,
            date: article.publishedAt,
            source: article.source?.name || 'Sports Source',
            url: article.url,
            category: 'Sports',
            content: article.content || article.description || 'Content not available'
          })).filter((news: any) => 
            news.title && 
            news.description && 
            !news.title.includes('[Removed]') &&
            news.title !== 'Sports News'
          )
          
          allNews = [...allNews, ...additionalNews]
        }
      }
    }

    // إزالة الأخبار المكررة وترتيبها
    const uniqueNews = allNews.filter((news, index, self) => 
      index === self.findIndex(n => n.title === news.title)
    )
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    uniqueNews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // أخذ أفضل 30 خبر
    const finalNews = uniqueNews.slice(0, 30)

    console.log(`=== إرجاع ${finalNews.length} خبر رياضي ===`)

    return new Response(
      JSON.stringify({ 
        news: finalNews,
        success: true,
        source: 'real-newsapi',
        totalNews: finalNews.length,
        language: 'en'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== خطأ في API الأخبار الرياضية ===', error)
    
    // إرجاع أخبار تجريبية في حالة الخطأ
    const fallbackNews = [
      {
        id: 'fallback-1',
        title: 'Real Madrid wins Champions League',
        description: 'Real Madrid defeats Manchester City 2-1 in the Champions League final',
        image: '/placeholder.svg',
        video: null,
        date: new Date().toISOString(),
        source: 'Sports News',
        url: '#',
        category: 'Football',
        content: 'Real Madrid wins Champions League final against Manchester City'
      },
      {
        id: 'fallback-2',
        title: 'Barcelona signs new player',
        description: 'Barcelona announces the signing of a new striker for the upcoming season',
        image: '/placeholder.svg',
        video: null,
        date: new Date().toISOString(),
        source: 'Football News',
        url: '#',
        category: 'Football',
        content: 'Barcelona announces new signing'
      },
      {
        id: 'fallback-3',
        title: 'Premier League Update',
        description: 'Latest updates from the Premier League matches',
        image: '/placeholder.svg',
        video: null,
        date: new Date().toISOString(),
        source: 'Premier League',
        url: '#',
        category: 'Football',
        content: 'Premier League latest updates'
      }
    ]
    
    return new Response(
      JSON.stringify({ 
        news: fallbackNews,
        success: true,
        error: 'استخدام أخبار احتياطية',
        message: 'تم استخدام أخبار تجريبية',
        source: 'fallback',
        language: 'en'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
