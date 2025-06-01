
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== Football match details API called ===')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // استخدام مفتاح API الجديد
    const apiKey = '821aee6f9e3f494ab98d299588b8ad53'
    
    console.log('Using API Key for match details:', apiKey.substring(0, 8) + '...')

    // قراءة معرف المباراة من الطلب
    let requestBody: any = {}
    try {
      if (req.method === 'POST') {
        requestBody = await req.json()
        console.log('Request body received:', requestBody)
      }
    } catch (e) {
      console.log('Error parsing body:', e)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          match: null
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const matchId = requestBody.matchId
    if (!matchId) {
      console.log('No match ID provided')
      return new Response(
        JSON.stringify({ 
          error: 'Match ID is required',
          match: null
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log(`Fetching details for match ID: ${matchId}`)

    try {
      // جلب تفاصيل المباراة
      const fixtureUrl = `https://v3.football.api-sports.io/fixtures?id=${matchId}`
      console.log('Fetching fixture details from:', fixtureUrl)
      
      const fixtureResponse = await fetch(fixtureUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      })
      
      console.log('Fixture API Response status:', fixtureResponse.status)
      
      if (!fixtureResponse.ok) {
        console.error('Fixture API error:', fixtureResponse.status, fixtureResponse.statusText)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch match details',
            match: null
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const fixtureData = await fixtureResponse.json()
      console.log('Fixture data received:', {
        results: fixtureData.response?.length || 0,
        errors: fixtureData.errors
      })

      if (!fixtureData.response || fixtureData.response.length === 0) {
        console.log('No fixture found for match ID:', matchId)
        return new Response(
          JSON.stringify({ 
            error: 'Match not found',
            match: null
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const fixture = fixtureData.response[0]
      console.log('Found fixture:', fixture.fixture.id)

      // جلب أحداث المباراة (أهداف وكروت)
      let events = []
      try {
        const eventsUrl = `https://v3.football.api-sports.io/fixtures/events?fixture=${matchId}`
        console.log('Fetching events from:', eventsUrl)
        
        const eventsResponse = await fetch(eventsUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        })
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          events = eventsData.response || []
          console.log('Events fetched:', events.length)
        } else {
          console.log('Events not available or error:', eventsResponse.status)
        }
      } catch (error) {
        console.log('Error fetching events:', error)
      }

      // جلب تشكيلة الفرق
      let lineups = []
      try {
        const lineupsUrl = `https://v3.football.api-sports.io/fixtures/lineups?fixture=${matchId}`
        console.log('Fetching lineups from:', lineupsUrl)
        
        const lineupsResponse = await fetch(lineupsUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        })
        
        if (lineupsResponse.ok) {
          const lineupsData = await lineupsResponse.json()
          lineups = lineupsData.response || []
          console.log('Lineups fetched:', lineups.length)
        } else {
          console.log('Lineups not available or error:', lineupsResponse.status)
        }
      } catch (error) {
        console.log('Error fetching lineups:', error)
      }

      // جلب إحصائيات المباراة
      let statistics = []
      try {
        const statsUrl = `https://v3.football.api-sports.io/fixtures/statistics?fixture=${matchId}`
        console.log('Fetching statistics from:', statsUrl)
        
        const statsResponse = await fetch(statsUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          }
        })
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          statistics = statsData.response || []
          console.log('Statistics fetched:', statistics.length)
        } else {
          console.log('Statistics not available or error:', statsResponse.status)
        }
      } catch (error) {
        console.log('Error fetching statistics:', error)
      }

      // فصل الأهداف والكروت من الأحداث
      const goals = events.filter((event: any) => 
        event.type === 'Goal' && 
        (event.detail === 'Normal Goal' || event.detail === 'Penalty' || event.detail === 'Own Goal')
      )
      
      const cards = events.filter((event: any) => 
        event.type === 'Card' && 
        (event.detail === 'Yellow Card' || event.detail === 'Red Card')
      )

      // تحديد حالة المباراة
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

      const matchDetails = {
        id: fixture.fixture.id.toString(),
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        status: matchStatus,
        date: fixture.fixture.date,
        competition: fixture.league.name,
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        leagueFlag: fixture.league.flag,
        minute: fixture.fixture.status.elapsed,
        goals: goals,
        cards: cards,
        lineups: lineups,
        statistics: statistics
      }

      console.log(`=== Returning match details for ID: ${matchId} ===`)
      console.log('Match details summary:', {
        teams: `${matchDetails.homeTeam} vs ${matchDetails.awayTeam}`,
        score: `${matchDetails.homeScore || 0}-${matchDetails.awayScore || 0}`,
        goals: goals.length,
        cards: cards.length,
        lineups: lineups.length,
        status: matchDetails.status
      })

      return new Response(
        JSON.stringify({ 
          match: matchDetails,
          success: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (error) {
      console.error('Error in match details API:', error)
      return new Response(
        JSON.stringify({ 
          error: 'API request failed',
          match: null
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('=== Error in football match details API ===', error)
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        match: null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
