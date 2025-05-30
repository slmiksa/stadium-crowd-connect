
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Save API key function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apiKey } = await req.json()
    
    if (!apiKey || typeof apiKey !== 'string') {
      return new Response(
        JSON.stringify({ error: 'مفتاح API مطلوب' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // حفظ مفتاح API في متغير البيئة (سيتم تحديثه يدوياً في Supabase)
    console.log('API Key to save:', apiKey.substring(0, 8) + '...')
    
    // إرجاع رسالة نجاح
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم استلام مفتاح API. يرجى تحديث FOOTBALL_API_KEY في إعدادات Supabase Secrets' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in save API key function:', error)
    return new Response(
      JSON.stringify({ error: 'خطأ في الخادم' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
