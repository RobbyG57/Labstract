import { handlePower, setPowerState, getPowerState } from './power.js';
import { handleSnapshot } from './snapshot.js';
import { initializeNavigation, updateNavDots } from './navigation.js';
import { dataService } from './services/dataService.js';
import { cacheService } from './services/cacheService.js';
import { initializeSchedule } from './schedule.js';

// Global state
let isNavigating = false;
let buttonsInitialized = false;
window.isNavigating = false; // Make it available globally

// Make handlers available globally
window.handlePower = handlePower;
window.handleSnapshot = handleSnapshot;
window.loadPage = loadPage;

// Add hash change listener at the top with other event listeners
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    console.log('Hash changed to:', hash);
    loadPage(hash || 'home');
});

async function handleBackButton() {
    if (isNavigating) {
        console.log('Navigation in progress, ignoring back button');
        return;
    }
    
    try {
        isNavigating = true;
        // Simple version - just go home
        window.location.hash = '';
        await loadPage('home');
        setPowerState(getPowerState());
        updateHeader('home');
        updateNavDots('home');
    } catch (error) {
        console.error('Error handling back button:', error);
    } finally {
        isNavigating = false;
    }
}

function initializeButtons() {
    if (buttonsInitialized) {
        console.log('Buttons already initialized, skipping...');
        return;
    }
    
    console.log('Initializing buttons...');
    
    // Power and snapshot buttons
    const powerButton = document.querySelector('.action-button.power');
    const snapshotButton = document.querySelector('.action-button.snapshot');
    
    // Navigation buttons on home page
    const resultsButton = document.querySelector('.action-button.results');
    const scheduleButton = document.querySelector('.action-button.schedule');
    const settingsButton = document.querySelector('.action-button.settings');
    
    if (powerButton) {
        powerButton.addEventListener('click', () => {
            console.log('Power button clicked, current state:', getPowerState());
            handlePower();
        });
    }
    
    if (snapshotButton) {
        snapshotButton.addEventListener('click', (e) => {
            console.log('Snapshot button clicked');
            e.preventDefault();
            handleSnapshot();
        });
    }
    
    // Add navigation handlers for home page buttons
    if (resultsButton) {
        resultsButton.addEventListener('click', () => {
            console.log('Results button clicked');
            loadPage('results');
        });
    }
    
    if (scheduleButton) {
        scheduleButton.addEventListener('click', () => {
            console.log('Schedule button clicked');
            if (!getPowerState()) { // Only navigate if power is ON
                loadPage('schedule');
            }
        });
    }
    
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            console.log('Settings button clicked');
            loadPage('settings');
        });
    }
    
    // Apply initial power state
    setPowerState(getPowerState());
    
    buttonsInitialized = true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize services
        await Promise.all([
            dataService.initialize(),
            cacheService.initialize()
        ]);
        
        // Initialize navigation
        initializeNavigation();
        
        // Initialize back button
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', handleBackButton);
        }

        // Load home page
        await loadPage('home');
        setPowerState(getPowerState());
        
        // Initialize the home page dot as active
        const homeDot = document.querySelector('.dot[data-page="home"]');
        if (homeDot) homeDot.classList.add('active');
        
        updateHeader('home');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});

