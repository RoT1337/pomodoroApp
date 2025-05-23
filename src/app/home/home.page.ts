import { Component, OnInit, ViewChild } from '@angular/core';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { NotificationService } from '../services/notification.service';
import { getDefaultTimezone, formatDateInTimezone } from 'src/utils/timezone-util';
import { IonModal } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';
import { TimerService } from '../services/timer.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit{
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('breakModal', { static: true }) breakModal!: IonModal;
  currentTime: string = '';
  scheduledNotifTime: any;
  displayCountdown: any;
  notificationActive: boolean = false;
  breakCountdown: any;
  isBreak: boolean = false;

  durationSeconds: number = 60; // Default 60
  durationPomodoroMinutes: number = 25; // Default 25
  durationBreakMinutes: number = 5; // Default 5

  constructor(
    private timerService: TimerService,
    private notificationServ: NotificationService, 
    private platform: Platform,
    private routerOutlet: IonRouterOutlet,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        App.exitApp();
        // App.minimizeApp();
      }
    });
  }

  ngOnInit(): void {
    this.durationPomodoroMinutes = this.timerService.getPomodoroDuration();
    this.durationBreakMinutes = this.timerService.getBreakDuration();

    setInterval(() => { 
      this.updateCurrentTime() 
    }, 1000);
  }

  updateScheduledNotifTime(durationInMinutes: number) {
    this.scheduledNotifTime = new Date(new Date().getTime() + durationInMinutes * this.durationSeconds * 1000);
    console.log(`Updated scheduledNotifTime: ${this.scheduledNotifTime}`);
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
      this.cdr.detectChanges();
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

  async requestPermissions() {
    const permissions = await this.notificationServ.requestNotificationPermissions();
  }

  // Start a pomodoro cycle
  async createPomodoro() {
    const permissions = await this.notificationServ.checkNotificationPermissions();
  
    if (permissions.display !== 'granted') {
      const toast = await this.toastController.create({
        message: 'Notification permissions not granted. Requesting permissions...',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      await this.requestPermissions();
    }
  
    const pendingPomodoro = await this.viewPendingPomodoroLength();
    if (pendingPomodoro.valueOf() > 0) {
      const toast = await this.toastController.create({
        message: 'A Pomodoro is already underway!',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } else {
      this.notificationActive = true;
      this.isBreak = false;
  
      // Update scheduledNotifTime for the Pomodoro
      this.updateScheduledNotifTime(this.durationPomodoroMinutes);
  
      const pomodoroNotification: any = {
        title: 'Reminder',
        body: 'Time for a Break! (5 Minutes)',
        id: 1,
        schedule: { at: this.scheduledNotifTime },
      };
  
      const breakNotification: any = {
        title: 'Break Finished',
        body: 'Start another Pomodoro or Finish up!',
        id: 2,
        schedule: { at: new Date(this.scheduledNotifTime.getTime() + this.durationBreakMinutes * this.durationSeconds * 1000) }, // 5 minutes after the Pomodoro
      };
  
      await this.notificationServ.scheduleNotificationWithFollowUp(pomodoroNotification, breakNotification);
  
      // Start the Pomodoro countdown
      this.startCountdown();
  
      // Update the scheduledNotifTime for the break and restart the countdown after the Pomodoro ends
      setTimeout(async () => {
        this.isBreak = true;
        this.updateScheduledNotifTime(this.durationBreakMinutes);
        this.startBreakCountdown();

        await this.closePomodoroModal();
        await this.openBreakModal();

        // Set notificationActive to false after the break ends
        setTimeout(() => {
          this.notificationActive = false;
          console.log('Break finished. notificationActive set to false.');
        }, this.durationBreakMinutes * this.durationSeconds * 1000); // Wait for 5 minutes (break duration) | Should be 5 * 60 * 1000 for 25 Minutes
      }, this.durationPomodoroMinutes * this.durationSeconds * 1000); // Wait for 25 minutes (Pomodoro duration) | Should be 25 * 60 * 1000 for 25 Minutes
    }
  }

  async openBreakModal() {
    await this.breakModal.present();
  }

  async closePomodoroModal() {
    await this.modal.dismiss();
  }

  async closeBreakModal() {
    if (this.notificationActive) {
      const toast = await this.toastController.create({
        message: 'Please Finish the Pomodoro :)',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
    } else {
      await this.breakModal.dismiss();
    }
  }

  startBreakCountdown() {
    const countdownInterval = setInterval(() => {
      const now = new Date();
      const timeDifference = this.scheduledNotifTime.getTime() - now.getTime();

      if (timeDifference <= 0) {
        clearInterval(countdownInterval);
        this.breakCountdown = '00:00';
        return;
      }

      const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      const seconds = Math.floor((timeDifference / 1000) % 60);

      this.breakCountdown = `${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
    }, 1000);
  }

  async viewPendingPomodoroLength(): Promise<Number> {
    const pending = await this.notificationServ.getPendingNotifications();
    return pending.notifications.length;
  }

  // Debug
  async viewPendingPomodoro() {
    const pending = await this.notificationServ.getPendingNotifications();
    const pomodoroTimer = this.durationPomodoroMinutes;
    const breakTimer = this.durationBreakMinutes;

    alert(`${JSON.stringify(pending)} || Pomodoro Timer: ${pomodoroTimer} || Break Timer: ${breakTimer}`);
  }
}
