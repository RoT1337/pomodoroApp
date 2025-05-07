import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  pomodoroDuration: number = 25; // Default Pomodoro (25)
  breakDuration: number = 5; // Default Break (5)

  constructor() { }

  getPomodoroDuration(): number {
    return this.pomodoroDuration;
  }

  getBreakDuration(): number {
    return this.breakDuration;
  }

  setPomodoroDuration(duration: number) {
    this.pomodoroDuration = duration;
  }

  setBreakDuration(duration: number) {
    this.breakDuration = duration;
  }

}
