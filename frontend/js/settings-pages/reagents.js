import { OrbitalNav } from './orbital-nav.js';
import { dataService } from '../services/dataService.js';
import { formatName, getFullName } from '../utils/nameFormatter.js';

// Reagent-specific functionality
let orbitalNav;
let currentSelectedTank = null;

// Helper function to generate random reagent level
function getRandomLevel() {
    return Math.floor(Math.random() * 100);
}

// Format plating data for orbital nav, including reagents
function formatPlatingData(platingData) {
    if (!platingData?.processes) return [];
    
    return Object.entries(platingData.processes).map(([id, process]) => {
        return {
            id,
            name: process.name,
            color: process.color,
            tanks: Object.entries(process.tanks).map(([tankId, tank]) => {
                // Get reagents and add random levels
                const reagentsList = Object.entries(tank.reagents || {}).map(([reagentId, reagent]) => ({
                    id: reagentId,
                    name: reagent.name,
                    concentration: reagent.concentration,
                    unit: reagent.unit,
                    cartridgeVolume: reagent.cartridgeVolume,
                    type: reagent.type,
                    level: getRandomLevel() // Add random level for display
                }));

                return {
                    id: tankId,
                    name: tank.name,
                    fullName: tank.name,
                    reagents: reagentsList,
                    volume: tank.volume
                };
            })
        };
    });
}

export async function initReagentPage() {
    console.log('Initializing reagent page...');
    
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
            centerIcon: 'reagent',
            onTankSelect: updateReagentDisplay,
            onProcessSelect: (process) => {
                resetReagentIcon();
                currentSelectedTank = null;
            }
        });

        // Initialize center reagent icon
        initReagentIcon();

    } catch (error) {
        console.error('Error initializing reagent page:', error);
    }
}

function initReagentIcon() {
    console.log('Initializing reagent icon');
    const centerIcon = document.querySelector('.reagent-icon');
    if (!centerIcon) {
        console.error('Center icon container not found');
        return;
    }
    
    const defaultColor = '#20E3B2';  // Default cyan color
    
    centerIcon.innerHTML = `
        <svg width="65" height="65" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Test Tube Container -->
            <path class="tube-body"
                  d="M9 3 L9 16 Q9 19 12 19 Q15 19 15 16 L15 3"
                  stroke="${defaultColor}" 
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"/>
            
            <!-- Animated Liquid -->
            <path class="reagent-level" 
                  d="M9 8 L9 16 Q9 19 12 19 Q15 19 15 16 L15 8"
                  fill="${defaultColor}" 
                  opacity="0.6">
                <animate attributeName="d"
                         dur="3s"
                         repeatCount="indefinite"
                         values="M9 8 L9 16 Q9 19 12 19 Q15 19 15 16 L15 8;
                                M9 7.5 L9 16 Q9 19 12 19 Q15 19 15 16 L15 8.5;
                                M9 8 L9 16 Q9 19 12 19 Q15 19 15 16 L15 8"
                         class="idle-animation"/>
            </path>
            
            <!-- Test Tube Top -->
            <path class="tube-top"
                  d="M7 3 L9 3 L15 3 L17 3" 
                  stroke="${defaultColor}" 
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
        </svg>
    `;
    
    centerIcon.classList.remove('active');
}

function updateReagentDisplay(tank) {
    console.log('Updating reagent display for tank:', tank);
    
    if (!tank) {
        resetReagentIcon();
        return;
    }
    
    const reagentIcon = document.querySelector('.reagent-icon');
    if (!reagentIcon) return;
    
    // Use the first chemical's level to determine the overall status
    const firstChemical = tank.chemicals && tank.chemicals[0];
    const level = firstChemical ? firstChemical.level : 100;
    const color = getStatusColor(level);
    
    updateReagentIcon(color);
    reagentIcon.classList.add('active');
    
    showReagentModal(tank);
}

function getStatusColor(level) {
    if (level >= 60) return '#20E3B2'; // Green for 60% and above
    if (level >= 20) return '#FFB302'; // Orange for 20-59%
    return '#FF4A4A';                  // Red for below 20%
}

function updateReagentIcon(color) {
    const reagentIcon = document.querySelector('.reagent-icon');
    if (!reagentIcon) return;
    
    const svgElements = reagentIcon.querySelectorAll('path, circle, rect');
    svgElements.forEach(element => {
        if (element.getAttribute('stroke')) {
            element.style.stroke = color;
        }
        if (element.getAttribute('fill') && element.getAttribute('fill') !== 'none') {
            element.style.fill = color;
        }
    });
}

