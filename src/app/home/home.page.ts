import { Component, OnInit, ViewChild } from '@angular/core';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { NotificationService } from '../services/notification.service';
import { getDefaultTimezone, formatDateInTimezone } from 'src/utils/timezone-util';
import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit{
  @ViewChild(IonModal) modal!: IonModal;
  currentTime: string = '';
  scheduledNotifTime: any = new Date(new Date().getTime() + 25 * 60 * 700); 
  displayCountdown: any;
  notificationActive: { active: boolean; pomodoroActive?: boolean } = { active: false };

  constructor(
    private notificationServ: NotificationService, 
    private platform: Platform,
    private routerOutlet: IonRouterOutlet
  ) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        App.exitApp();
        // App.minimizeApp();
      }
    });

    this.notificationServ.listenForNotificationEvents();
  }

  ngOnInit(): void {
    setInterval(() => { 
      this.updateCurrentTime() 
    }, 1000);
  }

  startCountdown() {
    const countdownInterval = setInterval(() => {
      const now = new Date();
      const timeDifference = this.scheduledNotifTime.getTime() - now.getTime();

      if (timeDifference <= 0) {
        clearInterval(countdownInterval);
        this.displayCountdown = '00:00:00';
        return;
      }

      // Convert timeDifference to hours, minutes, and seconds
      const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      const seconds = Math.floor((timeDifference / 1000) % 60);

      this.displayCountdown = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
    }, 1000);
  }

  padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
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

  // Start a pomodoro cycle
  async createPomodoro() {
    const permissions = await this.notificationServ.checkNotificationPermissions();

    if (permissions.display !== 'granted') {
      alert('Notification permissions not granted. Requesting permissions...');
      await this.requestPermissions();
    }

    const pendingPomodoro = await this.viewPendingPomodoroLength();
    if (pendingPomodoro.valueOf() > 0) {
      alert('Pomodoro already underway');
    } else {
      this.notificationActive = { active: true, pomodoroActive: true };
      this.notificationServ.pomodoroActive = true;

      const defaultTimezone = getDefaultTimezone();
      const formattedTime = formatDateInTimezone(this.scheduledNotifTime, defaultTimezone);

      const notification: any = {
        title: 'Reminder',
        body: 'Time for a Break! (5 Minutes)',
        id: 1,
        schedule: { at: this.scheduledNotifTime },
        vibrate: [500, 200, 500]
      };
      await this.notificationServ.scheduleNotification(notification);

      this.scheduledNotifTime = new Date(new Date().getTime() + 25 * 60 * 1000); 

      this.startCountdown();
    }
  }

  async viewPendingPomodoroLength(): Promise<Number> {
    const pending = await this.notificationServ.getPendingNotifications();
    return pending.notifications.length;
  }

  // Debug
  async viewPendingPomodoro() {
    const pending = await this.notificationServ.getPendingNotifications();
    alert(JSON.stringify(pending));
  }

  // Debug
  async clearNotifications() {
    await this.notificationServ.clearAllNotifications();
    this.notificationActive = { active: false, pomodoroActive: false };
    alert('All notifications cleared');
  }

  // Ion Modal Stuff
  cancel() {
    this.modal.dismiss(null, 'cancel');
  }
  
}
