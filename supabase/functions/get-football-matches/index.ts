
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
  'Coupe de France': 'كأس فرنسا',
  'Primera Nacional': 'الدوري الأرجنتيني الثاني',
  'National League - Northern': 'الدوري الوطني - الشمالي',
  'Friendlies Women': 'مباريات ودية للسيدات',
  'Primera B Metropolitana': 'الدرجة الأولى ب متروبوليتانا',
  'Liga Pro': 'الدوري المحترف',
  'MLS Next Pro': 'دوري أم إل إس التالي المحترف',
  'Primera B': 'الدرجة الأولى ب',
  'USL League Two': 'دوري يو إس إل الثاني',
  'Copa Colombia': 'كأس كولومبيا',
  'Torneo Federal A': 'البطولة الفيدرالية أ'
}

// ترجمة أسماء الفرق
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
  
  // فرق من الدوريات الأمريكية الجنوبية
  'Gimnasia Y Tiro': 'خيمناسيا واي تيرو',
  'Racing Cordoba': 'راسينغ قرطبة',
  'Eastern Suburbs': 'الضواحي الشرقية',
  'Fencibles United': 'فنسيبلز يونايتد',
  'Mexico W': 'المكسيك للسيدات',
  'Uruguay W': 'الأوروغواي للسيدات',
  'San Martín Burzaco': 'سان مارتين بورزاكو',
  'Real Pilar': 'ريال بيلار',
  'Macara': 'ماكارا',
  'Manta FC': 'مانتا',
  'Austin II': 'أوستن الثاني',
  'Houston Dynamo FC II': 'هيوستن دينامو الثاني',
  'San Marcos de Arica': 'سان ماركوس دي أريكا',
  'Deportes Copiapo': 'ديبورتيس كوبيابو',
  'Minneapolis City': 'مينيابوليس سيتي',
  'Chicago Dutch Lions': 'شيكاغو دوتش ليونز',
  'Brazil W': 'البرازيل للسيدات',
  'Japan W': 'اليابان للسيدات',
  'Deportivo Cali': 'ديبورتيفو كالي',
  'Popayan': 'بوبايان',
  'Sarmiento de La Banda': 'سارمينتو دي لا باندا',
  'Sarmiento Resistencia': 'سارمينتو ريسيستنسيا'
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
  console.log('Football matches API called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    // قراءة المعاملات
    let status = 'live'
    let date = new Date().toISOString().split('T')[0]
    
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
    }
    
    console.log(`Final parameters - Status: ${status}, Date: ${date}`)

    let allMatches: any[] = []

    // تحديد URL API حسب الحالة المطلوبة وجلب البيانات
    if (status === 'live') {
      console.log('Fetching live matches')
      const apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all'
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      })

      if (response.ok) {
        const data = await response.json()
        allMatches = data.response || []
        console.log(`Fetched ${allMatches.length} live matches`)
      }
    } 
    else if (status === 'finished') {
      console.log('Fetching finished matches')
      // للمباريات المنتهية - جلب مباريات اليوم وأمس
      const dates = [
        date, // اليوم
        new Date(Date.now() - 86400000).toISOString().split('T')[0], // أمس
        new Date(Date.now() - 172800000).toISOString().split('T')[0] // أمس الأول
      ]
      
      for (const searchDate of dates) {
        const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=FT`
        console.log(`Fetching finished matches for date: ${searchDate}`)
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'v3.football.api-sports.io'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.response) {
              allMatches = [...allMatches, ...data.response]
              console.log(`Added ${data.response.length} finished matches from ${searchDate}`)
            }
          }
        } catch (error) {
          console.log(`Error fetching matches for ${searchDate}:`, error)
        }
      }
    } 
    else if (status === 'upcoming') {
      console.log('Fetching upcoming matches')
      // للمباريات القادمة - جلب مباريات اليوم وغداً وبعد غد
      const dates = [
        date, // اليوم
        new Date(Date.now() + 86400000).toISOString().split('T')[0], // غداً
        new Date(Date.now() + 172800000).toISOString().split('T')[0] // بعد غد
      ]
      
      for (const searchDate of dates) {
        const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=NS`
        console.log(`Fetching upcoming matches for date: ${searchDate}`)
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'v3.football.api-sports.io'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.response) {
              allMatches = [...allMatches, ...data.response]
              console.log(`Added ${data.response.length} upcoming matches from ${searchDate}`)
            }
          }
        } catch (error) {
          console.log(`Error fetching matches for ${searchDate}:`, error)
        }
      }
    }

    console.log(`Total fetched matches: ${allMatches.length}`)

    // فلترة المباريات حسب الدوريات المستهدفة
    let filteredMatches = allMatches.filter((fixture: any) => 
      targetLeagues.includes(fixture.league.id)
    )

    console.log(`Filtered to ${filteredMatches.length} matches from target leagues`)

    // إذا لم توجد مباريات في الدوريات المستهدفة، جلب المباريات الشائعة
    if (filteredMatches.length === 0 && allMatches.length > 0) {
      console.log('No matches in target leagues, showing popular matches')
      filteredMatches = allMatches.slice(0, 20)
    }

    // تحويل البيانات إلى التنسيق المطلوب مع الترجمة
    const matches = filteredMatches.map((fixture: any) => {
      const leagueName = fixture.league.name
      const arabicLeagueName = leagueTranslations[leagueName] || leagueName

      // ترجمة أسماء الفرق
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

    console.log(`Returning ${matches.length} processed matches for status: ${status}`)

    return new Response(
      JSON.stringify({ 
        matches,
        totalAvailable: allMatches.length || 0,
        fromTargetLeagues: filteredMatches.length > 0,
        requestedStatus: status
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
