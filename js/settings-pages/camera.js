import { OrbitalNav } from './orbital-nav.js';
import { dataService } from '../services/dataService.js';
import { getFullName } from '../utils/nameFormatter.js';

// Camera-specific functionality
let orbitalNav;

// Format plating data for orbital nav
function formatPlatingData(platingData) {
    if (!platingData?.processes) return [];
    
    return Object.entries(platingData.processes).map(([id, process]) => {
        return {
            id,
            name: process.name, // Pass full name, OrbitalNav will format it
            color: process.color,
            tanks: Object.entries(process.tanks).map(([tankId, tank]) => ({
                id: tankId,
                name: tank.name, // Pass full name, OrbitalNav will format it
            }))
        };
    });
}

export async function initCameraPage() {
    console.log('Initializing camera page...');

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
            centerIcon: 'camera',
            onTankSelect: handleCameraView
        });

        // Initialize center camera icon
        initCameraIcon();

    } catch (error) {
        console.error('Error initializing camera page:', error);
    }
}

function initCameraIcon() {
    console.log('Initializing camera icon');
    const centerIcon = document.querySelector('.camera-icon');
    if (!centerIcon) {
        console.error('Center icon container not found');
        return;
    }
    
    centerIcon.innerHTML = `
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="camera-body" 
                  d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" 
                  stroke="#20E3B2" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"/>
            <path class="camera-lens" 
                  d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" 
                  stroke="#20E3B2" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"/>
        </svg>
    `;
}

function handleCameraView(tank) {
    console.log('Opening camera view for tank:', tank);
    
    const cameraIcon = document.querySelector('.camera-icon');
    if (!cameraIcon) {
        console.error('Camera icon not found');
        return;
    }
    
    // Make sure we have the SVG before trying to update it
    if (!cameraIcon.querySelector('svg')) {
        initCameraIcon();
    }
    
    // Update camera icon state
    const bodyElement = cameraIcon.querySelector('.camera-body');
    const lensElement = cameraIcon.querySelector('.camera-lens');
    
    if (bodyElement) bodyElement.style.stroke = '#20E3B2';
    if (lensElement) lensElement.style.stroke = '#20E3B2';
    
    cameraIcon.classList.add('active');
    
    // Show camera modal
    const modal = document.querySelector('.camera-modal');
    if (modal) {
        // Update modal title with full tank name
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = `Camera Feed - ${getFullName(tank.name)}`;
        }
        
        modal.classList.add('visible');
        
        // Add event listeners for controls
        const closeBtn = modal.querySelector('.close-btn');
        const startBtn = modal.querySelector('.start-btn');
        const stopBtn = modal.querySelector('.stop-btn');
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.remove('visible');
            cameraIcon.classList.remove('active');
        });
        
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Starting camera feed for tank:', getFullName(tank.name));
            // Add camera start logic here
        });
        
        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Stopping camera feed for tank:', getFullName(tank.name));
            // Add camera stop logic here
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initCameraPage); 