
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WebPush } from 'https://deno.land/x/web_push@1.0.1/mod.ts'

// These must be set as secrets in your Supabase project settings
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') // e.g., 'mailto:your-email@example.com'

let webPush: WebPush | null = null;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webPush = new WebPush({
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  }, VAPID_SUBJECT);
} else {
  console.error('VAPID keys and subject must be set as environment variables.')
}

Deno.serve(async (req) => {
  if (!webPush) {
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
      title: notification.title,
      message: notification.message,
      data: notification.data,
    })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = sub.subscription as any; // PushSubscriptionJSON
      try {
        console.log('Sending push to:', pushSubscription.endpoint);
        await webPush!.send(pushSubscription, notificationPayload);
      } catch (err) {
        console.error('Error sending notification, it might be expired.', err);
        // Status codes for expired/invalid subscriptions
        if (err.name === 'WebPushError' && [404, 410].includes(err.statusCode)) {
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
  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
})
