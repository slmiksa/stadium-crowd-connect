
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// قائمة محسنة للبطولات المهمة فقط
const isImportantCompetition = (leagueName: string): boolean => {
  const nameLower = leagueName.toLowerCase();
  
  // كأس العالم للأندية - أولوية عليا
  const clubWorldCupNames = [
    'fifa club world cup', 'club world cup', 'cwc'
  ];
  
  // كأس العالم وتصفياته
  const worldCupNames = [
    'fifa world cup', 'world cup', 'wc', 
    'world cup qualification', 'fifa world cup qualification', 'world cup qualifiers'
  ];
  
  // البطولات السعودية
  const saudiCompetitions = [
    'saudi pro league', 'saudi professional league', 'roshn saudi league',
    'king cup', 'saudi super cup'
  ];
  
  // الدوريات الأوروبية الكبرى
  const europeanLeagues = [
    'premier league', 'english premier league', 'epl',
    'la liga', 'laliga', 'spanish la liga',
    'bundesliga', 'german bundesliga',
    'serie a', 'italian serie a',
    'ligue 1', 'french ligue 1'
  ];
  
  // الكؤوس الأوروبية
  const europeanCups = [
    'fa cup', 'copa del rey', 'dfb pokal', 'dfb-pokal', 
    'coppa italia', 'coupe de france'
  ];
  
  // البطولات القارية المهمة
  const continentalCompetitions = [
    'champions league', 'uefa champions league',
    'europa league', 'uefa europa league',
    'conference league', 'uefa conference league',
    'afc champions league', 'afc champions league elite', 'asian champions league',
    'uefa nations league', 'european championship', 'uefa european championship',
    'euro 2024', 'uefa euro', 'euro ',
    'asian cup', 'afc asian cup',
    'copa america', 'conmebol copa america'
  ];

  // فحص البطولات المهمة
  const allImportantCompetitions = [
    ...clubWorldCupNames,
    ...worldCupNames,
    ...saudiCompetitions,
    ...europeanLeagues,
    ...europeanCups,
    ...continentalCompetitions
  ];

  return allImportantCompetitions.some(comp => nameLower.includes(comp));
};

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
            console.log('المباريات المباشرة الخام:', allMatches.length)
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

    // تصفية البطولات المهمة فقط
    const filteredMatches = allMatches.filter((fixture: any) => {
      const leagueName = fixture.league.name
      const isImportant = isImportantCompetition(leagueName)
      if (!isImportant) {
        console.log(`تم تجاهل البطولة غير المهمة: ${leagueName}`)
      }
      return isImportant
    })

    console.log(`المباريات بعد التصفية: ${filteredMatches.length}`)

    // إذا لم نحصل على مباريات مهمة، نرجع قائمة فارغة
    if (filteredMatches.length === 0) {
      console.log('لا توجد مباريات مهمة متاحة بعد التصفية')
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
          } في البطولات المهمة`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // معالجة المباريات المهمة فقط
    const processedMatches = filteredMatches.map((fixture: any) => {
      const leagueName = fixture.league.name

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
        competition: leagueName, // استخدام اسم البطولة كما هو من API
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

    console.log(`=== إرجاع ${processedMatches.length} مباراة مهمة للحالة: ${status} ===`)

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
