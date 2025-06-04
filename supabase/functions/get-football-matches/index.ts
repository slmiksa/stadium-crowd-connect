import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ترجمات محسنة ومصححة للدوريات
const leagueTranslations: { [key: string]: string } = {
  // الدوريات السعودية
  'Saudi Pro League': 'دوري روشن السعودي',
  'Saudi Professional League': 'دوري روشن السعودي',
  'King Cup': 'كأس الملك',
  'Saudi Super Cup': 'كأس السوبر السعودي',
  'Arab Club Champions Cup': 'كأس العرب للأندية الأبطال',
  
  // الدوريات الآسيوية
  'AFC Champions League': 'دوري أبطال آسيا',
  'AFC Champions League Elite': 'دوري أبطال آسيا النخبة',
  
  // البطولات العالمية
  'World Cup': 'كأس العالم',
  'FIFA World Cup': 'كأس العالم فيفا',
  'FIFA Club World Cup': 'كأس العالم للأندية',
  
  // الدوريات الأوروبية
  'Champions League': 'دوري الأبطال الأوروبي',
  'UEFA Champions League': 'دوري أبطال أوروبا',
  'Europa League': 'الدوري الأوروبي',
  'UEFA Europa League': 'الدوري الأوروبي',
  'Conference League': 'دوري المؤتمر الأوروبي',
  'UEFA Conference League': 'دوري المؤتمر الأوروبي',
  
  // الدوري الإنجليزي
  'Premier League': 'الدوري الإنجليزي الممتاز',
  'English Premier League': 'الدوري الإنجليزي الممتاز',
  'Championship': 'الدرجة الأولى الإنجليزية',
  'FA Cup': 'كأس الاتحاد الإنجليزي',
  'EFL Cup': 'كأس الرابطة الإنجليزية',
  'League Cup': 'كأس الرابطة',
  
  // الدوري الإسباني
  'La Liga': 'الليغا الإسبانية',
  'LaLiga': 'الليغا الإسبانية',
  'Copa del Rey': 'كأس الملك الإسباني',
  'Supercopa de España': 'كأس السوبر الإسباني',
  
  // الدوري الألماني
  'Bundesliga': 'الدوري الألماني',
  'German Bundesliga': 'الدوري الألماني',
  '2. Bundesliga': 'الدرجة الثانية الألمانية',
  'DFB Pokal': 'كأس ألمانيا',
  
  // الدوري الإيطالي
  'Serie A': 'الدوري الإيطالي',
  'Italian Serie A': 'الدوري الإيطالي',
  'Serie B': 'الدرجة الثانية الإيطالية',
  'Coppa Italia': 'كأس إيطاليا',
  'Supercoppa Italiana': 'كأس السوبر الإيطالي',
  
  // الدوري الفرنسي
  'Ligue 1': 'الدوري الفرنسي',
  'French Ligue 1': 'الدوري الفرنسي',
  'Ligue 2': 'الدرجة الثانية الفرنسية',
  'Coupe de France': 'كأس فرنسا',
  'Trophée des Champions': 'كأس السوبر الفرنسي',
  
  // دوريات أخرى مهمة
  'Eredivisie': 'الدوري الهولندي',
  'Belgian Pro League': 'الدوري البلجيكي',
  'Primeira Liga': 'الدوري البرتغالي',
  'Russian Premier League': 'الدوري الروسي',
  'Turkish Super League': 'الدوري التركي',
  'Major League Soccer': 'الدوري الأمريكي'
}

