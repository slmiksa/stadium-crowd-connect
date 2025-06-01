
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ترجمات محسنة للدوريات
const leagueTranslations: { [key: string]: string } = {
  'Saudi Pro League': 'دوري روشن السعودي',
  'Saudi Professional League': 'دوري روشن السعودي',
  'King Cup': 'كأس الملك',
  'Saudi Super Cup': 'كأس السوبر السعودي',
  'Arab Club Champions Cup': 'كأس العرب للأندية الأبطال',
  'AFC Champions League': 'دوري أبطال آسيا',
  'AFC Champions League Elite': 'دوري أبطال آسيا النخبة',
  'World Cup': 'كأس العالم',
  'FIFA World Cup': 'كأس العالم فيفا',
  'Champions League': 'دوري الأبطال الأوروبي',
  'UEFA Champions League': 'دوري أبطال أوروبا',
  'Premier League': 'الدوري الإنجليزي الممتاز',
  'English Premier League': 'الدوري الإنجليزي الممتاز',
  'La Liga': 'الليغا الإسبانية',
  'LaLiga': 'الليغا الإسبانية',
  'Bundesliga': 'الدوري الألماني',
  'German Bundesliga': 'الدوري الألماني',
  'Serie A': 'الدوري الإيطالي',
  'Italian Serie A': 'الدوري الإيطالي',
  'Ligue 1': 'الدوري الفرنسي',
  'French Ligue 1': 'الدوري الفرنسي',
  'Copa America': 'كوبا أمريكا',
  'UEFA Euro': 'بطولة أوروبا',
  'European Championship': 'بطولة أوروبا',
  'CAF Champions League': 'دوري أبطال أفريقيا',
  'Egypt Cup': 'كأس مصر',
  'Egyptian Premier League': 'الدوري المصري الممتاز',
  'UAE Pro League': 'دوري أدنوك الإماراتي',
  'UAE Arabian Gulf League': 'دوري الخليج العربي الإماراتي',
  'Qatar Stars League': 'دوري نجوم قطر',
  'Qatari Stars League': 'دوري نجوم قطر',
  'Moroccan Botola Pro': 'البطولة الاحترافية المغربية',
  'Botola Pro': 'البطولة الاحترافية المغربية',
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
  'Europa League': 'الدوري الأوروبي',
  'UEFA Europa League': 'الدوري الأوروبي',
  'Conference League': 'دوري المؤتمر الأوروبي',
  'UEFA Conference League': 'دوري المؤتمر الأوروبي',
  'Nations League': 'دوري الأمم',
  'UEFA Nations League': 'دوري الأمم الأوروبي'
}

