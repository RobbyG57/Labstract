import { dataService } from '../services/dataService.js';

let currentPlatingData = null;

export async function initSetupPage() {
    console.log('Initializing setup page...');
    
    try {
        // Get plating line data
        currentPlatingData = dataService.getPlatingLineData();
        console.log('Loaded plating data:', currentPlatingData);

        renderSetupPage();
    } catch (error) {
        console.error('Error initializing setup page:', error);
    }
}

function renderSetupPage() {
    const mainContent = document.querySelector('#main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="setup-container">
            <div class="setup-section">
                <h2>Company Configuration</h2>
                <div class="firebase-config">
                    <label for="firebase-key">Firebase Configuration Key</label>
                    <div class="input-group">
                        <input type="text" id="firebase-key" placeholder="Enter your Firebase key">
                        <button class="save-firebase-btn">Connect</button>
                    </div>
                </div>
            </div>

            <div class="setup-section">
                <h2>Chemical Limits Configuration</h2>
                <div class="process-accordion">
                    ${renderChemicalConfigs()}
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
}

function renderChemicalConfigs() {
    if (!currentPlatingData?.processes) return '';

    return Object.entries(currentPlatingData.processes)
        .map(([processId, process]) => `
            <div class="process-section" data-process-id="${processId}">
                <div class="process-header">
                    <h3>${process.name}</h3>
                    <button class="toggle-btn">▼</button>
                </div>
                <div class="process-content">
                    ${renderTankConfigs(process.tanks)}
                </div>
            </div>
        `).join('');
}

function renderTankConfigs(tanks) {
    if (!tanks) return '';

    return Object.entries(tanks)
        .map(([tankId, tank]) => `
            <div class="tank-section" data-tank-id="${tankId}">
                <div class="tank-header">
                    <h4>${tank.name}</h4>
                    <button class="toggle-btn">▶</button>
                </div>
                <div class="tank-content">
                    <div class="chemicals-grid">
                        ${renderChemicalInputs(tank.chemicals)}
                    </div>
                </div>
            </div>
        `).join('');
}

function renderChemicalInputs(chemicals) {
    if (!chemicals) return '';

    return Object.entries(chemicals)
        .map(([chemicalId, chemical]) => `
            <div class="chemical-config" data-chemical-id="${chemicalId}">
                <div class="chemical-name">${chemical.name}</div>
                <div class="chemical-inputs">
                    <div class="input-group">
                        <label>Min (${chemical.unit})</label>
                        <input type="number" 
                               class="min-input" 
                               value="${chemical.range.min}"
                               step="0.1">
                    </div>
                    <div class="input-group">
                        <label>Optimal (${chemical.unit})</label>
                        <input type="number" 
                               class="optimal-input" 
                               value="${chemical.optimal}"
                               step="0.1">
                    </div>
                    <div class="input-group">
                        <label>Max (${chemical.unit})</label>
                        <input type="number" 
                               class="max-input" 
                               value="${chemical.range.max}"
                               step="0.1">
                    </div>
                    <button class="set-btn">Set</button>
                </div>
            </div>
        `).join('');
}

function attachEventListeners() {
    // Firebase connection handler
    const saveFirebaseBtn = document.querySelector('.save-firebase-btn');
    if (saveFirebaseBtn) {
        saveFirebaseBtn.addEventListener('click', handleFirebaseConnection);
    }

    // Process accordion toggles
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.closest('.process-section, .tank-section, .test-section');
            section.classList.toggle('expanded');
            e.target.textContent = section.classList.contains('expanded') ? '▼' : '▶';
        });
    });

    // Chemical inputs
    const chemicalInputs = document.querySelectorAll('.chemical-config input');
    chemicalInputs.forEach(input => {
        input.addEventListener('change', handleChemicalLimitChange);
    });
}

function handleFirebaseConnection() {
    const firebaseKey = document.querySelector('#firebase-key').value;
    console.log('Connecting to Firebase with key:', firebaseKey);
    // TODO: Implement actual Firebase connection
}

function handleChemicalLimitChange(e) {
    const chemicalConfig = e.target.closest('.chemical-config');
    const tankSection = e.target.closest('.tank-section');
    const processSection = e.target.closest('.process-section');

    const chemicalId = chemicalConfig.dataset.chemicalId;
    const tankId = tankSection.dataset.tankId;
    const processId = processSection.dataset.processId;

    const updates = {
        processId,
        tankId,
        chemicalId,
        values: {
            range: {
                min: parseFloat(chemicalConfig.querySelector('.min-input').value),
                max: parseFloat(chemicalConfig.querySelector('.max-input').value)
            },
            optimal: parseFloat(chemicalConfig.querySelector('.optimal-input').value)
        }
    };

    console.log('Updating chemical limits:', updates);
    // TODO: Implement actual update to backend
}

export function cleanupSetupPage() {
    console.log('Cleaning up setup page');
    currentPlatingData = null;
} 