// ترجمات محسنة ومصححة للفرق
const teamTranslations: { [key: string]: string } = {
  // الفرق السعودية
  'Al Hilal': 'الهلال',
  'Al-Hilal': 'الهلال',
  'Al Hilal SFC': 'الهلال',
  'Al Nassr': 'النصر',
  'Al-Nassr': 'النصر',
  'Al Nassr FC': 'النصر',
  'Al Ahli': 'الأهلي',
  'Al-Ahli': 'الأهلي',
  'Al Ahli Jeddah': 'الأهلي',
  'Al Ittihad': 'الاتحاد',
  'Al-Ittihad': 'الاتحاد',
  'Al Ittihad Jeddah': 'الاتحاد',
  'Al Shabab': 'الشباب',
  'Al-Shabab': 'الشباب',
  'Al Shabab FC': 'الشباب',
  'Al Ettifaq': 'الاتفاق',
  'Al-Ettifaq': 'الاتفاق',
  'Al Taawoun': 'التعاون',
  'Al-Taawoun': 'التعاون',
  'Al Fayha': 'الفيحاء',
  'Al-Fayha': 'الفيحاء',
  'Damac': 'ضمك',
  'Damac FC': 'ضمك',
  'Al Fateh': 'الفتح',
  'Al-Fateh': 'الفتح',
  'Al Raed': 'الرائد',
  'Al-Raed': 'الرائد',
  'Al Khaleej': 'الخليج',
  'Al-Khaleej': 'الخليج',
  'Al Riyadh': 'الرياض',
  'Al-Riyadh': 'الرياض',
  'Al Tai': 'التعي',
  'Al-Tai': 'التعي',
  'Al Hazem': 'الحزم',
  'Al-Hazem': 'الحزم',
  'Al Wehda': 'الوحدة',
  'Al-Wehda': 'الوحدة',
  
  // الفرق الإنجليزية
  'Manchester United': 'مانشستر يونايتد',
  'Manchester City': 'مانشستر سيتي',
  'Liverpool': 'ليفربول',
  'Chelsea': 'تشيلسي',
  'Arsenal': 'آرسنال',
  'Tottenham': 'توتنهام',
  'Tottenham Hotspur': 'توتنهام',
  'Newcastle': 'نيوكاسل',
  'Newcastle United': 'نيوكاسل يونايتد',
  'Aston Villa': 'أستون فيلا',
  'West Ham': 'ويست هام',
  'West Ham United': 'ويست هام يونايتد',
  'Brighton': 'برايتون',
  'Brighton & Hove Albion': 'برايتون',
  'Crystal Palace': 'كريستال بالاس',
  'Fulham': 'فولهام',
  'Brentford': 'برينتفورد',
  'Wolverhampton': 'وولفرهامبتون',
  'Everton': 'إيفرتون',
  'Leicester': 'ليستر سيتي',
  'Leicester City': 'ليستر سيتي',
  'Leeds United': 'ليدز يونايتد',
  'Southampton': 'ساوثهامبتون',
  'Burnley': 'بيرنلي',
  'Norwich': 'نورويتش',
  'Watford': 'واتفورد',
  'Sheffield United': 'شيفيلد يونايتد',
  'Nottingham Forest': 'نوتينغهام فورست',
  'Bournemouth': 'بورنموث',
  'Luton Town': 'لوتن تاون',
  
  // الفرق الإسبانية
  'Real Madrid': 'ريال مدريد',
  'Barcelona': 'برشلونة',
  'FC Barcelona': 'برشلونة',
  'Atletico Madrid': 'أتلتيكو مدريد',
  'Atlético Madrid': 'أتلتيكو مدريد',
  'Sevilla': 'إشبيلية',
  'Valencia': 'فالنسيا',
  'Real Betis': 'ريال بيتيس',
  'Villarreal': 'فياريال',
  'Real Sociedad': 'ريال سوسيداد',
  'Athletic Bilbao': 'أتلتيك بيلباو',
  'Getafe': 'خيتافي',
  'Osasuna': 'أوساسونا',
  'Celta Vigo': 'سيلتا فيغو',
  'Mallorca': 'مايوركا',
  'Cadiz': 'قادش',
  'Espanyol': 'إسبانيول',
  'Girona': 'جيرونا',
  'Rayo Vallecano': 'رايو فاليكانو',
  'Almeria': 'الميريا',
  'Las Palmas': 'لاس بالماس',
  'Granada': 'غرناطة',
  'Alaves': 'ألافيس',
  'Elche': 'إلتشي',
  
  // الفرق الألمانية
  'Bayern Munich': 'بايرن ميونيخ',
  'FC Bayern München': 'بايرن ميونيخ',
  'Borussia Dortmund': 'بوروسيا دورتمند',
  'RB Leipzig': 'آر بي لايبزيغ',
  'Bayer Leverkusen': 'باير ليفركوزن',
  'Eintracht Frankfurt': 'آينتراخت فرانكفورت',
  'VfL Wolfsburg': 'فولفسبورغ',
  'Borussia Mönchengladbach': 'بوروسيا مونشنغلادباخ',
  'TSG Hoffenheim': 'هوفنهايم',
  'FC Cologne': 'كولونيا',
  'Union Berlin': 'يونيون برلين',
  'SC Freiburg': 'فرايبورغ',
  'VfB Stuttgart': 'شتوتغارت',
  'Mainz': 'ماينز',
  'Augsburg': 'أوغسبورغ',
  'Hertha Berlin': 'هيرتا برلين',
  'Arminia Bielefeld': 'أرمينيا بيليفيلد',
  'Greuther Fürth': 'غرويتر فورث',
  
  // الفرق الإيطالية
  'Juventus': 'يوفنتوس',
  'AC Milan': 'إيه سي ميلان',
  'Inter Milan': 'إنتر ميلان',
  'Inter': 'إنتر ميلان',
  'FC Internazionale Milano': 'إنتر ميلان',
  'AS Roma': 'روما',
  'Roma': 'روما',
  'Napoli': 'نابولي',
  'Lazio': 'لاتسيو',
  'Atalanta': 'أتالانتا',
  'Fiorentina': 'فيورنتينا',
  'Torino': 'تورينو',
  'Sassuolo': 'ساسولو',
  'Bologna': 'بولونيا',
  'Udinese': 'أودينيزي',
  'Sampdoria': 'سامبدوريا',
  'Cagliari': 'كالياري',
  'Genoa': 'جنوة',
  'Spezia': 'سبيتسيا',
  'Venezia': 'فينيسيا',
  'Salernitana': 'ساليرنيتانا',
  'Empoli': 'إمبولي',
  'Hellas Verona': 'هيلاس فيرونا',
  'Lecce': 'ليتشي',
  'Monza': 'مونزا',
  'Cremonese': 'كريمونيزي',
  
  // الفرق الفرنسية
  'Paris Saint-Germain': 'باريس سان جيرمان',
  'PSG': 'باريس سان جيرمان',
  'Marseille': 'مارسيليا',
  'Olympique Marseille': 'مارسيليا',
  'Lyon': 'ليون',
  'Olympique Lyon': 'ليون',
  'Monaco': 'موناكو',
  'AS Monaco': 'موناكو',
  'Lille': 'ليل',
  'Rennes': 'رين',
  'Nice': 'نيس',
  'Strasbourg': 'ستراسبورغ',
  'Lens': 'لانس',
  'Montpellier': 'مونبلييه',
  'Nantes': 'نانت',
  'Reims': 'ريمس',
  'Brest': 'بريست',
  'Lorient': 'لوريان',
  'Clermont': 'كليرمون',
  'Troyes': 'تروا',
  'Saint-Etienne': 'سانت إتيان',
  'Bordeaux': 'بوردو'
}

