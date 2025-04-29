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

  // Special Function to fire another notif without using listeners
  async scheduleNotificationWithFollowUp(notification: LocalNotificationSchema, followUpNotification: LocalNotificationSchema) {
    this.defaultTimeZone = getDefaultTimezone();
  
    // Schedule the initial notification
    await LocalNotifications.schedule({
      notifications: [notification],
    });
    console.log('Initial notification scheduled:', notification);
  
    // Schedule the follow-up notification
    await LocalNotifications.schedule({
      notifications: [followUpNotification],
    });
    console.log('Follow-up notification scheduled:', followUpNotification);
  }

  // Read all pending notifications
  async getPendingNotifications(): Promise<ScheduleResult> {
    const pending = await LocalNotifications.getPending();
    console.log('Pending notifications:', pending);
    return pending;
  }

  // // Listen for incoming notifications
  // async listenForNotificationEvents() {
  //   LocalNotifications.addListener('localNotificationReceived', async (notification) => {
  //     console.log('Notification received:', notification);
  
  //     // Check if the Pomodoro cycle is active
  //     if (this.pomodoroActive) {
  //       console.log('Pomodoro active, scheduling break notification...');
  
  //       // Schedule the break notification (5 minutes)
  //       const nextNotification: LocalNotificationSchema = {
  //         title: 'Break Finished',
  //         body: 'Start another Pomodoro or Finish up!',
  //         id: new Date().getTime(), // Unique ID
  //         schedule: { at: new Date(new Date().getTime() + 5 * 60 * 1000) }, // 5 minutes later
  //         // vibration: true
  //       };
  //       await this.scheduleNotification(nextNotification);
  
  //       // Update the displayCountdown for the break timer
  //       const homePage = document.querySelector('app-home') as any;
  //       if (homePage) {
  //         homePage.scheduledNotifTime = new Date(new Date().getTime() + 5 * 60 * 1000);
  //         homePage.startCountdown();
  //       }
  
  //       console.log('Break notification scheduled.');
  //       this.pomodoroActive = false; // Reset Pomodoro cycle
  //       this.breakActive = true; // Set breakActive to true
  //     } else if (this.breakActive) {
  //       console.log('Break active, no further notifications will be scheduled.');
  //       this.breakActive = false; // Reset breakActive after the break notification fires
  //     } else {
  //       console.log('No active Pomodoro or break, no notifications scheduled.');
  //     }
  //   });
  // }

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