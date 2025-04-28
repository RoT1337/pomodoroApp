import { Component, OnInit } from '@angular/core';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { NotificationService } from '../services/notification.service';
import { getDefaultTimezone, formatDateInTimezone } from 'src/utils/timezone-util';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit{
  currentTime: string = '';

  constructor(private notificationServ: NotificationService, private alertController: AlertController) {}

  ngOnInit(): void {
    setInterval(() => { this.updateCurrentTime() }, 1000);
  }

  updateCurrentTime() {
    const now = new Date();
    const defaultTimezone = getDefaultTimezone(); // Replace with your default timezone
    this.currentTime = formatDateInTimezone(now, defaultTimezone);
  }

  async checkPermissions() {
    const permissions = await this.notificationServ.checkNotificationPermissions();
  }

  async requestPermissions() {
    const permissions = await this.notificationServ.requestNotificationPermissions();
  }

  async createPomodoro() {
    const permissions = await this.notificationServ.checkNotificationPermissions();

    if (permissions.display !== 'granted') {
      alert('Notification permissions not granted. Requesting permissions...');
      await this.requestPermissions();
    }

    const pendingPomodoro = await this.viewPendingPomodoroLength();
    if (pendingPomodoro.valueOf() > 0) {
      const alert = await this.alertController.create({
        header: 'Pomodoro is Underway',
        message: '(Timer here if possible)',
      });
  
      await alert.present();
    }

    // const toastMessage: any = {
    //   text: 'Pomodoro Start!',
    //   duration: 'short',
    //   position: 'bottom'
    // };
    // await this.notificationServ.presentToast(toastMessage);

    const notification: any = {
      title: 'Reminder',
      body: 'Time for a Break! (5 Minutes)',
      id: 1,
      schedule: { at: new Date(new Date().getTime() + 60 * 500) }, // 1 minute from now
      sound: null,
      attachments: null,
      actionTypeId: '',
      extra: null,
    };
    await this.notificationServ.scheduleNotification(notification);
  }

  async viewPendingPomodoroLength(): Promise<Number> {
    const pending = await this.notificationServ.getPendingNotifications();
    return pending.notifications.length;
  }

  async viewPendingPomodoro() {
    const pending = await this.notificationServ.getPendingNotifications();
    alert(JSON.stringify(pending));
  }
}
