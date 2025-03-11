import { timeService } from './services/timeService.js';
import { countdownService } from './services/countdownService.js';
import { dataService } from './services/dataService.js';

// Process color mapping - update to match your processes
const processColors = {
    'Etch': '#45e3d8',
    'Electroless': '#FF8A4C',
    'Acid Copper': '#4CAF50',
    'default': '#45e3d8'
};

// Time window configuration
const timeConfig = {
    startHour: 6,     // Start at 6 AM
    endHour: 18,      // End at 6 PM
    majorStep: 4,     // Show number every 4 hours
    minorStep: 1,     // Minor tick every hour
    microStep: 0.5    // Micro tick every 30 minutes
};

// Add a constant for block width ratio
const BLOCK_WIDTH_RATIO = 2; // This will make blocks twice as wide as they are tall

// Modal templates (to be implemented)
function showTimeWindowModal() {
    // Show modal to adjust timeConfig.startHour and timeConfig.endHour
    // Then reinitialize the schedule view
}

function showBatchScheduleModal() {
    console.log('Opening batch schedule modal'); // Debug log
    
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    
    const content = document.createElement('div');
    content.className = 'schedule-modal-content';
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => modal.remove();
    
    // Header
    const header = document.createElement('div');
    header.className = 'schedule-modal-header';
    header.textContent = 'Set All Tank Schedules';
    
    const form = document.createElement('form');
    form.className = 'schedule-form';
    form.innerHTML = `
        <div class="day-selector">
            <button type="button" data-day="0">S</button>
            <button type="button" data-day="1">M</button>
            <button type="button" data-day="2">T</button>
            <button type="button" data-day="3">W</button>
            <button type="button" data-day="4">T</button>
            <button type="button" data-day="5">F</button>
            <button type="button" data-day="6">S</button>
        </div>
        <div class="time-input">
            <input type="time" name="startTime" required>
        </div>
        <div class="repeat-group">
            <div class="repeat-input">
                <input type="text" name="repeatHours" placeholder="HH" maxlength="2">
                <span>:</span>
                <input type="text" name="repeatMinutes" placeholder="MM" maxlength="2">
            </div>
            <button type="button" class="set-btn">Set All</button>
        </div>
    `;
    
    // Day selector functionality
    const dayButtons = form.querySelectorAll('.day-selector button');
    dayButtons.forEach(btn => {
        btn.onclick = () => {
            btn.classList.toggle('selected');
        };
    });
    
    // Set button functionality
    const setBtn = form.querySelector('.set-btn');
    console.log('Set button found:', setBtn); // Debug log
    
    if (setBtn) {
        setBtn.addEventListener('click', async (event) => {
            console.log('Set button clicked'); // Debug log
            event.preventDefault();
            
            const selectedDays = Array.from(dayButtons)
                .filter(btn => btn.classList.contains('selected'))
                .map(btn => parseInt(btn.dataset.day));
                
            const formData = new FormData(form);
            const schedule = {
                days: selectedDays,
                startTime: formData.get('startTime'),
                interval: {
                    hours: parseInt(formData.get('repeatHours') || 0),
                    minutes: parseInt(formData.get('repeatMinutes') || 0)
                }
            };
            
            if (!validateSchedule(schedule)) {
                return;
            }

            try {
                await saveAllSchedules(schedule);
                modal.remove();
            } catch (error) {
                console.error('Error updating batch schedule:', error);
                showError('Failed to update schedules');
            }
        });
    } else {
        console.error('Set button not found in form');
    }
    
    content.appendChild(closeBtn);
    content.appendChild(header);
    content.appendChild(form);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function makeScheduleBlocksClickable() {
    document.querySelectorAll('.schedule-tank-row').forEach(row => {
        row.onclick = () => {
            const tankName = row.querySelector('.schedule-tank-label').textContent;
            showTankScheduleModal(tankName);
        };
    });
}

function showTankScheduleModal(tankName) {
    // Show modal to edit specific tank schedule
}

function updateTimelineMarkers() {
    const markers = document.querySelector('.time-markers');
    if (!markers) return;
    
    // Clear existing circles
    const existingCircles = markers.querySelectorAll('.schedule-time-circle');
    existingCircles.forEach(circle => circle.remove());
    
    // Get window from timeService
    const window = timeService.getVisibleWindow();
    
    // Calculate hour intervals based on window size
    const windowSize = window.end - window.start;
    console.log('Window size:', windowSize); // Debug log
    
    // Create 4 evenly spaced markers
    for (let i = 0; i < 4; i++) {
        const circle = document.createElement('div');
        circle.className = 'schedule-time-circle';
        
        // Calculate position and hour
        const position = (i / 3) * 100; // Convert to percentage
        const hour = window.start + (i * (windowSize / 3)); // Use full window size
        
        console.log(`Marker ${i}:`, { position, hour }); // Debug log
        
        // Convert to 12-hour format (1-12)
        const displayHour = (Math.floor(hour) % 12) || 12;
        
        circle.style.left = `${position}%`;
        circle.textContent = String(displayHour).padStart(2, '0');
        
        markers.appendChild(circle);
    }
    
    // Update data attributes with full window size
    markers.dataset.start = Math.floor(window.start);
    markers.dataset.end = Math.ceil(window.end);
    
    // Update tick marks
    addTickMarks();
}

function addTickMarks() {
    const tickContainer = document.querySelector('.tick-marks');
    tickContainer.innerHTML = ''; // Clear existing ticks
    
    // Get window size from markers dataset
    const markers = document.querySelector('.time-markers');
    const windowSize = markers.dataset.end - markers.dataset.start;
    
    // Get all circle positions
    const circles = document.querySelectorAll('.schedule-time-circle');
    const positions = Array.from(circles).map(circle => parseFloat(circle.style.left));
    
    // For each pair of circles
    for (let i = 0; i < positions.length - 1; i++) {
        const start = positions[i];
        const end = positions[i + 1];
        const gap = end - start;
        
        // Add level 1 tick (halfway)
        addTick(start + gap/2, 'level-1');
        
        if (windowSize === 3) {
            // For 3-hour window, divide each hour into quarters (15-minute marks)
            for (let j = 1; j < 4; j++) {
                addTick(start + (gap * j)/4, 'level-2');
            }
            // Add finer 5-minute marks
            for (let j = 1; j < 12; j++) {
                if (j % 3 !== 0) { // Avoid positions where larger ticks exist
                    addTick(start + (gap * j)/12, 'level-3');
                }
            }
        } else if (windowSize === 9 || windowSize === 12) {
            // For 9-hour window, divide gaps into thirds
            addTick(start + gap/3, 'level-2');
            addTick(start + (gap*2)/3, 'level-2');
            
            // Add finer marks at hour positions
            for (let j = 1; j < 6; j++) {
                if (j % 2 !== 0) { // Avoid positions where larger ticks exist
                    addTick(start + (gap * j)/6, 'level-3');
                }
            }
        } else {
            // Default behavior for 6 and 12 hour windows
            // Add level 2 ticks (quarters)
            addTick(start + gap/4, 'level-2');
            addTick(start + (gap*3)/4, 'level-2');
            
            // Add level 3 ticks (eighths)
            addTick(start + gap/8, 'level-3');
            addTick(start + (gap*3)/8, 'level-3');
            addTick(start + (gap*5)/8, 'level-3');
            addTick(start + (gap*7)/8, 'level-3');
            
            // Add level 4 ticks (sixteenths)
            for (let j = 1; j < 16; j += 2) {
                if (j % 2 !== 0 && j % 4 !== 1) {
                    addTick(start + (gap * j)/16, 'level-4');
                }
            }
        }
    }
    
    function addTick(position, level) {
        const tick = document.createElement('div');
        tick.className = `timeline-tick ${level}`;
        tick.style.left = `${position}%`;
        tickContainer.appendChild(tick);
    }
}

function abbreviateTankName(name) {
    // Split into words
    const words = name.trim().split(' ');
    
    // If it's just one word with a number, keep it
    if (words.length === 1) {
        return name;
    }
    
    // Extract number if exists
    const lastWord = words[words.length - 1];
    const hasNumber = !isNaN(lastWord);
    const number = hasNumber ? ` ${lastWord}` : '';
    
    // Handle different cases
    if (words.length === 2 && hasNumber) {
        // For "Etch 1" -> "E1"
        return words[0][0] + number;
    } else if (words.length >= 2) {
        // For "Acid Copper" -> "ACu"
        // For "Acid Copper 1" -> "ACu1"
        const abbr = words.slice(0, -1).map(word => {
            // Special cases
            if (word.toLowerCase() === 'copper') return 'Cu';
            if (word.toLowerCase() === 'electroless') return 'El';
            return word[0];
        }).join('');
        
        return abbr + number;
    }
    
    return name;
}

// Examples:
console.log(abbreviateTankName("Acid Copper 1"));     // "ACu1"
console.log(abbreviateTankName("Electroless Copper")); // "ElCu"
console.log(abbreviateTankName("Etch 2"));            // "E2"
console.log(abbreviateTankName("Accelerator 1"));     // "A1"

function createTankLabel(fullName) {
    const label = document.createElement('div');
    label.className = 'schedule-tank-label';
    label.setAttribute('data-full-name', fullName);
    label.textContent = abbreviateTankName(fullName);
    return label;
}

function createTankRow(tankName, processColor, schedule) {
    console.log(`Creating row for ${tankName} with color ${processColor}`);
    
    const row = document.createElement('div');
    row.className = 'schedule-tank-row';

    const labelContainer = document.createElement('div');
    labelContainer.className = 'schedule-tank-label-container';
    labelContainer.style.cursor = 'pointer';
    labelContainer.style.zIndex = '10'; // Ensure it's above other elements

    const label = document.createElement('div');
    label.className = 'schedule-tank-label';
    label.textContent = abbreviateTankName(tankName);
    label.setAttribute('data-full-name', tankName);
    label.style.color = processColor;
    
    // Make label container clickable with stopPropagation
    const handleClick = (event) => {
        event.stopPropagation();
        event.preventDefault();
        console.log('Tank label clicked:', tankName);
        showScheduleModal(tankName, processColor, schedule);
    };

    // Add click handler to both container and label
    labelContainer.addEventListener('click', handleClick, true);
    label.addEventListener('click', handleClick, true);

    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'schedule-timeline-container';
    timelineContainer.style.pointerEvents = 'none'; // Prevent timeline from catching clicks

    const timelineGrid = document.createElement('div');
    timelineGrid.className = 'schedule-timeline-grid';
    timelineGrid.style.marginLeft = '100px';
    timelineGrid.style.pointerEvents = 'none'; // Prevent grid from catching clicks

    // Add schedule blocks based on pattern
    if (schedule) {
        const window = timeService.getVisibleWindow();
        const blocks = generateScheduleBlocks(schedule);
        
        blocks.forEach(time => {
            const block = document.createElement('div');
            block.className = 'schedule-block';
            block.setAttribute('data-time', time);
            block.style.pointerEvents = 'none'; // Prevent blocks from catching clicks
            
            const [hours, minutes] = time.split(':').map(Number);
            const timeInHours = hours + (minutes / 60);
            const windowDuration = 12;
            const position = ((timeInHours - window.start) / windowDuration) * 100;
            
            if (position >= 0 && position <= 100) {
                block.style.left = `${position}%`;
                block.style.backgroundColor = processColor;
                timelineGrid.appendChild(block);
            }
        });
    }

    labelContainer.appendChild(label);
    timelineContainer.appendChild(timelineGrid);
    row.appendChild(labelContainer);
    row.appendChild(timelineContainer);

    // Debug click handler
    row.addEventListener('click', (event) => {
        console.log('Row clicked, target:', event.target, 'current target:', event.currentTarget);
    });

    return row;
}

function generateScheduleBlocks(schedule) {
    const window = timeService.getVisibleWindow();
    const currentTime = timeService.getCurrentTimeInfo();
    const blocks = [];
    
    if (!schedule || !schedule.startTime) return blocks;
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const intervalHours = schedule.interval.hours;
    const intervalMinutes = schedule.interval.minutes;
    const totalIntervalMinutes = (intervalHours * 60) + intervalMinutes;
    
    // Check yesterday, today, and tomorrow
    const yesterday = (currentTime.day - 1 + 7) % 7;
    const today = currentTime.day;
    const tomorrow = (currentTime.day + 1) % 7;
    
    const yesterdayScheduled = schedule.days.includes(yesterday);
    const todayScheduled = schedule.days.includes(today);
    const tomorrowScheduled = schedule.days.includes(tomorrow);
    
    console.log('Schedule context:', {
        yesterdayScheduled,
        todayScheduled,
        tomorrowScheduled,
        startTime: `${startHour}:${startMinute}`,
        interval: `${intervalHours}:${intervalMinutes}`
    });
    
    // Find the first block time for today
    let firstBlockMinute;
    if (yesterdayScheduled) {
        // Calculate where in the pattern we would be if starting from yesterday
        const minutesSinceMidnight = (startHour * 60) + startMinute;
        const minutesInDay = 24 * 60;
        
        // How many intervals fit between start time and midnight
        const intervalsToMidnight = Math.ceil((minutesInDay - minutesSinceMidnight) / totalIntervalMinutes);
        
        // Calculate the minute offset for the first block today
        firstBlockMinute = (minutesSinceMidnight + (intervalsToMidnight * totalIntervalMinutes)) % minutesInDay;
    } else {
        // Start from today's start time
        firstBlockMinute = (startHour * 60) + startMinute;
    }
    
    // Generate blocks
    let currentMinute = firstBlockMinute;
    const endMinute = tomorrowScheduled ? (24 * 60) : ((23 * 60) + 59);
    
    while (currentMinute <= endMinute) {
        const hour = Math.floor(currentMinute / 60);
        const minute = currentMinute % 60;
        
        // Only add if within our window
        if (hour >= window.start && hour <= window.end) {
            blocks.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
        
        currentMinute += totalIntervalMinutes;
    }
    
    console.log('Generated blocks:', blocks);
    return blocks;
}

async function showScheduleModal(tankName, processColor, currentSchedule) {
    console.log('Opening modal for tank:', tankName);
    
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    
    const content = document.createElement('div');
    content.className = 'schedule-modal-content';
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => modal.remove();
    
    // Header with tank name
    const header = document.createElement('div');
    header.className = 'schedule-modal-header';
    header.style.color = processColor;
    header.textContent = tankName;
    
    const form = document.createElement('form');
    form.className = 'schedule-form';
    
    form.innerHTML = `
        <div class="day-selector">
            <button type="button" data-day="0">S</button>
            <button type="button" data-day="1">M</button>
            <button type="button" data-day="2">T</button>
            <button type="button" data-day="3">W</button>
            <button type="button" data-day="4">T</button>
            <button type="button" data-day="5">F</button>
            <button type="button" data-day="6">S</button>
        </div>
        <div class="time-input">
            <input type="time" name="startTime" required>
        </div>
        <div class="repeat-group">
            <div class="repeat-input">
                <input type="text" name="repeatHours" placeholder="HH" maxlength="2">
                <span>:</span>
                <input type="text" name="repeatMinutes" placeholder="MM" maxlength="2">
            </div>
            <button type="button" class="set-btn">Set</button>
        </div>
    `;
    
    // Day selector functionality
    const dayButtons = form.querySelectorAll('.day-selector button');
    dayButtons.forEach(btn => {
        btn.onclick = () => {
            btn.classList.toggle('selected');
        };
    });

    // Set button functionality
    const setBtn = form.querySelector('.set-btn');
    console.log('Set button found:', setBtn);
    
    if (setBtn) {
        setBtn.addEventListener('click', async (event) => {
            console.log('Set button clicked');
            event.preventDefault();
            
            const selectedDays = Array.from(dayButtons)
                .filter(btn => btn.classList.contains('selected'))
                .map(btn => parseInt(btn.dataset.day));
                
            const formData = new FormData(form);
            const schedule = {
                days: selectedDays,
                startTime: formData.get('startTime'),
                interval: {
                    hours: parseInt(formData.get('repeatHours') || 0),
                    minutes: parseInt(formData.get('repeatMinutes') || 0)
                }
            };
            
            console.log('Schedule to save:', schedule);
            
            if (!validateSchedule(schedule)) {
                return;
            }

            try {
                console.log('Attempting to save schedule...');
                const saveSuccessful = await saveTankSchedule(tankName, schedule);
                console.log('Save result:', saveSuccessful);
                
                if (saveSuccessful) {
                    console.log('Closing modal after successful save');
                    modal.remove();
                    await initializeSchedule(); // Refresh the view
                }
            } catch (error) {
                console.error('Error updating schedule:', error);
                showError('Failed to update schedule');
            }
        });
    } else {
        console.error('Set button not found in form');
    }
    
    content.appendChild(closeBtn);
    content.appendChild(header);
    content.appendChild(form);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Load current schedule if it exists
    if (currentSchedule) {
        loadExistingSchedule(currentSchedule, form);
    }
}

// Helper functions
function getScheduleFromForm(form) {
    const selectedDays = Array.from(form.querySelectorAll('.day-selector button.selected'))
        .map(btn => parseInt(btn.dataset.day));
        
    return {
        active: form.querySelector('[name="active"]').checked,
        days: selectedDays,
        startTime: form.querySelector('[name="startTime"]').value,
        repeatInterval: {
            hours: parseInt(form.querySelector('[name="repeatHours"]').value || 0),
            minutes: parseInt(form.querySelector('[name="repeatMinutes"]').value || 0)
        }
    };
}

function validateSchedule(schedule) {
    if (schedule.days.length === 0) {
        showError('Please select at least one day');
        return false;
    }
    
    if (!schedule.startTime) {
        showError('Please set a start time');
        return false;
    }
    
    const totalMinutes = (schedule.interval.hours || 0) * 60 + (schedule.interval.minutes || 0);
    if (totalMinutes < 30) {
        showError('Repeat interval must be at least 30 minutes');
        return false;
    }
    
    return true;
}

async function updateTankSchedule(tankName, schedule) {
    try {
        const response = await fetch('/Labstract/labstract-frontend/data/schedule.json');
        const scheduleData = await response.json();
        
        // Update the specific tank's schedule
        if (scheduleData.tanks[tankName]) {
            scheduleData.tanks[tankName].schedule = {
                days: schedule.days,
                startTime: schedule.startTime,
                interval: schedule.repeatInterval
            };
        }
        
        // Save updated schedule
        console.log('Updated schedule:', scheduleData);
        return scheduleData;
    } catch (error) {
        console.error('Error updating tank schedule:', error);
        throw error;
    }
}

export async function initializeSchedule() {
    console.log('Initializing schedule view');
    const scheduleContent = document.querySelector('.schedule-content');
    
    if (!scheduleContent) {
        console.error('Schedule content container not found');
        return;
    }
    
    scheduleContent.innerHTML = '';
    
    try {
        // Initialize timeline first
        updateTimelineMarkers();
        
        // Initialize time indicator
        initializeTimeIndicator();
        
        // Load plating line data first
        const platingData = await dataService.getPlatingLineData();
        console.log('Loaded plating line data:', platingData);

        // Try to get schedule from localStorage first
        let scheduleData;
        try {
            scheduleData = JSON.parse(localStorage.getItem('tempSchedule'));
            console.log('Loaded schedule from localStorage:', scheduleData);
        } catch (e) {
            console.log('No saved schedule found in localStorage');
            // If no localStorage data, try to load from file
            const response = await fetch('/Labstract/labstract-frontend/data/schedule.json');
            scheduleData = await response.json();
        }
        
        // Create rows for all tanks from plating data
        Object.entries(platingData.processes).forEach(([processId, process]) => {
            Object.entries(process.tanks).forEach(([tankId, tank]) => {
                // Find matching schedule data if it exists
                const scheduleInfo = scheduleData?.tanks?.[tank.name]?.schedule;
                
                console.log(`Creating row for ${tank.name}:`, {
                    processColor: process.color,
                    schedule: scheduleInfo
                });
                
                const row = createTankRow(tank.name, process.color, scheduleInfo);
                scheduleContent.appendChild(row);
            });
        });
        
        // Initialize countdown only if we have schedule data
        if (scheduleData?.tanks) {
            countdownService.setEvents(scheduleData);
            countdownService.startCountdown();
        }
        
        makeScheduleBlocksClickable();
        initializeFooterControls();
        
        console.log('Schedule view initialized');
    } catch (error) {
        console.error('Error initializing schedule:', error);
        scheduleContent.innerHTML = '<div class="error-message">Error loading schedule data</div>';
    }
}

// Update the getProcessColor helper function
function getProcessColor(process) {
    return processColors[process] || processColors.default;
}

// Update the slider handler
function initializeFooterControls() {
    const batchScheduleBtn = document.querySelector('.batch-schedule-btn');
    const timeRange = document.querySelector('.time-range');
    const currentValue = document.querySelector('.range-current');

    // Add click handler for batch schedule button
    if (batchScheduleBtn) {
        batchScheduleBtn.addEventListener('click', () => {
            showBatchScheduleModal();
        });
    }

    // Existing time range handler
    timeRange.addEventListener('input', (e) => {
        const hours = e.target.value;
        currentValue.textContent = `${hours}h`;
        updateTimelineWindow(hours);
    });
}

function updateTimelineWindow(hours) {
    const window = timeService.setZoom(parseInt(hours));
    updateTimelineMarkers();
    
    // Calculate our own window range based on hours parameter
    const visibleStart = window.start;
    const visibleEnd = visibleStart + parseInt(hours);
    
    // Update schedule blocks
    const scheduleBlocks = document.querySelectorAll('.schedule-block');
    
    scheduleBlocks.forEach(block => {
        const timeStr = block.getAttribute('data-time');
        const [blockHours, blockMinutes] = timeStr.split(':').map(Number);
        const timeInHours = blockHours + (blockMinutes / 60);
        // Calculate position as percentage through the window
        const position = ((timeInHours - visibleStart) / hours) * 100;
        
        if (timeInHours >= visibleStart && timeInHours <= visibleEnd) {
            block.style.left = `${position}%`;
            block.style.display = 'block';
            // Adjust width based on window size
            if (hours >= 24) {
                block.style.width = '1px';
            } else if (hours >= 20) {
                block.style.width = '1.5px';
            } else if (hours >= 16) {
                block.style.width = '2px';
            } else {
                block.style.width = '3px';
            }
        } else {
            block.style.display = 'none';
        }
    });
}

function loadExistingSchedule(schedule, form) {
    // Set selected days
    const dayButtons = form.querySelectorAll('.day-selector button');
    schedule.days?.forEach(day => {
        dayButtons[day]?.classList.add('selected');
    });
    
    // Set start time
    if (schedule.startTime) {
        form.querySelector('[name="startTime"]').value = schedule.startTime;
    }
    
    // Set interval (changed from repeatInterval)
    if (schedule.interval) {
        form.querySelector('[name="repeatHours"]').value = 
            schedule.interval.hours?.toString() || '';
        form.querySelector('[name="repeatMinutes"]').value = 
            schedule.interval.minutes?.toString() || '';
    }
}

async function showConfirmDialog(title, message) {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        modal.innerHTML = `
            <div class="confirm-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="button-group">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        confirmBtn.onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        document.body.appendChild(modal);
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove after 3 seconds
    setTimeout(() => errorDiv.remove(), 3000);
    
    document.body.appendChild(errorDiv);
} 

// Add cleanup when page changes
export function cleanup() {
    countdownService.stop();
    
    // Clear time indicator interval
    const scheduleContent = document.querySelector('.schedule-content');
    const intervalId = scheduleContent?.dataset.indicatorInterval;
    if (intervalId) {
        clearInterval(intervalId);
    }
}

function initializeTimeIndicator() {
    // Remove existing indicator if any
    const existingIndicator = document.querySelector('.current-time-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Get current window size from timeService
    const window = timeService.getVisibleWindow();
    const windowSize = window.end - window.start;

    // Create container for the indicator that matches timeline grid
    const container = document.createElement('div');
    container.className = 'time-indicator-container';
    container.style.marginLeft = '100px'; // Match timeline grid margin
    container.style.width = `calc((100% - 140px)`; // Width of one hour based on current window

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'current-time-indicator';
    
    // Add indicator to container, then container to schedule content
    container.appendChild(indicator);
    const scheduleContent = document.querySelector('.schedule-content');
    scheduleContent.appendChild(container);

    // Initial position
    updateTimeIndicatorPosition();

    // Update position every second
    const indicatorInterval = setInterval(() => {
        const window = timeService.getVisibleWindow();
        const now = new Date();
        const currentTime = now.getHours() + (now.getMinutes() / 60);

        // If we're more than an hour ahead, refresh the page
        if (currentTime > window.start + 1) {
            clearInterval(indicatorInterval);
            location.reload();
            return;
        }

        updateTimeIndicatorPosition();
    }, 1000);

    // Store interval ID for cleanup
    scheduleContent.dataset.indicatorInterval = indicatorInterval;
}

function updateTimeIndicatorPosition() {
    const indicator = document.querySelector('.current-time-indicator');
    if (!indicator) return;

    const window = timeService.getVisibleWindow();
    const now = new Date();
    const currentTime = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600);
    
    // Calculate position as percentage
    const windowDuration = window.end - window.start;
    const position = ((currentTime - window.start) / windowDuration) * 100;

    // Only show if within visible window
    if (position >= 0 && position <= 100) {
        indicator.style.left = `${position}%`;
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

async function saveTankSchedule(tankName, scheduleData) {
    try {
        console.log('Saving schedule for tank:', tankName, scheduleData);
        
        // Get current schedule from localStorage or initialize new one
        let currentSchedule;
        try {
            currentSchedule = JSON.parse(localStorage.getItem('tempSchedule')) || { tanks: {} };
        } catch (e) {
            currentSchedule = { tanks: {} };
        }

        // Get process info from plating data
        const platingData = await dataService.getPlatingLineData();
        let processName = '';
        
        // Find the process for this tank
        Object.entries(platingData.processes).forEach(([_, process]) => {
            Object.entries(process.tanks).forEach(([_, tank]) => {
                if (tank.name === tankName) {
                    processName = process.name;
                }
            });
        });

        // Create or update tank schedule
        currentSchedule.tanks[tankName] = {
            process: processName,
            schedule: scheduleData
        };

        // Save to localStorage
        localStorage.setItem('tempSchedule', JSON.stringify(currentSchedule));
        console.log('Schedule saved to localStorage:', currentSchedule);
        
        // Refresh the schedule view
        await initializeSchedule();
        return true;
        
    } catch (error) {
        console.error('Error saving tank schedule:', error);
        showError('Failed to save schedule');
        return false;
    }
}

async function saveAllSchedules(scheduleData) {
    try {
        // Get plating data for process information
        const platingData = await dataService.getPlatingLineData();
        
        // Initialize schedule object
        let currentSchedule = { tanks: {} };
        
        // Update schedule for all tanks
        Object.entries(platingData.processes).forEach(([_, process]) => {
            Object.entries(process.tanks).forEach(([_, tank]) => {
                currentSchedule.tanks[tank.name] = {
                    process: process.name,
                    schedule: scheduleData
                };
            });
        });

        // Save to localStorage
        localStorage.setItem('tempSchedule', JSON.stringify(currentSchedule));
        console.log('All schedules saved to localStorage:', currentSchedule);
        
        // Refresh the schedule view
        await initializeSchedule();
        return true;
        
    } catch (error) {
        console.error('Error saving all schedules:', error);
        showError('Failed to save schedules');
        return false;
    }
}