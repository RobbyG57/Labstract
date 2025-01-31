export class TimeService {
    constructor(config = {}) {
        // Get current time ONCE when service is created
        const now = new Date();
        this.currentHour = Math.floor(now.getHours());
        
        this.config = {
            startHour: this.currentHour,  // Store current hour
            majorStep: 4,     // Show number every 4 hours
            minorStep: 1,     // Minor tick every hour
            microStep: 0.5,   // Micro tick every 30 minutes
            defaultZoom: 12,  // Default 12-hour window
            ...config
        };
        
        this.currentZoom = this.config.defaultZoom;
        this.updateInterval = null;
        
        console.log('TimeService initialized with hour:', this.currentHour); // Debug log
    }

    // Start real-time updates
    startTimeTracking() {
        this.updateCurrentTime();
        this.updateInterval = setInterval(() => {
            this.updateCurrentTime();
        }, 60000); // Update every minute
    }

    // Stop real-time updates
    stopTimeTracking() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Update current time
    updateCurrentTime() {
        const now = new Date();
        this.currentHour = Math.floor(now.getHours());
        // Dispatch an event that time has updated
        window.dispatchEvent(new CustomEvent('timeupdate', {
            detail: { time: now }
        }));
    }

    // Get the visible time window
    getVisibleWindow() {
        // Allow the window to extend past midnight if needed
        let end = this.currentHour + this.currentZoom;
        
        return {
            start: this.currentHour,
            end: end,
            current: this.currentHour
        };
    }

    // Update zoom level
    setZoom(hours) {
        this.currentZoom = hours;
        return this.getVisibleWindow();
    }

    // Format time for display (e.g., "2:30 PM")
    formatTime(hour) {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    }

    // Calculate marker positions for a given window
    calculateMarkers(start, end) {
        const duration = end - start;
        const step = duration <= 4 ? 1 : // 1-hour steps for zoomed in
                    duration <= 8 ? 2 : // 2-hour steps for medium
                    4; // 4-hour steps for zoomed out
        
        const markers = [];
        let current = Math.ceil(start);
        
        while (current <= end) {
            markers.push({
                hour: current,
                label: this.formatTime(current),
                position: ((current - start) / (end - start)) * 100
            });
            current += step;
        }
        
        return markers;
    }

    // Get tick marks between major markers
    getTickMarks(markers) {
        const ticks = [];
        for (let i = 0; i < markers.length - 1; i++) {
            const start = markers[i].hour;
            const end = markers[i + 1].hour;
            const gap = end - start;
            
            // Add different levels of ticks based on gap size
            // ... tick calculation logic ...
        }
        return ticks;
    }

    // Get current time info for schedule processing
    getCurrentTimeInfo() {
        const now = new Date();
        return {
            day: now.getDay(),  // 0-6 (Sunday-Saturday)
            hour: now.getHours(),
            minute: now.getMinutes(),
            timestamp: now.getTime()  // Full timestamp if needed
        };
    }
}

// Export a singleton instance
export const timeService = new TimeService(); 