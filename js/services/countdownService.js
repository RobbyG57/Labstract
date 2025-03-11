export class CountdownService {
    constructor() {
        this.events = [];
        this.currentEvent = null;
        this.nextEvent = null;
        this.countdownInterval = null;
    }

    setEvents(scheduleData) {
        this.events = this.extractEvents(scheduleData);
        this.updateCurrentAndNextEvents();
        console.log('Events loaded:', this.events);
    }

    extractEvents(scheduleData) {
        const events = [];
        
        Object.entries(scheduleData.tanks).forEach(([tankName, tank]) => {
            if (tank.schedule && tank.schedule.startTime) {
                // Get base start time
                const [hours, minutes] = tank.schedule.startTime.split(':').map(Number);
                
                // Add the initial event
                events.push({
                    tankName,
                    time: hours + minutes / 60,
                    displayTime: tank.schedule.startTime
                });

                // If there's an interval, add additional events
                if (tank.schedule.interval) {
                    const intervalHours = tank.schedule.interval.hours || 0;
                    const intervalMinutes = tank.schedule.interval.minutes || 0;
                    const intervalInHours = intervalHours + (intervalMinutes / 60);
                    
                    // Add events for the rest of the day
                    let nextTime = hours + minutes / 60 + intervalInHours;
                    while (nextTime < 24) {
                        const nextHours = Math.floor(nextTime);
                        const nextMinutes = Math.round((nextTime % 1) * 60);
                        const displayTime = `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
                        
                        events.push({
                            tankName,
                            time: nextTime,
                            displayTime
                        });
                        
                        nextTime += intervalInHours;
                    }
                }
            }
        });
        
        // Sort events by time
        return events.sort((a, b) => a.time - b.time);
    }

    updateCurrentAndNextEvents() {
        const now = new Date();
        const currentTime = now.getHours() + now.getMinutes() / 60;

        // Find next event
        this.nextEvent = this.events.find(event => event.time > currentTime);
        
        if (!this.nextEvent && this.events.length > 0) {
            // If no next event today, use first event
            this.nextEvent = this.events[0];
        }
    }

    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        this.updateCountdown();
        // Update more frequently (every second) to catch exact zero
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    }

    updateCountdown() {
        if (!this.nextEvent) return;

        const now = new Date();
        const [nextHours, nextMinutes] = this.nextEvent.displayTime.split(':').map(Number);
        
        let hours = nextHours - now.getHours();
        let minutes = nextMinutes - now.getMinutes();

        if (minutes < 0) {
            hours--;
            minutes += 60;
        }

        if (hours < 0 || (hours === 0 && minutes === 0)) {
            // If countdown reaches zero or goes negative
            console.log('Countdown reached zero, refreshing page...');
            
            // Stop all intervals
            this.stop();
            
            // Clear any other intervals (timeline indicator, etc.)
            const scheduleContent = document.querySelector('.schedule-content');
            const indicatorInterval = scheduleContent?.dataset.indicatorInterval;
            if (indicatorInterval) {
                clearInterval(parseInt(indicatorInterval));
            }
            
            // Update timeService to current time before refresh
            const currentHour = now.getHours();
            timeService.setCurrentHour(currentHour);
            
            // Refresh the page
            location.reload();
            return;
        }

        // Update countdown display
        this.updateDisplay(hours, minutes);
    }

    updateDisplay(hours, minutes) {
        const countdownHours = document.querySelector('.countdown-hours');
        const countdownMinutes = document.querySelector('.countdown-minutes');

        if (countdownHours && countdownMinutes) {
            countdownHours.textContent = String(hours).padStart(2, '0');
            countdownMinutes.textContent = String(minutes).padStart(2, '0');
        }
    }

    stop() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
}

export const countdownService = new CountdownService(); 