function resetReagentIcon() {
    console.log('Resetting reagent icon');
    const reagentIcon = document.querySelector('.reagent-icon');
    if (!reagentIcon) return;
    
    const defaultColor = '#20E3B2';
    updateReagentIcon(defaultColor);
    reagentIcon.classList.remove('active');
}

function showReagentModal(tank) {
    const modal = document.querySelector('.reagent-modal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }

    // Update header information
    const tankNameSpan = modal.querySelector('.tank-name');
    if (tankNameSpan) {
        tankNameSpan.textContent = getFullName(tank.name);
    }
    
    const reagentsGrid = modal.querySelector('.reagents-grid');
    if (!reagentsGrid) {
        console.error('Reagents grid not found');
        return;
    }
    
    console.log('Tank reagents:', tank.reagents);
    reagentsGrid.innerHTML = '';
    
    if (!tank.reagents || tank.reagents.length === 0) {
        console.log('No reagents found for tank');
        reagentsGrid.innerHTML = '<div class="no-reagents">No reagents for this tank</div>';
        return;
    }
    
    tank.reagents.forEach(reagent => {
        const reagentContainer = document.createElement('div');
        reagentContainer.className = 'reagent-container';
        
        const color = getStatusColor(reagent.level);
        const maxHeight = 13;
        const fillHeight = (reagent.level / 100) * maxHeight;
        const fillY = 16 - fillHeight;
        
        reagentContainer.innerHTML = `
            <div class="reagent-tube">
                <svg width="65" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path class="tube-body"
                          d="M9 3 L9 16 Q9 19 12 19 Q15 19 15 16 L15 3"
                          stroke="${color}" 
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          fill="none"/>
                    
                    <path class="reagent-level" 
                          d="M9 ${fillY} L9 16 Q9 19 12 19 Q15 19 15 16 L15 ${fillY}"
                          fill="${color}" 
                          opacity="0.6">
                        <animate attributeName="d"
                                 dur="3s"
                                 repeatCount="indefinite"
                                 values="${getAnimationValues(reagent.level)}"
                                 calcMode="spline"
                                 keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
                    </path>
                    
                    <path class="tube-top"
                          d="M7 3 L9 3 L15 3 L17 3" 
                          stroke="${color}" 
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="reagent-info">
                <div class="reagent-name">${reagent.name}</div>
                <div class="reagent-details">
                    <span class="reagent-concentration">${reagent.concentration}${reagent.unit}</span>
                    <span class="reagent-level-text">${reagent.level}%</span>
                </div>
            </div>
        `;
        
        reagentsGrid.appendChild(reagentContainer);
    });
    
    modal.classList.add('visible');
    
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.remove('visible');
        });
    }
}

// Helper functions
function getStatusClass(level) {
    if (level >= 60) return 'good';
    if (level >= 20) return 'warning';
    return 'critical';
}

function getReagentPath(level) {
    // Calculate fill height (100% = full tube, 0% = empty tube)
    // The tube's usable height is 13 units (from y=3 to y=16)
    const maxHeight = 13;
    const fillHeight = maxHeight * (level / 100);
    const fillY = 16 - fillHeight; // Start from bottom (16) and go up
    
    return `M9 ${fillY} L9 16 Q9 19 12 19 Q15 19 15 16 L15 ${fillY}`;
}

function getAnimationValues(level) {
    // Calculate the base Y position based on level
    const maxHeight = 13;
    const fillHeight = maxHeight * (level / 100);
    const baseY = 16 - fillHeight;
    
    // Smaller wave amplitude for more subtle effect
    const waveHeight = 0.3;
    
    return `
        M9 ${baseY} L9 16 Q9 19 12 19 Q15 19 15 16 L15 ${baseY};
        M9 ${baseY - waveHeight} L9 16 Q9 19 12 19 Q15 19 15 16 L15 ${baseY - waveHeight};
        M9 ${baseY} L9 16 Q9 19 12 19 Q15 19 15 16 L15 ${baseY}
    `.trim();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initReagentPage);

export function cleanupReagentPage() {
    console.log('Cleaning up reagent page');
    if (orbitalNav) {
        orbitalNav.cleanup();
        orbitalNav = null;
    }
    
    // Reset the center icon
    const reagentIcon = document.querySelector('.reagent-icon');
    if (reagentIcon) {
        reagentIcon.innerHTML = '';
        reagentIcon.classList.remove('active');
    }
    
    // Close any open modals
    const modal = document.querySelector('.reagent-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
} 