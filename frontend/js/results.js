import { ResultsGraph } from '/js/components/resultsGraph.js';
import { dataService } from '/js/services/dataService.js';


let resultsGraph;

async function initializeResults() {
    try {
        
        // Create new ResultsGraph instance without passing canvas
        resultsGraph = new ResultsGraph();
        
        // Ensure DataService is initialized
        if (!dataService.initialized) {
            await dataService.initialize();
        }

        const graphData = dataService.getGraphData();
        if (!graphData) {
            console.warn('No graph data available');
            return;
        }

        resultsGraph.updateGraph(graphData);
        
        initializeSelections();
        setupNavListeners();

    } catch (error) {
        console.error('\n Error initializing results:', error);
    }
}

async function initializeSelections() {
    
    // Clear existing content
    const container = document.querySelector('.results-container');
    const existingSection = document.getElementById('process-section');
    if (existingSection) {
        existingSection.remove();
    }
    
    // Create new process view
    const processSection = document.createElement('div');
    processSection.id = 'process-section';
    processSection.className = 'section-content active';
    
    const processGrid = document.createElement('div');
    processGrid.className = 'process-grid';
    
    // Get processes from DataService
    const platingData = dataService.getPlatingLineData();
    if (!platingData?.processes) {
        console.error('No process data available');
        return;
    }
    
    Object.entries(platingData.processes).forEach(([processId, process]) => {
        const button = document.createElement('button');
        button.className = 'process-button';
        button.textContent = process.name;
        button.onclick = () => {
            selectProcess(processId, process);
            showTankView(processId);
        };
        processGrid.appendChild(button);
    });
    
    processSection.appendChild(processGrid);
    container.appendChild(processSection);
    
    // Ensure process is active initially
    updateNavIcons('process');
}

async function showTankView(processId) {
    // Update navigation state BEFORE creating the view
    updateNavIcons('tank');
    
    const processSection = document.getElementById('process-section');
    const tankGrid = document.createElement('div');
    tankGrid.className = 'process-grid';
    
    // Get tanks from DataService
    const process = dataService.getProcess(processId);
    if (!process?.tanks) {
        console.error('No tank data available for process:', processId);
        return;
    }
    
    Object.entries(process.tanks).forEach(([tankId, tank]) => {
        const button = document.createElement('button');
        button.className = 'process-button';
        button.textContent = tank.name;
        button.onclick = () => {
            selectTank(processId, tankId);
            showChemicalView(processId, tankId);
        };
        tankGrid.appendChild(button);
    });

    // Animate transition
    processSection.style.opacity = '0';
    setTimeout(() => {
        processSection.innerHTML = '';
        processSection.appendChild(tankGrid);
        processSection.style.opacity = '1';
    }, 300);
}

async function showChemicalView(processId, tankId) {
    // Update navigation state BEFORE creating the view
    updateNavIcons('chemical');
    
    const processSection = document.getElementById('process-section');
    const chemicalGrid = document.createElement('div');
    chemicalGrid.className = 'process-grid';
    
    // Get chemicals from DataService
    const tank = dataService.getTank(processId, tankId);
    if (!tank?.chemicals) {
        console.error('No chemical data available for tank:', tankId);
        return;
    }
    
    Object.entries(tank.chemicals).forEach(([chemicalId, chemical]) => {
        const button = document.createElement('button');
        button.className = 'process-button';
        button.textContent = chemical.name;
        button.onclick = () => selectChemical(processId, tankId, chemicalId);
        chemicalGrid.appendChild(button);
    });

    // Animate transition
    processSection.style.opacity = '0';
    setTimeout(() => {
        processSection.innerHTML = '';
        processSection.appendChild(chemicalGrid);
        processSection.style.opacity = '1';
    }, 300);
}

let currentProcess = null;
let currentTank = null;
let currentChemical = null;