async function loadPage(pageName) {
    if (isNavigating) {
        console.log('Navigation already in progress, skipping...');
        return;
    }
    
    isNavigating = true;
    console.log('Attempting to fetch', `views/${pageName}.html`);
    
    try {
        // Load common settings-pages CSS if not already loaded
        const commonCssId = 'css-settings-pages';
        if (!document.getElementById(commonCssId)) {
            console.log('Loading common settings pages CSS');
            const commonLink = document.createElement('link');
            commonLink.id = commonCssId;
            commonLink.rel = 'stylesheet';
            commonLink.href = 'css/settings-pages.css';
            document.head.appendChild(commonLink);
        }
        
        // Load page-specific CSS if needed
        if (pageName.startsWith('settings/')) {
            const settingType = pageName.split('/')[1];
            
            // Load page-specific CSS if needed
            const cssId = `css-settings-${settingType}`;
            if (!document.getElementById(cssId)) {
                console.log('Loading CSS for settings page:', settingType);
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = `css/settings-${settingType}.css`;
                document.head.appendChild(link);
            }
        }

        const response = await fetch(`views/${pageName}.html`);
        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
        const content = await response.text();
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            throw new Error('Main content container not found');
        }

        // Store current power state before updating content
        const currentPowerState = getPowerState();
        console.log('Current power state before content update:', currentPowerState);
        
        mainContent.innerHTML = content;
        
        console.log(pageName, 'page loaded into DOM');
        
        // Initialize appropriate pages
        if (pageName === 'home') {
            console.log('Initializing home page...');
            buttonsInitialized = false;
            initializeButtons();
            
            // Debug: Check if main-circle exists
            const mainCircle = document.querySelector('.main-circle');
            console.log('Main circle element:', mainCircle);
            
            // Debug: Check power state
            console.log('Power state when loading home:', getPowerState());
            
            // Force update UI based on power state
            setPowerState(getPowerState());
        } else if (pageName === 'results') {
            console.log('Loading results page...');
            try {
                const { initializeResults } = await import('./results.js');
                await initializeResults();
            } catch (moduleError) {
                console.error('Error loading results module:', moduleError);
                // Try with a different path
                try {
                    const { initializeResults } = await import('../js/results.js');
                    await initializeResults();
                } catch (secondError) {
                    console.error('Failed to load results module with alternate path:', secondError);
                }
            }
        } else if (pageName === 'schedule') {
            console.log('Loading schedule page...');
            try {
                const { initializeSchedule } = await import('./schedule.js');
                await initializeSchedule();
            } catch (moduleError) {
                console.error('Error loading schedule module:', moduleError);
                // Try with a different path
                try {
                    const { initializeSchedule } = await import('../js/schedule.js');
                    await initializeSchedule();
                } catch (secondError) {
                    console.error('Failed to load schedule module with alternate path:', secondError);
                }
            }
        } else if (pageName === 'settings') {
            console.log('Loading settings page...');
            try {
                const { initializeSettings } = await import('./settings.js');
                await initializeSettings();
            } catch (moduleError) {
                console.error('Error loading settings module:', moduleError);
                // Try with a different path
                try {
                    const { initializeSettings } = await import('../js/settings.js');
                    await initializeSettings();
                } catch (secondError) {
                    console.error('Failed to load settings module with alternate path:', secondError);
                }
            }
        } else if (pageName.startsWith('settings/')) {
            console.log('Loading settings sub-page:', pageName);
            const settingType = pageName.split('/')[1];
            if (settingType === 'users') {
                const { initializeUsersPage } = await import('./settings-pages/users.js');
                await initializeUsersPage();
            } else if (settingType === 'camera') {
                const { initCameraPage } = await import('./settings-pages/camera.js');
                await initCameraPage();
            } else if (settingType === 'battery') {
                const { initBatteryPage } = await import('./settings-pages/battery.js');
                await initBatteryPage();
            } else if (settingType === 'reagents') {
                const { initReagentPage } = await import('./settings-pages/reagents.js');
                await initReagentPage();
            } else if (settingType === 'setup') {
                const { initSetupPage } = await import('./settings-pages/setup.js');
                await initSetupPage();
            } else if (settingType === 'support') {
                const { initSupportPage } = await import('./settings-pages/support.js');
                await initSupportPage();
            }
        }

        // Update navigation using the base page name for dots
        const basePage = pageName.split('/')[0];
        updateNavDots(basePage);
        updateHeader(pageName);
        
        // Update URL hash if needed
        if (window.location.hash.slice(1) !== pageName) {
            window.location.hash = pageName;
        }
        
        return true;
    } catch (error) {
        console.error('Error loading page:', error);
        return false;
    } finally {
        isNavigating = false;
    }
}

function updateHeader(pageName) {
    const backButton = document.querySelector('.back-button-container');
    const pageIcon = document.querySelector('.page-icon');
    const pageTitle = document.querySelector('.page-title');
    
    // Check if elements exist before updating
    if (!backButton || !pageIcon || !pageTitle) {
        console.warn('Header elements not found, skipping header update');
        return;
    }
    
    // Show/hide back button based on page
    backButton.style.visibility = pageName === 'home' ? 'hidden' : 'visible';
    
    // Handle both main pages and settings sub-pages
    if (pageName.startsWith('settings/')) {
        const settingType = pageName.split('/')[1];
        pageTitle.textContent = settingType.charAt(0).toUpperCase() + settingType.slice(1);
        pageIcon.src = `assets/${settingType}-icon.svg`;
    } else {
        // Handle main pages
        switch(pageName) {
            case 'home':
                pageTitle.textContent = 'LabStract';
                pageIcon.src = 'assets/lab-icon.svg';
                break;
            case 'results':
                pageTitle.textContent = 'Results';
                pageIcon.src = 'assets/results-icon.svg';
                break;
            case 'schedule':
                pageTitle.textContent = 'Schedule';
                pageIcon.src = 'assets/schedule-icon.svg';
                break;
            case 'settings':
                pageTitle.textContent = 'Settings';
                pageIcon.src = 'assets/settings-icon.svg';
                break;
        }
    }
}

// When loading home page
async function loadHomePage() {
    await loadPage('home');
    setPowerState(getPowerState());
    updateHeader('home');
    updateNavDots('home');
}

// Update the settings.js click handlers to use hash navigation
// in lab_web_app_frontend/js/settings.js
function loadSettingPage(settingType) {
    window.location.hash = `settings/${settingType}`;
}

// Also update the hashchange listener at the top level
window.removeEventListener('hashchange', handleHashChange);
window.addEventListener('hashchange', handleHashChange);

function handleHashChange() {
    if (!isNavigating) {
        const hash = window.location.hash.slice(1);
        loadPage(hash || 'home');
    }
}