serve(async (req) => {
  console.log('=== تم استدعاء API المباريات ===')
  
  if (req.method === 'OPTIONS') {
    console.log('معالجة طلب CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = '5879d532d5877f431c3cadfd42d19ccf'
    console.log('استخدام مفتاح API:', apiKey.substring(0, 8) + '...')

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
      }
    } catch (e) {
      console.log('خطأ في تحليل البيانات:', e)
    }
    
    const status = requestBody.status || statusFromUrl || 'live'
    const date = requestBody.date || dateFromUrl || new Date().toISOString().split('T')[0]
    
    console.log(`معالجة الطلب - الحالة: ${status}, التاريخ: ${date}`)

    let allMatches: any[] = []

    try {
      if (status === 'live') {
        const apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all'
        console.log('جلب المباريات المباشرة من:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('استجابة API المباريات المباشرة:', {
            results: data.response?.length || 0,
            errors: data.errors
          })
          
          if (!data.errors || Object.keys(data.errors).length === 0) {
            allMatches = data.response || []
          }
        } else {
          console.error('خطأ في استجابة API المباشر:', response.status)
        }
      } 
      else if (status === 'finished') {
        // جلب المباريات المنتهية لأمس فقط
        const yesterday = new Date(Date.now() - 86400000)
        const searchDate = yesterday.toISOString().split('T')[0]
        
        const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=FT`
        console.log(`جلب المباريات المنتهية لأمس: ${searchDate}`)
        
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
            if (data.response && data.response.length > 0) {
              allMatches = data.response
              console.log(`تم العثور على ${data.response.length} مباراة منتهية أمس`)
            }
          }
        } catch (error) {
          console.error(`خطأ في جلب المباريات المنتهية:`, error)
        }
      } 
      else if (status === 'upcoming') {
        // جلب المباريات القادمة لغدا فقط
        const tomorrow = new Date(Date.now() + 86400000)
        const searchDate = tomorrow.toISOString().split('T')[0]
        
        const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=NS`
        console.log(`جلب المباريات القادمة لغدا: ${searchDate}`)
        
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
            if (data.response && data.response.length > 0) {
              allMatches = data.response
              console.log(`تم العثور على ${data.response.length} مباراة قادمة غدا`)
            }
          }
        } catch (error) {
          console.error(`خطأ في جلب المباريات القادمة:`, error)
        }
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات من API:', error)
    }

    console.log(`إجمالي المباريات المجلبة: ${allMatches.length}`)

    // إذا لم نحصل على مباريات حقيقية، نرجع قائمة فارغة
    if (allMatches.length === 0) {
      console.log('لا توجد مباريات حقيقية متاحة')
      return new Response(
        JSON.stringify({ 
          matches: [],
          totalAvailable: 0,
          fromApi: false,
          requestedStatus: status,
          success: true,
          message: `لا توجد مباريات ${
            status === 'live' ? 'مباشرة الآن' :
            status === 'upcoming' ? 'غدا' :
            'أمس'
          }`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // معالجة المباريات الحقيقية فقط
    const processedMatches = allMatches.map((fixture: any) => {
      const leagueName = fixture.league.name
      const arabicLeagueName = leagueTranslations[leagueName] || leagueName

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

    // ترتيب المباريات
    processedMatches.sort((a: any, b: any) => {
      if (status === 'upcoming') {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    console.log(`=== إرجاع ${processedMatches.length} مباراة حقيقية للحالة: ${status} ===`)

    return new Response(
      JSON.stringify({ 
        matches: processedMatches,
        totalAvailable: processedMatches.length,
        fromApi: true,
        requestedStatus: status,
        success: true,
        cached: false
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== خطأ في API المباريات ===', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'خطأ في الخادم',
        matches: [],
        success: false,
        message: 'حدث خطأ في جلب المباريات'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
