
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// This is a public key, so it's safe to be here.
// You should generate your own VAPID keys for your application.
const VAPID_PUBLIC_KEY = 'BGeVwL2rM9-uA6J1PUN3E_ph97dMpsKsojTjXg8adZOJ_3C8lF7iXo4vHlA7K3g2g7s2g4a0e3c9m1v6k8q9f0e';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isInitialized || !user) {
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported by this browser.');
      return;
    }

    const registerAndSubscribe = async () => {
      try {
        const swRegistration = await navigator.serviceWorker.ready;
        let subscription = await swRegistration.pushManager.getSubscription();

        if (subscription === null) {
          console.log('User not subscribed, requesting permission...');
          const permission = await Notification.requestPermission();

          if (permission !== 'granted') {
            console.log('Permission not granted for Notification');
            toast({
              title: "لم يتم تفعيل الإشعارات",
              description: "لقد منعت استقبال الإشعارات. يمكنك تغيير ذلك من إعدادات المتصفح.",
              variant: "destructive"
            });
            return;
          }

          console.log('Permission granted, subscribing user...');
          const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });

          console.log('User subscribed:', subscription);
          
          await saveSubscription(subscription);
          toast({
            title: "تم تفعيل الإشعارات بنجاح",
            description: "ستتلقى الآن إشعارات بالتحديثات المهمة.",
          });
        } else {
          console.log('User is already subscribed.');
          await saveSubscription(subscription); // Ensure subscription is in DB
        }
      } catch (error) {
        console.error('Failed to subscribe to push notifications', error);
        toast({
            title: "خطأ في تفعيل الإشعارات",
            description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
        });
      }
    };
    
    registerAndSubscribe();

  }, [user, isInitialized, toast]);

  const saveSubscription = async (subscription: PushSubscription) => {
    if (!user) return;

    const endpoint = subscription.endpoint;
    
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('subscription->>endpoint', endpoint)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking for existing subscription:', fetchError);
      return;
    }

    if (existingSubscription) {
      console.log('User is already subscribed with this device.');
      return;
    }
    
    console.log('Saving new subscription to DB...');
    const { error: insertError } = await supabase.from('push_subscriptions').insert({
      user_id: user.id,
      subscription: subscription.toJSON(),
    });

    if (insertError) {
      console.error('Error saving subscription to DB:', insertError);
      toast({
        title: "خطأ",
        description: "لم نتمكن من حفظ إعدادات الإشعارات.",
        variant: "destructive"
      });
    } else {
      console.log('Subscription saved successfully.');
    }
  };
};