// ترجمات محسنة للفرق مع إضافات جديدة
const teamTranslations: { [key: string]: string } = {
  // الفرق السعودية - كاملة ومحسنة
  'Al Hilal': 'الهلال',
  'Al-Hilal': 'الهلال', 
  'Al Hilal Saudi FC': 'الهلال',
  'Al Nassr': 'النصر',
  'Al-Nassr': 'النصر',
  'Al Nassr Saudi FC': 'النصر',
  'Al Ahli': 'الأهلي',
  'Al-Ahli': 'الأهلي',
  'Al Ahli Saudi FC': 'الأهلي',
  'Al Ittihad': 'الاتحاد',
  'Al-Ittihad': 'الاتحاد',
  'Al Ittihad Jeddah': 'الاتحاد',
  'Al Shabab': 'الشباب',
  'Al-Shabab': 'الشباب',
  'Al Shabab Saudi FC': 'الشباب',
  'Al Ettifaq': 'الاتفاق',
  'Al-Ettifaq': 'الاتفاق',
  'Al Taawoun': 'التعاون',
  'Al-Taawoun': 'التعاون',
  'Al Fayha': 'الفيحاء',
  'Al-Fayha': 'الفيحاء',
  'Al Riyadh': 'الرياض',
  'Al-Riyadh': 'الرياض',
  'Al Khaleej': 'الخليج',
  'Al-Khaleej': 'الخليج',
  'Damac': 'ضمك',
  'Damac FC': 'ضمك',
  'Al Fateh': 'الفتح',
  'Al-Fateh': 'الفتح',
  'Al Raed': 'الرائد',
  'Al-Raed': 'الرائد',
  'Al Tai': 'التائي',
  'Al-Tai': 'التائي',
  'Al Hazem': 'الحزم',
  'Al-Hazem': 'الحزم',
  'Al Wehda': 'الوحدة',
  'Al-Wehda': 'الوحدة',
  'Al Qadsiah': 'القادسية',
  'Al-Qadsiah': 'القادسية',
  'Al Okhdood': 'الأخدود',
  'Al-Okhdood': 'الأخدود',
  
  // الفرق المصرية - محسنة
  'Al Ahly': 'الأهلي المصري',
  'Al-Ahly': 'الأهلي المصري',
  'Al Ahly Cairo': 'الأهلي المصري',
  'Zamalek': 'الزمالك',
  'Zamalek SC': 'الزمالك',
  'Pyramids FC': 'بيراميدز',
  'Pyramids': 'بيراميدز',
  'Ismaily': 'الإسماعيلي',
  'Ismaily SC': 'الإسماعيلي',
  'Al Masry': 'المصري',
  'Al-Masry': 'المصري',
  'ENPPI': 'إنبي',
  'ENPPI Club': 'إنبي',
  'El Gouna': 'الجونة',
  'El Gouna FC': 'الجونة',
  'Ceramica Cleopatra': 'سيراميكا كليوباترا',
  'National Bank of Egypt': 'البنك الأهلي',
  'NBE Club': 'البنك الأهلي',
  'Pharco FC': 'فاركو',
  'Pharco': 'فاركو',
  'ZED FC': 'زيد',
  'ZED': 'زيد',
  'Smouha': 'سموحة',
  'Smouha SC': 'سموحة',
  'Al Ittihad Alexandria': 'الاتحاد السكندري',
  'Al Mokawloon': 'المقاولون العرب',
  'Arab Contractors': 'المقاولون العرب',
  'Ghazl El Mahalla': 'غزل المحلة',
  'Haras El Hodoud': 'حرس الحدود',
  'Al Dakhliya': 'الداخلية',
  'Aswan SC': 'أسوان',
  
  // الفرق الإماراتية
  'Al Ain': 'العين الإماراتي',
  'Al-Ain': 'العين الإماراتي',
  'Al Ain FC': 'العين الإماراتي',
  'Al Wasl': 'الوصل',
  'Al-Wasl': 'الوصل',
  'Shabab Al Ahli Dubai': 'شباب الأهلي دبي',
  'Shabab Al-Ahli': 'شباب الأهلي دبي',
  'Al Jazira': 'الجزيرة الإماراتي',
  'Al-Jazira': 'الجزيرة الإماراتي',
  'Al Wahda': 'الوحدة الإماراتي',
  'Al-Wahda UAE': 'الوحدة الإماراتي',
  'Sharjah': 'الشارقة',
  'Sharjah FC': 'الشارقة',
  'Al Nasr Dubai': 'النصر الإماراتي',
  'Al-Nasr Dubai': 'النصر الإماراتي',
  'Ajman': 'عجمان',
  'Ajman Club': 'عجمان',
  'Emirates': 'الإمارات',
  'Emirates Club': 'الإمارات',
  'Al Dhafra': 'الظفرة',
  'Al-Dhafra': 'الظفرة',
  'Khorfakkan': 'خورفكان',
  'Khorfakkan Club': 'خورفكان',
  'Al Bataeh': 'البطائح',
  'Al-Bataeh': 'البطائح',
  'Kalba': 'كلباء',
  'Kalba FC': 'كلباء',
  
  // الفرق القطرية
  'Al Sadd': 'السد القطري',
  'Al-Sadd': 'السد القطري',
  'Al Duhail': 'الدحيل',
  'Al-Duhail': 'الدحيل',
  'Al Rayyan': 'الريان القطري',
  'Al-Rayyan': 'الريان القطري',
  'Al Gharafa': 'الغرافة',
  'Al-Gharafa': 'الغرافة',
  'Al Arabi': 'العربي القطري',
  'Al-Arabi Qatar': 'العربي القطري',
  'Al Wakrah': 'الوكرة',
  'Al-Wakrah': 'الوكرة',
  'Qatar SC': 'قطر',
  'Qatar Sports Club': 'قطر',
  'Al Ahli Doha': 'الأهلي القطري',
  'Al-Ahli Qatar': 'الأهلي القطري',
  'Al Sailiya': 'السيلية',
  'Al-Sailiya': 'السيلية',
  'Al Markhiya': 'المرخية',
  'Al-Markhiya': 'المرخية',
  'Al Shamal': 'الشمال',
  'Al-Shamal': 'الشمال',
  'Umm Salal': 'أم صلال',
  'Umm-Salal': 'أم صلال',
  
  // الفرق العالمية الشهيرة - محسنة
  'Real Madrid': 'ريال مدريد',
  'Real Madrid CF': 'ريال مدريد',
  'Barcelona': 'برشلونة',
  'FC Barcelona': 'برشلونة',
  'Manchester United': 'مانشستر يونايتد',
  'Manchester United FC': 'مانشستر يونايتد',
  'Manchester City': 'مانشستر سيتي',
  'Manchester City FC': 'مانشستر سيتي',
  'Liverpool': 'ليفربول',
  'Liverpool FC': 'ليفربول',
  'Chelsea': 'تشيلسي',
  'Chelsea FC': 'تشيلسي',
  'Arsenal': 'آرسنال',
  'Arsenal FC': 'آرسنال',
  'Tottenham': 'توتنهام',
  'Tottenham Hotspur': 'توتنهام',
  'Bayern Munich': 'بايرن ميونيخ',
  'FC Bayern Munich': 'بايرن ميونيخ',
  'Borussia Dortmund': 'بوروسيا دورتمند',
  'BV Borussia Dortmund': 'بوروسيا دورتمند',
  'Paris Saint-Germain': 'باريس سان جيرمان',
  'PSG': 'باريس سان جيرمان',
  'Juventus': 'يوفنتوس',
  'Juventus FC': 'يوفنتوس',
  'AC Milan': 'إيه سي ميلان',
  'AC Milan': 'إيه سي ميلان',
  'Inter Milan': 'إنتر ميلان',
  'FC Internazionale': 'إنتر ميلان',
  'Atletico Madrid': 'أتلتيكو مدريد',
  'Atlético Madrid': 'أتلتيكو مدريد',
  'Sevilla': 'إشبيلية',
  'Sevilla FC': 'إشبيلية',
  'Valencia': 'فالنسيا',
  'Valencia CF': 'فالنسيا',
  'Villarreal': 'فياريال',
  'Villarreal CF': 'فياريال',
  'Newcastle United': 'نيوكاسل يونايتد',
  'Newcastle United FC': 'نيوكاسل يونايتد',
  'West Ham United': 'وست هام يونايتد',
  'West Ham United FC': 'وست هام يونايتد',
  'Brighton': 'برايتون',
  'Brighton & Hove Albion': 'برايتون',
  'Aston Villa': 'أستون فيلا',
  'Aston Villa FC': 'أستون فيلا',
  'Crystal Palace': 'كريستال بالاس',
  'Crystal Palace FC': 'كريستال بالاس',
  'Brentford': 'برينتفورد',
  'Brentford FC': 'برينتفورد',
  'Leeds United': 'ليدز يونايتد',
  'Leeds United FC': 'ليدز يونايتد',
  'Leicester City': 'ليستر سيتي',
  'Leicester City FC': 'ليستر سيتي',
  'Everton': 'إيفرتون',
  'Everton FC': 'إيفرتون',
  'Wolves': 'وولفرهامبتون',
  'Wolverhampton Wanderers': 'وولفرهامبتون',
  'Southampton': 'ساوثهامبتون',
  'Southampton FC': 'ساوثهامبتون'
}

// معرفات الدوريات المهمة - محدثة
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
  3,   // Europa League
  848, // Conference League
  5,   // Nations League
  
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
    const apiKey = 'cc800cbaffd9f1c8a39ba4cd742815c0'
    
    console.log('Using API Key:', apiKey.substring(0, 8) + '...')

    // قراءة المعاملات من الطلب
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
        }
      } 
      else if (status === 'finished') {
        // للمباريات المنتهية - جلب مباريات الأيام الماضية
        const dates = []
        for (let i = 0; i < 3; i++) {
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
                results: data.response?.length || 0
              })
              
              if (data.response && data.response.length > 0) {
                allMatches = [...allMatches, ...data.response]
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            console.error(`Error for ${searchDate}:`, error)
          }
        }
      } 
      else if (status === 'upcoming') {
        // للمباريات القادمة - جلب مباريات الأيام القادمة
        const dates = []
        for (let i = 0; i < 5; i++) {
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
                results: data.response?.length || 0
              })
              
              if (data.response && data.response.length > 0) {
                allMatches = [...allMatches, ...data.response]
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            console.error(`Error for ${searchDate}:`, error)
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
