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

// ترجمة أسماء الفرق - تحديث وتوسيع القائمة
const teamTranslations: { [key: string]: string } = {
  // الفرق السعودية
  'Al Hilal': 'الهلال',
  'Al Nassr': 'النصر', 
  'Al Ahli': 'الأهلي',
  'Al Ittihad': 'الاتحاد',
  'Al Shabab': 'الشباب',
  'Al Ettifaq': 'الاتفاق',
  'Al Taawoun': 'التعاون',
  'Al Fayha': 'الفيحاء',
  'Al Riyadh': 'الرياض',
  'Al Khaleej': 'الخليج',
  'Damac': 'ضمك',
  'Al Fateh': 'الفتح',
  'Al Raed': 'الرائد',
  'Al Tai': 'التائي',
  'Al Hazem': 'الحزم',
  'Al Wehda': 'الوحدة',
  'Al Qadsiah': 'القادسية',
  'Al Okhdood': 'الأخدود',
  
  // الفرق المصرية
  'Al Ahly': 'الأهلي',
  'Zamalek': 'الزمالك',
  'Pyramids FC': 'بيراميدز',
  'Ismaily': 'الإسماعيلي',
  'Al Masry': 'المصري',
  'ENPPI': 'إنبي',
  'El Gouna': 'الجونة',
  'Ceramica Cleopatra': 'سيراميكا كليوباترا',
  'National Bank of Egypt': 'البنك الأهلي',
  'Pharco FC': 'فاركو',
  'ZED FC': 'زيد',
  'Smouha': 'سموحة',
  'Al Ittihad Alexandria': 'الاتحاد السكندري',
  'Al Mokawloon': 'المقاولون العرب',
  'Ghazl El Mahalla': 'غزل المحلة',
  'Haras El Hodoud': 'حرس الحدود',
  'Al Dakhliya': 'الداخلية',
  'Aswan SC': 'أسوان',
  
  // الفرق الإماراتية
  'Al Ain': 'العين',
  'Al Wasl': 'الوصل',
  'Shabab Al Ahli Dubai': 'شباب الأهلي دبي',
  'Al Jazira': 'الجزيرة',
  'Al Wahda': 'الوحدة',
  'Sharjah': 'الشارقة',
  'Al Nasr': 'النصر',
  'Ajman': 'عجمان',
  'Emirates': 'الإمارات',
  'Al Dhafra': 'الظفرة',
  'Khorfakkan': 'خورفكان',
  'Al Bataeh': 'البطائح',
  'Kalba': 'كلباء',
  'Ittihad Kalba': 'اتحاد كلباء',
  
  // الفرق القطرية
  'Al Sadd': 'السد',
  'Al Duhail': 'الدحيل',
  'Al Rayyan': 'الريان',
  'Al Gharafa': 'الغرافة',
  'Al Arabi': 'العربي',
  'Al Wakrah': 'الوكرة',
  'Qatar SC': 'قطر',
  'Al Ahli Doha': 'الأهلي',
  'Al Sailiya': 'السيلية',
  'Al Markhiya': 'المرخية',
  'Al Shamal': 'الشمال',
  'Umm Salal': 'أم صلال',
  
  // الفرق العالمية الشهيرة
  'Real Madrid': 'ريال مدريد',
  'Barcelona': 'برشلونة',
  'Manchester United': 'مانشستر يونايتد',
  'Manchester City': 'مانشستر سيتي',
  'Liverpool': 'ليفربول',
  'Chelsea': 'تشيلسي',
  'Arsenal': 'آرسنال',
  'Tottenham': 'توتنهام',
  'Bayern Munich': 'بايرن ميونيخ',
  'Borussia Dortmund': 'بوروسيا دورتمند',
  'Paris Saint-Germain': 'باريس سان جيرمان',
  'Juventus': 'يوفنتوس',
  'AC Milan': 'إيه سي ميلان',
  'Inter Milan': 'إنتر ميلان',
  'Atletico Madrid': 'أتلتيكو مدريد',
  'Sevilla': 'إشبيلية',
  'Valencia': 'فالنسيا',
  'Villarreal': 'فياريال',
  'Newcastle United': 'نيوكاسل يونايتد',
  'West Ham United': 'وست هام يونايتد',
  'Brighton': 'برايتون',
  'Aston Villa': 'أستون فيلا',
  'Crystal Palace': 'كريستال بالاس'
}

