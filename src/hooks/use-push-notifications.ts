import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const registerPush = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Permissão de notificações não concedida');
        return;
      }

      await PushNotifications.register();

      // Listener para o token de registro (enviar para o Supabase/Backend se necessário)
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration token:', token.value);
        // Aqui você enviaria o token para o seu banco de dados no Supabase para enviar notificações para este usuário
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        toast.info(notification.title || 'Nova notificação', {
          description: notification.body
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
      });
    };

    registerPush();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
};