async function selectProcess(processId, process) {
    currentProcess = processId;
    currentTank = null;
    currentChemical = null;
    
    // Update graph with process-level view
    const graphData = await dataService.getGraphData('process', processId);
    if (resultsGraph && graphData) {
        resultsGraph.updateGraph(graphData);
    }
}

async function selectTank(processId, tankId) {
    currentTank = tankId;
    currentChemical = null;
    
    // Update graph with tank-level view
    const graphData = await dataService.getGraphData('tank', processId, tankId);
    if (resultsGraph && graphData) {
        resultsGraph.updateGraph(graphData);
    }
}

async function selectChemical(processId, tankId, chemicalId) {
    currentChemical = chemicalId;
    
    // Update graph with chemical-level view
    const graphData = await dataService.getGraphData('chemical', processId, tankId, chemicalId);
    if (resultsGraph && graphData) {
        resultsGraph.updateGraph(graphData);
    }
}

// Add this function to handle back navigation
function handleNavIconClick(section) {
    
    switch(section) {
        case 'process':
            currentTank = null;
            currentProcess = null;
            
            // Get initial line-level graph data
            const graphData = dataService.getGraphData();
            if (resultsGraph && graphData) {
                resultsGraph.updateGraph(graphData);
            }
            
            const processSection = document.getElementById('process-section');
            if (processSection) {
                initializeSelections();
            } else {
                console.log('Process section not found');
            }
            break;
        case 'tank':
            if (currentProcess) {
                showTankView(currentProcess);
            }
            break;
        case 'chemical':
            if (currentTank) {
                showChemicalView(currentProcess, currentTank);
            }
            break;
    }
    updateNavIcons(section);
}

// Move event listener setup to a function we can call after updates
function setupNavListeners() {
    const navIcons = document.querySelectorAll('.nav-icon');
    navIcons.forEach(icon => {
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);
        
        newIcon.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Navigation logic
            if (section === 'process') {
                // Always allow going back to process
                handleNavIconClick(section);
            }
            else if (section === 'tank' && currentProcess) {
                // Only allow tank view if process is selected
                handleNavIconClick(section);
            }
            else if (section === 'chemical' && currentTank) {
                // Only allow chemical view if tank is selected
                handleNavIconClick(section);
            }
        });
    });
}

function updateNavIcons(activeSection) {
    const icons = document.querySelectorAll('.nav-icon');
    
    icons.forEach(icon => {
        const section = icon.dataset.section;
        const imgElement = icon.querySelector('img');
        
        if (section === activeSection) {
            imgElement.src = `/assets/icons/${section}-active.svg`;
        } else {
            imgElement.src = `/assets/${section}-icon.svg`;
        }
    });
    
    // Reattach event listeners after updating icons
    setupNavListeners();
}

// Add this new function to initialize icons
function initializeNavIcons() {
    const icons = document.querySelectorAll('.nav-icon');
    icons.forEach(icon => {
        const section = icon.dataset.section;
        const img = icon.querySelector('.icon-img');
        
        // Set initial icon state
        if (icon.classList.contains('active')) {
            img.src = `assets/icons/${section}-active.svg`;
        } else {
            img.src = `assets/icons/${section}.svg`;
        }
    });
}

// Make sure your HTML has the correct data attributes:
// <div class="nav-icon" data-section="process">...</div>
// <div class="nav-icon" data-section="tank">...</div>
// <div class="nav-icon" data-section="chemical">...</div>

function initializeSubNav() {
    const subIcons = document.querySelectorAll('.sub-icon');
    const views = document.querySelectorAll('.selection-view');
    
    subIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const section = icon.dataset.section;
            
            // Update icons
            subIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            
            // Update views
            views.forEach(view => {
                view.classList.remove('active');
                if (view.classList.contains(`${section}-view`)) {
                    view.classList.add('active');
                }
            });
        });
    });
}
// Make sure to call setupNavListeners after initial load
document.addEventListener('DOMContentLoaded', () => {
    setupNavListeners();
}); 

// Only export once at the bottom
export { initializeResults }; 
 

