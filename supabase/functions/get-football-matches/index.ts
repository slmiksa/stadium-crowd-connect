
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// خريطة الدوريات مع ترجمتها العربية
const leagueTranslations: { [key: string]: string } = {
  'Saudi Pro League': 'دوري روشن السعودي',
  'King Cup': 'كأس الملك',
  'Saudi Super Cup': 'كأس السوبر السعودي',
  'Arab Club Champions Cup': 'كأس العرب للأندية الأبطال',
  'AFC Champions League': 'دوري أبطال آسيا',
  'World Cup': 'كأس العالم',
  'Champions League': 'دوري الأبطال',
  'Premier League': 'الدوري الإنجليزي الممتاز',
  'La Liga': 'الليغا الإسبانية',
  'Bundesliga': 'الدوري الألماني',
  'Serie A': 'الدوري الإيطالي',
  'Ligue 1': 'الدوري الفرنسي',
  'Copa America': 'كوبا أمريكا',
  'UEFA Euro': 'بطولة أوروبا',
  'CAF Champions League': 'دوري أبطال أفريقيا',
  'Egypt Cup': 'كأس مصر',
  'Egyptian Premier League': 'الدوري المصري الممتاز',
  'UAE Pro League': 'دوري أدنوك الإماراتي',
  'Qatar Stars League': 'دوري نجوم قطر',
  'Moroccan Botola Pro': 'البطولة الاحترافية المغربية',
  'Tunisian Ligue 1': 'الرابطة التونسية المحترفة الأولى',
  'Algerian Ligue 1': 'الرابطة الجزائرية المحترفة الأولى',
  'Iraqi Premier League': 'الدوري العراقي الممتاز',
  'Jordan League': 'دوري المحترفين الأردني',
  'Lebanese Premier League': 'الدوري اللبناني الممتاز',
  'Syrian Premier League': 'الدوري السوري الممتاز',
  'FA Cup': 'كأس الاتحاد الإنجليزي',
  'Copa del Rey': 'كأس ملك إسبانيا',
  'DFB Pokal': 'كأس ألمانيا',
  'Coppa Italia': 'كأس إيطاليا',
  'Coupe de France': 'كأس فرنسا'
}

// معرفات الدوريات المهمة (إضافة المزيد من الدوريات العالمية)
const targetLeagues = [
  // السعودية
  307, // Saudi Pro League
  556, // King Cup Saudi Arabia
  308, // Saudi Super Cup
  
  // آسيا والعرب
  480, // AFC Champions League
  233, // Egyptian Premier League
  301, // UAE Pro League
  274, // Qatar Stars League
  200, // Moroccan Botola Pro
  202, // Tunisian Ligue 1
  204, // Algerian Ligue 1
  269, // Iraqi Premier League
  664, // Jordan League
  289, // Lebanese Premier League
  288, // Syrian Premier League
  
  // عالمية
  1,   // World Cup
  2,   // Champions League
  39,  // Premier League
  140, // La Liga
  78,  // Bundesliga
  135, // Serie A
  61,  // Ligue 1
  9,   // Copa America
  4,   // UEFA Euro
  12,  // CAF Champions League
  
  // كؤوس محلية
  48,  // FA Cup
  143, // Copa del Rey
  81,  // DFB Pokal
  137, // Coppa Italia
  66   // Coupe de France
]

serve(async (req) => {
  console.log('Football matches API called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // استخدام مفتاح API من Supabase Secrets
    const apiKey = Deno.env.get('FOOTBALL_API_KEY')
    
    if (!apiKey) {
      console.error('FOOTBALL_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'مفتاح API غير موجود، يرجى إعداده في Supabase Secrets' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('Using API Key from Supabase Secrets:', apiKey.substring(0, 8) + '...')

    // قراءة المعاملات - تجربة طرق مختلفة
    let status = 'live'
    let date = new Date().toISOString().split('T')[0]
    
    // محاولة قراءة من body أولاً
    try {
      if (req.method === 'POST') {
        const requestText = await req.text()
        console.log('Raw request body:', requestText)
        
        if (requestText) {
          const body = JSON.parse(requestText)
          console.log('Parsed body:', body)
          
          if (body.status) {
            status = body.status
            console.log('Status from body:', status)
          }
          if (body.date) {
            date = body.date
            console.log('Date from body:', date)
          }
        }
      }
    } catch (e) {
      console.log('Error reading body:', e)
      // محاولة قراءة من URL parameters
      try {
        const url = new URL(req.url)
        const urlStatus = url.searchParams.get('status')
        const urlDate = url.searchParams.get('date')
        
        if (urlStatus) {
          status = urlStatus
          console.log('Status from URL:', status)
        }
        if (urlDate) {
          date = urlDate
          console.log('Date from URL:', date)
        }
      } catch (urlError) {
        console.log('Error reading URL params:', urlError)
      }
    }
    
    console.log(`Final parameters - Status: ${status}, Date: ${date}`)

    // جلب المباريات من API Football
    let apiUrl: string
    
    if (status === 'live') {
      apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all'
    } else if (status === 'finished') {
      apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&status=FT`
    } else {
      // upcoming matches
      apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&status=NS`
    }

    console.log('Making API call to:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    })

    console.log('API Response status:', response.status)

    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('API error response:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'فشل في جلب البيانات من API',
          details: `Status: ${response.status}`,
          apiStatus: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log(`API returned ${data.response?.length || 0} total fixtures`)

    // إذا لم توجد مباريات في الدوريات المستهدفة، جلب جميع المباريات
    let filteredMatches = data.response?.filter((fixture: any) => 
      targetLeagues.includes(fixture.league.id)
    ) || []

    console.log(`Filtered to ${filteredMatches.length} matches from target leagues`)

    // إذا لم توجد مباريات في الدوريات المستهدفة، جلب أهم المباريات
    if (filteredMatches.length === 0 && data.response && data.response.length > 0) {
      console.log('No matches in target leagues, showing popular matches')
      // أخذ أول 20 مباراة من أي دوري
      filteredMatches = data.response.slice(0, 20)
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const matches = filteredMatches.map((fixture: any) => {
      const leagueName = fixture.league.name
      const arabicLeagueName = leagueTranslations[leagueName] || leagueName

      let matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming'
      if (fixture.fixture.status.short === 'LIVE' || fixture.fixture.status.short === '1H' || 
          fixture.fixture.status.short === '2H' || fixture.fixture.status.short === 'HT') {
        matchStatus = 'live'
      } else if (fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || 
                 fixture.fixture.status.short === 'PEN') {
        matchStatus = 'finished'
      }

      return {
        id: fixture.fixture.id.toString(),
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        status: matchStatus,
        date: fixture.fixture.date,
        competition: arabicLeagueName,
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        leagueFlag: fixture.league.flag,
        minute: fixture.fixture.status.elapsed
      }
    })

    console.log(`Returning ${matches.length} processed matches`)

    return new Response(
      JSON.stringify({ 
        matches,
        totalAvailable: data.response?.length || 0,
        fromTargetLeagues: filteredMatches.length > 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in football matches API:', error)
    return new Response(
      JSON.stringify({ error: 'خطأ في الخادم' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
