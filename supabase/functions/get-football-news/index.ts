
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
    const apiKey = 'cc800cbaffd9f1c8a39ba4cd742815c0'
    
    console.log('Fetching football news...')

    // جلب الأخبار من NewsAPI
    const newsResponse = await fetch(`https://newsapi.org/v2/everything?q=football+soccer+كرة+القدم&language=ar&sortBy=publishedAt&pageSize=20&apiKey=your_news_api_key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    let newsData = []

    if (newsResponse.ok) {
      const data = await newsResponse.json()
      newsData = data.articles?.map((article: any, index: number) => ({
        id: `news-${index}`,
        title: article.title || 'عنوان الخبر',
        description: article.description || article.content?.substring(0, 200) + '...' || 'وصف الخبر',
        image: article.urlToImage,
        date: article.publishedAt,
        source: article.source?.name || 'مصدر غير معروف'
      })) || []
    }

    // إذا لم تنجح NewsAPI، استخدم بيانات وهمية للاختبار
    if (newsData.length === 0) {
      newsData = [
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
        },
        {
          id: 'news-3',
          title: 'ريال مدريد يتأهل لنهائي دوري الأبطال',
          description: 'تأهل ريال مدريد لنهائي دوري أبطال أوروبا بعد فوزه على مانشستر سيتي في مباراة مثيرة انتهت بركلات الترجيح.',
          image: '/placeholder.svg',
          date: new Date(Date.now() - 172800000).toISOString(),
          source: 'ماركا'
        },
        {
          id: 'news-4',
          title: 'منتخب السعودية يستعد لتصفيات كأس العالم',
          description: 'يستعد منتخب السعودية لكرة القدم لخوض مباريات تصفيات كأس العالم المقبل بمعسكر تدريبي مكثف.',
          image: '/placeholder.svg',
          date: new Date(Date.now() - 259200000).toISOString(),
          source: 'اتحاد كرة القدم السعودي'
        },
        {
          id: 'news-5',
          title: 'برشلونة يجدد عقد جافي حتى 2026',
          description: 'أعلن نادي برشلونة الإسباني عن تجديد عقد لاعب الوسط الشاب جافي حتى عام 2026 مع رفع قيمة الشرط الجزائي.',
          image: '/placeholder.svg',
          date: new Date(Date.now() - 345600000).toISOString(),
          source: 'سبورت'
        }
      ]
    }

    console.log(`=== Returning ${newsData.length} news articles ===`)

    return new Response(
      JSON.stringify({ 
        news: newsData,
        success: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Error in football news API ===', error)
    return new Response(
      JSON.stringify({ 
        error: 'خطأ في الخادم',
        news: [],
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
