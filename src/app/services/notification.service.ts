import { Injectable } from '@angular/core';
import { LocalNotifications, PermissionStatus, LocalNotificationSchema, ScheduleResult } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular';
import { getDefaultTimezone } from 'src/utils/timezone-util';
import { Toast } from '@capacitor/toast';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private toastController: ToastController) {}

  defaultTimeZone: string = '';


  // Check notification permissions
  async checkNotificationPermissions(): Promise<PermissionStatus> {
    const permissions = await LocalNotifications.checkPermissions();
    console.log('Current permissions:', permissions);
    return permissions;
  }

  // Request notification permissions
  async requestNotificationPermissions(): Promise<PermissionStatus> {
    const permissions = await LocalNotifications.requestPermissions();
    console.log('Updated permissions:', permissions);
    return permissions;
  }

  // Create a notification
  async scheduleNotification(notification: LocalNotificationSchema) {
    this.defaultTimeZone = getDefaultTimezone();

    await LocalNotifications.schedule({
      notifications: [notification],
    });
    console.log('Notification scheduled:', notification);
  }

  // Read all pending notifications
  async getPendingNotifications(): Promise<ScheduleResult> {
    const pending = await LocalNotifications.getPending();
    console.log('Pending notifications:', pending);
    return pending;
  }

  // Listen for incoming notifications
  async listenForNotificationEvents() {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
      // Schedule the next notif
      const nextNotification = {
        title: 'Break Finished',
        body: 'Start another Pomodoro or Finish up!',
        id: notification.id + 1, // Increment the ID
        schedule: { at: new Date(new Date().getTime() + 60 * 1000) }, // 1 minute later
      };
      this.scheduleNotification(nextNotification);
    });
  }

  async presentToast(message: string, duration: 'short' | 'long' = 'short', position: 'top' | 'center' | 'bottom' = 'bottom') {
    await Toast.show({
      text: message,
      duration: duration,
      position: position,
    });
  }

  // async displayInAppNotification(notification: any) {
  //   const toast = await this.toastController.create({
  //     header: notification.title,
  //     message: notification.body,
  //     position: 'top',
  //     duration: 5000,
  //     color: 'dark',
  //   });
  //   await toast.present();
  // }

  // Clears notifs (for debug only)
  async clearAllNotifications() {
    await LocalNotifications.cancel({ notifications: [] });
  }
}