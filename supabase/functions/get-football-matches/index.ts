
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

// معرفات الدوريات المهمة
const targetLeagues = [
  // السعودية والعربية
  307, // Saudi Pro League
  556, // King Cup Saudi Arabia
  308, // Saudi Super Cup
  233, // Egyptian Premier League
  301, // UAE Pro League
  274, // Qatar Stars League
  
  // أوروبية
  2,   // Champions League
  39,  // Premier League
  140, // La Liga
  78,  // Bundesliga
  135, // Serie A
  61,  // Ligue 1
  
  // آسيوية
  480, // AFC Champions League
  
  // عالمية
  1,   // World Cup
  15   // FIFA Club World Cup
]

serve(async (req) => {
  console.log('=== Football matches API called ===')
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = '5879d532d5877f431c3cadfd42d19ccf'
    console.log('Using API Key:', apiKey.substring(0, 8) + '...')

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
      console.log('Error parsing body, using defaults:', e)
    }
    
    const status = requestBody.status || statusFromUrl || 'live'
    const date = requestBody.date || dateFromUrl || new Date().toISOString().split('T')[0]
    
    console.log(`Processing request - Status: ${status}, Date: ${date}`)

    let allMatches: any[] = []

    try {
      if (status === 'live') {
        const apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all'
        console.log('Fetching live matches from:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Live matches API response:', {
            results: data.response?.length || 0,
            errors: data.errors
          })
          
          if (!data.errors || Object.keys(data.errors).length === 0) {
            allMatches = data.response || []
          }
        }
      } 
      else if (status === 'finished') {
        // تحسين جلب المباريات المنتهية - جلب من عدة أيام
        console.log('Fetching finished matches from multiple dates...')
        const dates = []
        for (let i = 0; i <= 5; i++) {
          const pastDate = new Date(Date.now() - (i * 86400000))
          dates.push(pastDate.toISOString().split('T')[0])
        }
        
        for (const searchDate of dates) {
          try {
            // جلب من دوريات مختلفة
            const leagueIds = [39, 140, 135, 61, 78, 2, 307, 480] // الدوريات الرئيسية
            
            for (const leagueId of leagueIds) {
              const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&league=${leagueId}&status=FT`
              
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
                  allMatches = [...allMatches, ...data.response]
                  console.log(`Found ${data.response.length} finished matches for league ${leagueId} on ${searchDate}`)
                }
              }
              
              // تأخير قصير لتجنب تجاوز حدود API
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          } catch (error) {
            console.error(`Error for ${searchDate}:`, error)
          }
        }
      } 
      else if (status === 'upcoming') {
        // تحسين جلب المباريات القادمة - جلب من الأيام القادمة
        console.log('Fetching upcoming matches from multiple dates...')
        const dates = []
        for (let i = 0; i <= 7; i++) {
          const futureDate = new Date(Date.now() + (i * 86400000))
          dates.push(futureDate.toISOString().split('T')[0])
        }
        
        for (const searchDate of dates) {
          try {
            // جلب من دوريات مختلفة
            const leagueIds = [39, 140, 135, 61, 78, 2, 307, 480] // الدوريات الرئيسية
            
            for (const leagueId of leagueIds) {
              const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${searchDate}&league=${leagueId}&status=NS`
              
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
                  allMatches = [...allMatches, ...data.response]
                  console.log(`Found ${data.response.length} upcoming matches for league ${leagueId} on ${searchDate}`)
                }
              }
              
              // تأخير قصير لتجنب تجاوز حدود API
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          } catch (error) {
            console.error(`Error for ${searchDate}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error)
    }

    console.log(`Total fetched matches: ${allMatches.length}`)

    // بيانات احتياطية حديثة ومتنوعة
    if (allMatches.length === 0) {
      console.log('Using enhanced fallback data')
      const fallbackMatches = [
        {
          id: 'fallback-live-1',
          homeTeam: 'الهلال',
          awayTeam: 'النصر',
          homeScore: 2,
          awayScore: 1,
          status: 'live',
          date: new Date().toISOString(),
          competition: 'دوري روشن السعودي',
          homeLogo: '/placeholder.svg',
          awayLogo: '/placeholder.svg',
          leagueFlag: '/placeholder.svg',
          minute: 78
        },
        {
          id: 'fallback-upcoming-1',
          homeTeam: 'ريال مدريد',
          awayTeam: 'برشلونة',
          homeScore: null,
          awayScore: null,
          status: 'upcoming',
          date: new Date(Date.now() + 86400000).toISOString(),
          competition: 'الليغا الإسبانية',
          homeLogo: '/placeholder.svg',
          awayLogo: '/placeholder.svg',
          leagueFlag: '/placeholder.svg',
          minute: null
        },
        {
          id: 'fallback-finished-1',
          homeTeam: 'إنتر ميلان',
          awayTeam: 'يوفنتوس',
          homeScore: 3,
          awayScore: 1,
          status: 'finished',
          date: new Date(Date.now() - 86400000).toISOString(),
          competition: 'الدوري الإيطالي',
          homeLogo: '/placeholder.svg',
          awayLogo: '/placeholder.svg',
          leagueFlag: '/placeholder.svg',
          minute: 90
        },
        {
          id: 'fallback-finished-2',
          homeTeam: 'ليفربول',
          awayTeam: 'مانشستر سيتي',
          homeScore: 2,
          awayScore: 0,
          status: 'finished',
          date: new Date(Date.now() - 172800000).toISOString(),
          competition: 'الدوري الإنجليزي الممتاز',
          homeLogo: '/placeholder.svg',
          awayLogo: '/placeholder.svg',
          leagueFlag: '/placeholder.svg',
          minute: 90
        }
      ]
      allMatches = fallbackMatches.filter(m => m.status === status)
    }

    // معالجة المباريات
    let processedMatches = []
    
    if (allMatches.length > 0 && allMatches[0].fixture) {
      // بيانات من API Football
      processedMatches = allMatches.map((fixture: any) => {
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
    } else {
      processedMatches = allMatches
    }

    // ترتيب المباريات حسب الأهمية والتاريخ
    processedMatches.sort((a: any, b: any) => {
      if (status === 'upcoming') {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    // أخذ أفضل 30 مباراة
    processedMatches = processedMatches.slice(0, 30)

    console.log(`=== Returning ${processedMatches.length} processed matches for status: ${status} ===`)

    return new Response(
      JSON.stringify({ 
        matches: processedMatches,
        totalAvailable: allMatches.length || 0,
        fromApi: allMatches.length > 0 && allMatches[0].fixture ? true : false,
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
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
