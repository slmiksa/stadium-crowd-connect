
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ترجمات محسنة ومصححة للدوريات مع إضافة البطولات الحالية
const leagueTranslations: { [key: string]: string } = {
  // الدوريات السعودية
  'Saudi Pro League': 'دوري روشن السعودي',
  'Saudi Professional League': 'دوري روشن السعودي',
  'King Cup': 'كأس الملك',
  'Saudi Super Cup': 'كأس السوبر السعودي',
  'Arab Club Champions Cup': 'كأس العرب للأندية الأبطال',
  
  // الدوريات العربية الأخرى
  'Egyptian Premier League': 'الدوري المصري',
  'Egypt Premier League': 'الدوري المصري',
  'Moroccan Botola Pro': 'الدوري المغربي',
  'Moroccan Premier League': 'الدوري المغربي',
  'Tunisian Ligue Professionnelle 1': 'الدوري التونسي',
  'Jordanian Pro League': 'الدوري الأردني',
  'Lebanese Premier League': 'الدوري اللبناني',
  'Kuwaiti Premier League': 'الدوري الكويتي',
  'Qatar Stars League': 'الدوري القطري',
  'UAE Pro League': 'الدوري الإماراتي',
  'Bahraini Premier League': 'الدوري البحريني',
  'Omani Professional League': 'الدوري العماني',
  'Iraqi Premier League': 'الدوري العراقي',
  'Syrian Premier League': 'الدوري السوري',
  'Lebanese Cup': 'كأس لبنان',
  'Jordan Cup': 'كأس الأردن',
  'Kuwait Cup': 'كأس الكويت',
  'UAE Cup': 'كأس الإمارات',
  
  // الدوريات الآسيوية
  'AFC Champions League': 'دوري أبطال آسيا',
  'AFC Champions League Elite': 'دوري أبطال آسيا النخبة',
  'Asian Champions League': 'دوري أبطال آسيا',
  'AFC Cup': 'كأس الاتحاد الآسيوي',
  'Asian Cup': 'كأس آسيا',
  'AFC Asian Cup': 'كأس آسيا',
  
  // البطولات العالمية وتصفياتها
  'World Cup': 'كأس العالم',
  'FIFA World Cup': 'كأس العالم فيفا',
  'FIFA Club World Cup': 'كأس العالم للأندية',
  'World Cup Qualification': 'تصفيات كأس العالم',
  'FIFA World Cup Qualification': 'تصفيات كأس العالم',
  'World Cup Qualifiers': 'تصفيات كأس العالم',
  'WC Qualification': 'تصفيات كأس العالم',
  'World Cup Qualification - Asia': 'تصفيات كأس العالم آسيا',
  'World Cup Qualification - Europe': 'تصفيات كأس العالم أوروبا',
  'World Cup Qualification - Africa': 'تصفيات كأس العالم أفريقيا',
  'World Cup Qualification - South America': 'تصفيات كأس العالم أمريكا الجنوبية',
  'World Cup Qualification - North America': 'تصفيات كأس العالم أمريكا الشمالية',
  'World Cup Qualification - Oceania': 'تصفيات كأس العالم أوقيانوسيا',
  'World Cup Qualification Intercontinental Play-offs': 'ملحق تصفيات كأس العالم',
  'FIFA World Cup qualification': 'تصفيات كأس العالم',
  
  // الدوريات الأوروبية
  'Champions League': 'دوري أبطال أوروبا',
  'UEFA Champions League': 'دوري أبطال أوروبا',
  'Europa League': 'الدوري الأوروبي',
  'UEFA Europa League': 'الدوري الأوروبي',
  'Conference League': 'دوري المؤتمر الأوروبي',
  'UEFA Conference League': 'دوري المؤتمر الأوروبي',
  'UEFA Nations League': 'دوري الأمم الأوروبية',
  'European Championship': 'بطولة أوروبا',
  'UEFA European Championship': 'بطولة أوروبا',
  'Euro 2024': 'يورو 2024',
  'UEFA Euro': 'بطولة أوروبا',
  
  // الدوري الإنجليزي
  'Premier League': 'الدوري الإنجليزي الممتاز',
  'English Premier League': 'الدوري الإنجليزي الممتاز',
  'EPL': 'الدوري الإنجليزي الممتاز',
  'Championship': 'الدرجة الأولى الإنجليزية',
  'FA Cup': 'كأس الاتحاد الإنجليزي',
  'EFL Cup': 'كأس الرابطة الإنجليزية',
  'League Cup': 'كأس الرابطة',
  'Carabao Cup': 'كأس كارابو',
  
  // الدوري الإسباني
  'La Liga': 'الليغا الإسبانية',
  'LaLiga': 'الليغا الإسبانية',
  'Spanish La Liga': 'الليغا الإسبانية',
  'Copa del Rey': 'كأس الملك الإسباني',
  'Supercopa de España': 'كأس السوبر الإسباني',
  
  // الدوري الألماني
  'Bundesliga': 'الدوري الألماني',
  'German Bundesliga': 'الدوري الألماني',
  '2. Bundesliga': 'الدرجة الثانية الألمانية',
  'DFB Pokal': 'كأس ألمانيا',
  'DFB-Pokal': 'كأس ألمانيا',
  
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
  
  // دوريات أوروبية أخرى
  'Eredivisie': 'الدوري الهولندي',
  'Belgian Pro League': 'الدوري البلجيكي',
  'Primeira Liga': 'الدوري البرتغالي',
  'Russian Premier League': 'الدوري الروسي',
  'Turkish Super League': 'الدوري التركي',
  'Süper Lig': 'الدوري التركي',
  'Scottish Premiership': 'الدوري الاسكتلندي',
  'Swiss Super League': 'الدوري السويسري',
  'Austrian Bundesliga': 'الدوري النمساوي',
  'Czech First League': 'الدوري التشيكي',
  'Polish Ekstraklasa': 'الدوري البولندي',
  
  // الدوريات الأمريكية والقارية
  'CONCACAF Champions League': 'دوري أبطال الكونكاكاف',
  'Copa Libertadores': 'كوبا ليبرتادوريس',
  'Major League Soccer': 'الدوري الأمريكي',
  'MLS': 'الدوري الأمريكي',
  'Brazilian Serie A': 'الدوري البرازيلي',
  'Argentine Liga Profesional': 'الدوري الأرجنتيني',
  'Copa America': 'كوبا أمريكا',
  'CONMEBOL Copa America': 'كوبا أمريكا',
  'CAF Champions League': 'دوري أبطال أفريقيا',
  'Africa Cup of Nations': 'كأس الأمم الأفريقية',
  'AFCON': 'كأس الأمم الأفريقية',
  'CAF Confederation Cup': 'كأس الاتحاد الأفريقي',
  
  // بطولات دولية أخرى
  'Friendlies': 'مباريات ودية',
  'International Friendlies': 'مباريات ودية دولية',
  'Friendly': 'مباراة ودية',
  'Club Friendlies': 'مباريات ودية للأندية',
  'FIFA Confederations Cup': 'كأس القارات',
  'Olympics': 'الألعاب الأولمبية',
  'Olympic Games': 'الألعاب الأولمبية'
}

