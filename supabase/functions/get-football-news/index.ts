
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== Football news API called ===')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // استخدام NewsAPI للحصول على أخبار رياضية حقيقية
    const newsApiKey = Deno.env.get('NEWS_API_KEY')
    
    if (!newsApiKey) {
      console.log('News API key not found, using fallback data')
      // بيانات احتياطية إذا لم يتم توفير مفتاح API
      const fallbackNews = [
        {
          id: 'news-1',
          title: 'الهلال يفوز على النصر في الكلاسيكو السعودي',
          description: 'انتهت مباراة الكلاسيكو السعودي بين الهلال والنصر بفوز الهلال بهدفين مقابل هدف واحد في مباراة مثيرة شهدت أهدافاً رائعة من الفريقين.',
          image: '/placeholder.svg',
          date: new Date().toISOString(),
          source: 'الرياضية'
        },
        {
          id: 'news-2',
          title: 'محمد صلاح يقود ليفربول للفوز على مانشستر سيتي',
          description: 'سجل محمد صلاح هدفين رائعين ليقود ليفربول للفوز على مانشستر سيتي بثلاثة أهداف مقابل هدف واحد في قمة الدوري الإنجليزي.',
          image: '/placeholder.svg',
          date: new Date(Date.now() - 86400000).toISOString(),
          source: 'بي بي سي سبورت'
        }
      ]
      
      return new Response(
        JSON.stringify({ 
          news: fallbackNews,
          success: true,
          source: 'fallback'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Fetching real football news from NewsAPI...')

    // جلب الأخبار الرياضية الحقيقية
    const newsResponse = await fetch(`https://newsapi.org/v2/everything?q=football+soccer+كرة+القدم+الدوري+السعودي+البريميرليغ&language=ar,en&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    let newsData = []

    if (newsResponse.ok) {
      const data = await newsResponse.json()
      console.log(`NewsAPI returned ${data.articles?.length || 0} articles`)
      
      newsData = data.articles?.map((article: any, index: number) => ({
        id: `news-${index}-${Date.now()}`,
        title: article.title || 'عنوان الخبر',
        description: article.description || article.content?.substring(0, 200) + '...' || 'وصف الخبر',
        image: article.urlToImage || '/placeholder.svg',
        video: null, // NewsAPI لا يوفر فيديوهات مباشرة
        date: article.publishedAt,
        source: article.source?.name || 'مصدر غير معروف',
        url: article.url
      })).filter((news: any) => news.title && news.description) || []
    } else {
      console.error('NewsAPI error:', newsResponse.status, await newsResponse.text())
    }

    // إضافة أخبار من مصادر أخرى إذا كان العدد قليل
    if (newsData.length < 5) {
      console.log('Adding sports news from alternative sources...')
      
      // جلب أخبار رياضية إضافية من مصادر أخرى
      const sportsResponse = await fetch(`https://newsapi.org/v2/top-headlines?category=sports&language=ar&pageSize=15&apiKey=${newsApiKey}`)
      
      if (sportsResponse.ok) {
        const sportsData = await sportsResponse.json()
        const additionalNews = sportsData.articles?.map((article: any, index: number) => ({
          id: `sports-${index}-${Date.now()}`,
          title: article.title || 'عنوان الخبر الرياضي',
          description: article.description || article.content?.substring(0, 200) + '...' || 'وصف الخبر الرياضي',
          image: article.urlToImage || '/placeholder.svg',
          video: null,
          date: article.publishedAt,
          source: article.source?.name || 'مصدر رياضي',
          url: article.url
        })).filter((news: any) => news.title && news.description) || []
        
        newsData = [...newsData, ...additionalNews]
      }
    }

    // إذا لم تنجح أي من APIs، استخدم بيانات احتياطية
    if (newsData.length === 0) {
      console.log('No news found, using fallback data')
      newsData = [
        {
          id: 'fallback-1',
          title: 'الهلال يتصدر الدوري السعودي بفوز مثير',
          description: 'حقق نادي الهلال فوزاً مهماً في الدوري السعودي ليتصدر جدول الترتيب بفارق نقطتين عن أقرب منافسيه.',
          image: '/placeholder.svg',
          date: new Date().toISOString(),
          source: 'الرياضية السعودية'
        },
        {
          id: 'fallback-2',
          title: 'منتخب السعودية يستعد لمباراة حاسمة',
          description: 'يخوض المنتخب السعودي الأول لكرة القدم تدريبات مكثفة استعداداً للمباراة المقبلة في تصفيات كأس العالم.',
          image: '/placeholder.svg',
          date: new Date(Date.now() - 3600000).toISOString(),
          source: 'اتحاد كرة القدم السعودي'
        },
        {
          id: 'fallback-3',
          title: 'ريال مدريد يحقق انتصاراً مهماً في دوري الأبطال',
          description: 'تمكن ريال مدريد من تحقيق فوز مهم في دوري أبطال أوروبا ليقترب من التأهل للدور التالي.',
          image: '/placeholder.svg',
          date: new Date(Date.now() - 7200000).toISOString(),
          source: 'ماركا'
        }
      ]
    }

    // ترتيب الأخبار حسب التاريخ وأخذ أحدث 20 خبر
    newsData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    newsData = newsData.slice(0, 20)

    console.log(`=== Returning ${newsData.length} news articles ===`)

    return new Response(
      JSON.stringify({ 
        news: newsData,
        success: true,
        source: 'newsapi'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Error in football news API ===', error)
    
    // بيانات احتياطية في حالة حدوث خطأ
    const fallbackNews = [
      {
        id: 'error-fallback-1',
        title: 'أخبار كرة القدم - خدمة مؤقتة',
        description: 'نعتذر، الخدمة الإخبارية غير متاحة حالياً. نعمل على إصلاح المشكلة.',
        image: '/placeholder.svg',
        date: new Date().toISOString(),
        source: 'النظام'
      }
    ]
    
    return new Response(
      JSON.stringify({ 
        news: fallbackNews,
        success: false,
        error: 'خطأ في الخادم',
        source: 'error-fallback'
      }),
      { 
        status: 200, // نعيد 200 مع بيانات احتياطية بدلاً من 500
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
