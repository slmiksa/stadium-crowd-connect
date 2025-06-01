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
  'FIFA Club World Cup': 'كأس العالم للأندية',
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
  'French Ligue 1': 'الدوري الفرنسي'
}

// ترجمات محسنة للفرق
const teamTranslations: { [key: string]: string } = {
  // الفرق السعودية
  'Al Hilal': 'الهلال',
  'Al-Hilal': 'الهلال', 
  'Al Nassr': 'النصر',
  'Al-Nassr': 'النصر',
  'Al Ahli': 'الأهلي',
  'Al-Ahli': 'الأهلي',
  'Al Ittihad': 'الاتحاد',
  'Al-Ittihad': 'الاتحاد',
  'Al Shabab': 'الشباب',
  'Al-Shabab': 'الشباب',
  'Al Ettifaq': 'الاتفاق',
  'Al-Ettifaq': 'الاتفاق',
  'Al Taawoun': 'التعاون',
  'Al-Taawoun': 'التعاون',
  'Al Fayha': 'الفيحاء',
  'Al-Fayha': 'الفيحاء',
  'Damac': 'ضمك',
  'Al Fateh': 'الفتح',
  'Al-Fateh': 'الفتح',
  'Al Raed': 'الرائد',
  'Al-Raed': 'الرائد',
  
  // الفرق العالمية
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
  'PSG': 'باريس سان جيرمان',
  'Juventus': 'يوفنتوس',
  'AC Milan': 'إيه سي ميلان',
  'Inter Milan': 'إنتر ميلان',
  'Inter': 'إنتر ميلان',
  'Atletico Madrid': 'أتلتيكو مدريد',
  'Sevilla': 'إشبيلية',
  'Valencia': 'فالنسيا'
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
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          console.log('استجابة API المباريات المباشرة:', {
            results: data.response?.length || 0,
            errors: data.errors
          })
          
          if (!data.errors || Object.keys(data.errors).length === 0) {
            allMatches = data.response || []
          }
        }
      } 
      else if (status === 'finished') {
        console.log('جلب المباريات المنتهية...')
        const dates = []
        for (let i = 0; i <= 7; i++) {
          const pastDate = new Date(Date.now() - (i * 86400000))
          dates.push(pastDate.toISOString().split('T')[0])
        }
        
        const priorityLeagues = [39, 140, 135, 78, 61, 2, 3, 307] // Premier, La Liga, Serie A, Bundesliga, Ligue 1, Champions, Europa, Saudi
        
        for (const searchDate of dates) {
          for (const leagueId of priorityLeagues) {
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000)
              
              const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&league=${leagueId}&status=FT`
              
              const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'X-RapidAPI-Key': apiKey,
                  'X-RapidAPI-Host': 'v3.football.api-sports.io'
                },
                signal: controller.signal
              })
              
              clearTimeout(timeoutId)
              
              if (response.ok) {
                const data = await response.json()
                if (data.response && data.response.length > 0) {
                  allMatches = [...allMatches, ...data.response]
                  console.log(`تم العثور على ${data.response.length} مباراة منتهية للدوري ${leagueId} في ${searchDate}`)
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 100))
              
              if (allMatches.length >= 30) break
              
            } catch (error) {
              console.error(`خطأ في ${searchDate} للدوري ${leagueId}:`, error)
            }
          }
          if (allMatches.length >= 30) break
        }
      } 
      else if (status === 'upcoming') {
        console.log('جلب المباريات القادمة...')
        const dates = []
        for (let i = 0; i <= 10; i++) {
          const futureDate = new Date(Date.now() + (i * 86400000))
          dates.push(futureDate.toISOString().split('T')[0])
        }
        
        const priorityLeagues = [39, 140, 135, 78, 61, 2, 3, 307]
        
        for (const searchDate of dates) {
          for (const leagueId of priorityLeagues) {
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000)
              
              const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&league=${leagueId}&status=NS`
              
              const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'X-RapidAPI-Key': apiKey,
                  'X-RapidAPI-Host': 'v3.football.api-sports.io'
                },
                signal: controller.signal
              })
              
              clearTimeout(timeoutId)
              
              if (response.ok) {
                const data = await response.json()
                if (data.response && data.response.length > 0) {
                  allMatches = [...allMatches, ...data.response]
                  console.log(`تم العثور على ${data.response.length} مباراة قادمة للدوري ${leagueId} في ${searchDate}`)
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 100))
              
              if (allMatches.length >= 40) break
              
            } catch (error) {
              console.error(`خطأ في ${searchDate} للدوري ${leagueId}:`, error)
            }
          }
          if (allMatches.length >= 40) break
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
          message: 'لا توجد مباريات متاحة في الوقت الحالي'
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
        totalAvailable: allMatches.length || 0,
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
