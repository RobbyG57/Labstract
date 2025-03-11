// Power state manager
const PowerState = {
    isOff: localStorage.getItem('powerState') === 'true', // Load saved state, default to false (ON) if not set
    
    set: function(isOff) {
        console.log('Setting power state to:', isOff ? 'OFF' : 'ON');
        this.isOff = isOff;
        // Save state to localStorage
        localStorage.setItem('powerState', isOff);
        this.updateUI();
        this.updateControls();
    },
    
    get: function() {
        return this.isOff;
    },
    
    toggle: function() {
        this.set(!this.isOff);
    },
    
    updateUI: function() {
        const powerButton = document.querySelector('.action-button.power');
        const mainCircle = document.querySelector('.main-circle');
        const animatedRing = document.querySelector('.animated-ring');
        
        if (this.isOff) {
            powerButton?.classList.add('off');
            mainCircle?.classList.add('off');
            // Add the red ring when power is off
            mainCircle?.classList.add('power-warning');
            // Hide the animated ring when power is off
            if (animatedRing) animatedRing.style.display = 'none';
        } else {
            powerButton?.classList.remove('off');
            mainCircle?.classList.remove('off');
            // Remove the red ring when power is on
            mainCircle?.classList.remove('power-warning');
            // Show the animated ring when power is on
            if (animatedRing) animatedRing.style.display = 'block';
        }
    },
    
    updateControls: function() {
        // Get all controls that should be disabled when power is off
        const snapshotButton = document.querySelector('.action-button.snapshot');
        const scheduleButton = document.querySelector('.action-button.schedule');
        const scheduleDot = document.querySelector('.nav-dots .dot[data-page="schedule"]');
        
        if (this.isOff) {
            // Disable controls when power is off
            if (snapshotButton) {
                snapshotButton.disabled = true;
                snapshotButton.style.opacity = '0.5';
                snapshotButton.style.cursor = 'not-allowed';
            }
            
            if (scheduleButton) {
                scheduleButton.disabled = true;
                scheduleButton.style.opacity = '0.5';
                scheduleButton.style.cursor = 'not-allowed';
            }
            
            // Only disable the schedule nav dot
            if (scheduleDot) {
                scheduleDot.style.opacity = '0.5';
                scheduleDot.style.cursor = 'not-allowed';
                scheduleDot.onclick = (e) => e.preventDefault();
            }
        } else {
            // Enable controls when power is on
            if (snapshotButton) {
                snapshotButton.disabled = false;
                snapshotButton.style.opacity = '1';
                snapshotButton.style.cursor = 'pointer';
            }
            
            if (scheduleButton) {
                scheduleButton.disabled = false;
                scheduleButton.style.opacity = '1';
                scheduleButton.style.cursor = 'pointer';
            }
            
            // Enable schedule nav dot
            if (scheduleDot) {
                scheduleDot.style.opacity = '1';
                scheduleDot.style.cursor = 'pointer';
                scheduleDot.onclick = null; // Remove the preventDefault handler
            }
        }
    }
};

export function setPowerState(isOff) {
    PowerState.set(isOff);
}

export function getPowerState() {
    return PowerState.get();
}

export function handlePower() {
    const powerButton = document.querySelector('.action-button.power');
    const mainCircle = document.querySelector('.main-circle');
    const warningModal = document.querySelector('.warning-modal');
    
    if (PowerState.get()) {  // If currently OFF
        console.log('Turning power ON');
        PowerState.set(false);
        return;
    }
    
    // Turning power OFF - show warning first
    console.log('Showing power off warning');
    powerButton.classList.add('warning');
    mainCircle.classList.add('power-warning');
    warningModal.style.display = 'flex';
    
    const cancelBtn = document.querySelector('.warning-btn.cancel');
    const confirmBtn = document.querySelector('.warning-btn.confirm');
    
    cancelBtn.onclick = () => {
        console.log('Canceling power off');
        powerButton.classList.remove('warning');
        mainCircle.classList.remove('power-warning');
        warningModal.style.display = 'none';
    };
    
    confirmBtn.onclick = () => {
        console.log('Confirming power off');
        warningModal.style.display = 'none';
        powerButton.classList.remove('warning');
        PowerState.set(true);  // Turn OFF
    };
} 