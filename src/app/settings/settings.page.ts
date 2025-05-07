import { Component, OnInit } from '@angular/core';
import { TimerService } from '../services/timer.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false
})
export class SettingsPage implements OnInit {
  pomodoroDuration: number = 25; // Default Pomodoro (25)
  breakDuration: number = 5; // Default Break (5)

  constructor(
    private timerService: TimerService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.pomodoroDuration = this.timerService.getPomodoroDuration();
    this.breakDuration = this.timerService.getBreakDuration();
  }

  async saveSettings() {
    this.timerService.setPomodoroDuration(this.pomodoroDuration);
    this.timerService.setBreakDuration(this.breakDuration);

    const toast = await this.toastController.create({
      message: 'Saved!',
      duration: 3000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }
}