// قائمة البطولات التي يجب تجاهلها (تقليل البطولات المرفوضة)
const ignoredLeagues = [
  'Ghana Premier League',
  'Nigerian Professional Football League',
  'South African Premier Soccer League',
  'Ghanaian Premier League',
  'Congo League'
]

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
  
  // المنتخبات العربية
  'Saudi Arabia': 'السعودية',
  'Egypt': 'مصر',
  'Morocco': 'المغرب',
  'Tunisia': 'تونس',
  'Algeria': 'الجزائر',
  'Jordan': 'الأردن',
  'Lebanon': 'لبنان',
  'Kuwait': 'الكويت',
  'Qatar': 'قطر',
  'UAE': 'الإمارات',
  'United Arab Emirates': 'الإمارات',
  'Bahrain': 'البحرين',
  'Oman': 'عمان',
  'Iraq': 'العراق',
  'Syria': 'سوريا',
  'Palestine': 'فلسطين',
  'Yemen': 'اليمن',
  'Libya': 'ليبيا',
  'Sudan': 'السودان',
  
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
  
  // الفرق الألمانية
  'Bayern Munich': 'بايرن ميونيخ',
  'FC Bayern München': 'بايرن ميونيخ',
  'Borussia Dortmund': 'بوروسيا دورتمند',
  'RB Leipzig': 'آر بي لايبزيغ',
  'Bayer Leverkusen': 'باير ليفركوزن',
  'Eintracht Frankfurt': 'آينتراخت فرانكفورت',
  
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
  
  // الفرق الفرنسية
  'Paris Saint-Germain': 'باريس سان جيرمان',
  'PSG': 'باريس سان جيرمان',
  'Marseille': 'مارسيليا',
  'Olympique Marseille': 'مارسيليا',
  'Lyon': 'ليون',
  'Olympique Lyon': 'ليون',
  'Monaco': 'موناكو',
  'AS Monaco': 'موناكو',
  
  // المنتخبات الأوروبية
  'Germany': 'ألمانيا',
  'France': 'فرنسا',
  'Spain': 'إسبانيا',
  'Italy': 'إيطاليا',
  'England': 'إنجلترا',
  'Netherlands': 'هولندا',
  'Portugal': 'البرتغال',
  'Belgium': 'بلجيكا',
  'Croatia': 'كرواتيا',
  'Denmark': 'الدنمارك',
  'Switzerland': 'سويسرا',
  'Austria': 'النمسا',
  'Poland': 'بولندا',
  'Czech Republic': 'التشيك',
  'Ukraine': 'أوكرانيا',
  'Serbia': 'صربيا',
  'Turkey': 'تركيا',
  'Russia': 'روسيا',
  'Norway': 'النرويج',
  'Sweden': 'السويد',
  'Finland': 'فنلندا',
  
  // المنتخبات الأمريكية والآسيوية
  'Brazil': 'البرازيل',
  'Argentina': 'الأرجنتين',
  'Uruguay': 'الأوروغواي',
  'Colombia': 'كولومبيا',
  'Chile': 'تشيلي',
  'Peru': 'بيرو',
  'Ecuador': 'الإكوادور',
  'Mexico': 'المكسيك',
  'USA': 'الولايات المتحدة',
  'United States': 'الولايات المتحدة',
  'Canada': 'كندا',
  'Japan': 'اليابان',
  'South Korea': 'كوريا الجنوبية',
  'Australia': 'أستراليا',
  'Iran': 'إيران',
  'China': 'الصين',
  'Thailand': 'تايلاند',
  'India': 'الهند',
  'Indonesia': 'إندونيسيا'
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
        // تحديد التاريخ بناءً على الطلب
        let searchDate: string
        if (date === new Date().toISOString().split('T')[0]) {
          // مباريات اليوم
          searchDate = date
          console.log(`جلب مباريات اليوم: ${searchDate}`)
        } else {
          // مباريات الغد
          const tomorrow = new Date(Date.now() + 86400000)
          searchDate = tomorrow.toISOString().split('T')[0]
          console.log(`جلب المباريات القادمة لغدا: ${searchDate}`)
        }
        
        const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&status=NS`
        
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
              console.log(`تم العثور على ${data.response.length} مباراة في ${searchDate}`)
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

    // تصفية البطولات المرفوضة (تقليل القائمة لعدم إزالة الكثير)
    const filteredMatches = allMatches.filter((fixture: any) => {
      const leagueName = fixture.league.name
      return !ignoredLeagues.includes(leagueName)
    })

    console.log(`المباريات بعد التصفية: ${filteredMatches.length}`)

    // إذا لم نحصل على مباريات حقيقية، نرجع قائمة فارغة
    if (filteredMatches.length === 0) {
      console.log('لا توجد مباريات حقيقية متاحة بعد التصفية')
      return new Response(
        JSON.stringify({ 
          matches: [],
          totalAvailable: 0,
          fromApi: false,
          requestedStatus: status,
          success: true,
          message: `لا توجد مباريات ${
            status === 'live' ? 'مباشرة الآن' :
            status === 'upcoming' ? (date === new Date().toISOString().split('T')[0] ? 'اليوم' : 'غدا') :
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
    const processedMatches = filteredMatches.map((fixture: any) => {
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