// معرفات الدوريات المهمة
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
  console.log('=== Football matches API called ===')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // استخدام مفتاح API الجديد
    const apiKey = 'cc800cbaffd9f1c8a39ba4cd742815c0'
    
    console.log('Using new API Key:', apiKey.substring(0, 8) + '...')

    // Test the API key first with a simple call
    const testResponse = await fetch('https://v3.football.api-sports.io/status', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    })
    
    console.log('API Status Response:', testResponse.status)
    
    if (!testResponse.ok) {
      console.error('API Key test failed:', testResponse.status, testResponse.statusText)
      return new Response(
        JSON.stringify({ 
          error: 'مفتاح API غير صالح أو منتهي الصلاحية',
          matches: []
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const statusData = await testResponse.json()
    console.log('API Status Data:', statusData)

    // قراءة المعاملات من الطلب أو URL
    let requestBody: any = {}
    const url = new URL(req.url)
    const statusFromUrl = url.searchParams.get('status')
    const dateFromUrl = url.searchParams.get('date')
    
    try {
      if (req.method === 'POST') {
        const text = await req.text()
        if (text) {
          requestBody = JSON.parse(text)
        }
        console.log('Request body received:', requestBody)
      }
    } catch (e) {
      console.log('Error parsing body, using defaults:', e)
    }
    
    const status = requestBody.status || statusFromUrl || 'live'
    const date = requestBody.date || dateFromUrl || new Date().toISOString().split('T')[0]
    
    console.log(`Processing request - Status: ${status}, Date: ${date}`)

    let allMatches: any[] = []
    let apiUrl = ''

    // تحديد URL API حسب الحالة المطلوبة مع تحسين المعالجة
    try {
      if (status === 'live') {
        apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all'
        console.log('Fetching live matches from:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        })
        
        console.log('API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Live matches API response:', {
            results: data.response?.length || 0,
            paging: data.paging,
            errors: data.errors
          })
          
          allMatches = data.response || []
        } else {
          console.error('Live matches API error:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('Error details:', errorText)
        }
      } 
      else if (status === 'finished') {
        // للمباريات المنتهية - جلب مباريات الأيام الماضية
        const dates = []
        for (let i = 0; i < 5; i++) {
          const pastDate = new Date(Date.now() - (i * 86400000))
          dates.push(pastDate.toISOString().split('T')[0])
        }
        
        for (const searchDate of dates) {
          try {
            apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=FT`
            console.log(`Fetching finished matches for date: ${searchDate}`)
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log(`API response for ${searchDate}:`, {
                results: data.response?.length || 0,
                paging: data.paging
              })
              
              if (data.response && data.response.length > 0) {
                allMatches = [...allMatches, ...data.response]
              }
            } else {
              console.error(`API error for ${searchDate}:`, response.status, response.statusText)
            }
            
            // إضافة تأخير قصير بين الطلبات
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            console.error(`Network error for ${searchDate}:`, error)
          }
        }
      } 
      else if (status === 'upcoming') {
        // للمباريات القادمة - جلب مباريات الأيام القادمة
        const dates = []
        for (let i = 0; i < 7; i++) {
          const futureDate = new Date(Date.now() + (i * 86400000))
          dates.push(futureDate.toISOString().split('T')[0])
        }
        
        for (const searchDate of dates) {
          try {
            apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=NS`
            console.log(`Fetching upcoming matches for date: ${searchDate}`)
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log(`API response for ${searchDate}:`, {
                results: data.response?.length || 0,
                paging: data.paging
              })
              
              if (data.response && data.response.length > 0) {
                allMatches = [...allMatches, ...data.response]
              }
            } else {
              console.error(`API error for ${searchDate}:`, response.status, response.statusText)
            }
            
            // إضافة تأخير قصير بين الطلبات
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            console.error(`Network error for ${searchDate}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error)
    }

    console.log(`Total fetched matches: ${allMatches.length}`)

    // فلترة المباريات حسب الدوريات المستهدفة
    let filteredMatches = allMatches.filter((fixture: any) => 
      targetLeagues.includes(fixture.league.id)
    )

    console.log(`Filtered to ${filteredMatches.length} matches from target leagues`)

    // إذا لم توجد مباريات في الدوريات المستهدفة، أظهر المباريات الشائعة
    if (filteredMatches.length === 0 && allMatches.length > 0) {
      console.log('No matches in target leagues, showing popular matches')
      filteredMatches = allMatches.slice(0, 50)
    }

    // تحويل البيانات إلى التنسيق المطلوب مع الترجمة المحسنة
    const matches = filteredMatches.map((fixture: any) => {
      const leagueName = fixture.league.name
      const arabicLeagueName = leagueTranslations[leagueName] || leagueName

      // ترجمة أسماء الفرق مع معالجة أفضل
      const homeTeamName = teamTranslations[fixture.teams.home.name] || fixture.teams.home.name
      const awayTeamName = teamTranslations[fixture.teams.away.name] || fixture.teams.away.name

      let matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming'
      if (fixture.fixture.status.short === 'LIVE' || fixture.fixture.status.short === '1H' || 
          fixture.fixture.status.short === '2H' || fixture.fixture.status.short === 'HT' ||
          fixture.fixture.status.short === 'ET' || fixture.fixture.status.short === 'BT' ||
          fixture.fixture.status.short === 'P' || fixture.fixture.status.short === 'SUSP' ||
          fixture.fixture.status.short === 'INT') {
        matchStatus = 'live'
      } else if (fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || 
                 fixture.fixture.status.short === 'PEN' || fixture.fixture.status.short === 'PST' ||
                 fixture.fixture.status.short === 'CANC' || fixture.fixture.status.short === 'ABD' ||
                 fixture.fixture.status.short === 'AWD' || fixture.fixture.status.short === 'WO') {
        matchStatus = 'finished'
      }

      return {
        id: fixture.fixture.id.toString(),
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
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

    console.log(`=== Returning ${matches.length} processed matches for status: ${status} ===`)

    return new Response(
      JSON.stringify({ 
        matches,
        totalAvailable: allMatches.length || 0,
        fromTargetLeagues: filteredMatches.length > 0,
        requestedStatus: status,
        success: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Error in football matches API ===', error)
    return new Response(
      JSON.stringify({ 
        error: 'خطأ في الخادم',
        matches: [],
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
