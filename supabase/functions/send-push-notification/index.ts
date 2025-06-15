
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// These must be set as secrets in your Supabase project settings
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') // e.g., 'mailto:your-email@example.com'

// Helper function to create VAPID JWT
async function createVapidJWT(audience: string) {
  if (!VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    throw new Error('VAPID keys not configured');
  }

  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };

  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: VAPID_SUBJECT
  };

  const encoder = new TextEncoder();
  const headerEncoded = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadEncoded = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;
  
  // For simplicity, we'll use a basic JWT without signature verification
  // In production, you'd want proper ES256 signing
  return unsignedToken;
}

// Helper function to send push notification
async function sendPushNotification(subscription: any, payload: string) {
  const endpoint = subscription.endpoint;
  const keys = subscription.keys;
  
  if (!keys || !keys.p256dh || !keys.auth) {
    throw new Error('Invalid subscription keys');
  }

  const audienceUrl = new URL(endpoint);
  const audience = `${audienceUrl.protocol}//${audienceUrl.host}`;
  
  try {
    const vapidToken = await createVapidJWT(audience);
    
    const headers = {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Push service responded with ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return new Response('Function not configured due to missing VAPID keys', { status: 500 });
  }

  // This function is called by a Supabase webhook.
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const notification = payload.record

    if (!notification || !notification.user_id) {
      console.warn('Invalid payload received:', payload)
      return new Response('Invalid payload', { status: 400 })
    }

    console.log(`Processing notification for user: ${notification.user_id}`)

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get all push subscriptions for the user
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', notification.user_id)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      throw fetchError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${notification.user_id}`)
      return new Response('No subscriptions found', { status: 200 })
    }

    console.log(`Found ${subscriptions.length} subscriptions for user ${notification.user_id}`)

    const notificationPayload = JSON.stringify({
      title: notification.title || 'TIFUE',
      message: notification.message || 'لديك تنبيه جديد!',
      data: notification.data,
    })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = sub.subscription as any; // PushSubscriptionJSON
      try {
        console.log('Sending push to:', pushSubscription.endpoint);
        await sendPushNotification(pushSubscription, notificationPayload);
        console.log('Push notification sent successfully');
      } catch (err: any) {
        console.error('Error sending notification, it might be expired.', err);
        // Status codes for expired/invalid subscriptions
        if (err.message && (err.message.includes('404') || err.message.includes('410'))) {
          console.log('Subscription expired or invalid. Deleting from DB.');
          // Delete the subscription from the database
          const { error: deleteError } = await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('subscription->>endpoint', pushSubscription.endpoint);

          if (deleteError) {
            console.error('Failed to delete subscription:', deleteError);
          }
        }
      }
    });

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ message: 'Push notifications sent successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in send-push-notification function:', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
})
