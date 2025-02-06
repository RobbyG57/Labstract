import { OrbitalNav } from './orbital-nav.js';
import { dataService } from '../services/dataService.js';
import { formatName } from '../utils/nameFormatter.js';

// Battery-specific functionality
let orbitalNav;

// Helper function to generate random battery level
function getRandomBatteryLevel() {
    return Math.floor(Math.random() * 100);
}

// Helper function to format process/tank names to 2 characters
function shortenName(name) {
    // Remove any non-alphanumeric characters and take first 2 characters
    return name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2);
}

// Format plating data for orbital nav
function formatPlatingData(platingData) {
    if (!platingData?.processes) return [];
    
    return Object.entries(platingData.processes).map(([id, process]) => {
        return {
            id,
            name: process.name,
            color: process.color,
            tanks: Object.entries(process.tanks).map(([tankId, tank]) => ({
                id: tankId,
                name: tank.name,
                batteryLevel: getRandomBatteryLevel()
            }))
        };
    });
}

export async function initBatteryPage() {
    console.log('Initializing battery page...');

    try {
        // Get plating line data
        const platingData = dataService.getPlatingLineData();
        console.log('Loaded plating data:', platingData);

        // Format data for orbital nav
        const formattedData = formatPlatingData(platingData);
        console.log('Formatted data for orbital nav:', formattedData);

        // Initialize orbital navigation
        orbitalNav = new OrbitalNav({
            processes: formattedData,
            centerIcon: 'battery',
            onTankSelect: updateBatteryDisplay
        });

        // Initialize center battery icon
        initBatteryIcon();

    } catch (error) {
        console.error('Error initializing battery page:', error);
    }
}

function initBatteryIcon() {
    console.log('Initializing battery icon');
    const centerIcon = document.querySelector('.battery-icon');
    if (!centerIcon) {
        console.error('Center icon container not found');
        return;
    }
    
    centerIcon.innerHTML = `
        <svg width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect class="battery-body" 
                  x="2" y="7" 
                  width="18" height="10" 
                  rx="2" 
                  fill="none" 
                  stroke="#20E3B2" 
                  stroke-width="2"/>
            <path class="battery-terminal" 
                  d="M22 11v2" 
                  stroke="#20E3B2" 
                  stroke-width="2" 
                  stroke-linecap="round"/>
            <rect class="battery-level" 
                  x="4" y="9" 
                  width="14" height="6" 
                  fill="#20E3B2"/>
        </svg>
    `;
}

function updateBatteryDisplay(tank) {
    console.log('Updating battery display for tank:', tank);
    
    const batteryLevel = tank.batteryLevel;
    const batteryIcon = document.querySelector('.battery-icon');
    
    if (!batteryIcon) {
        console.error('Battery icon not found');
        return;
    }
    
    // Make sure we have the SVG before trying to update it
    if (!batteryIcon.querySelector('svg')) {
        initBatteryIcon();
    }
    
    const levelElement = batteryIcon.querySelector('.battery-level');
    if (!levelElement) {
        console.error('Battery level element not found');
        return;
    }
    
    // Calculate width based on percentage
    const maxWidth = 14;
    const width = (batteryLevel / 100) * maxWidth;
    
    // Update battery level visual
    levelElement.setAttribute('width', width);
    
    // Update color based on new thresholds with brighter green
    let color;
    if (batteryLevel > 50) {
        color = '#4CD964';  // iOS-style bright green
    }
    else if (batteryLevel > 20) color = '#FFB800';  // Orange for 20-50%
    else color = '#FF3B30';                         // Red for < 20%
    
    // Force the color application
    levelElement.style.fill = color;
    levelElement.setAttribute('fill', color);
    
    const bodyElement = batteryIcon.querySelector('.battery-body');
    const terminalElement = batteryIcon.querySelector('.battery-terminal');
    
    if (bodyElement) {
        bodyElement.style.stroke = color;
        bodyElement.setAttribute('stroke', color);
    }
    if (terminalElement) {
        terminalElement.style.stroke = color;
        terminalElement.setAttribute('stroke', color);
    }
    
    batteryIcon.classList.add('active');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initBatteryPage); 