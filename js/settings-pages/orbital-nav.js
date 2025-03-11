import { formatName, getFullName } from '../utils/nameFormatter.js';

// Shared orbital navigation functionality
export class OrbitalNav {
    constructor(config) {
        console.log('Initializing OrbitalNav with processes:', config.processes);
        this.processes = config.processes;
        this.centerIcon = config.centerIcon;
        this.onTankSelect = config.onTankSelect;
        this.activeProcess = null;
        
        // DOM elements
        this.container = document.querySelector('.orbital-container');
        this.processOrbit = document.querySelector('.process-orbit');
        this.tankOrbit = document.querySelector('.tank-orbit');
        
        this.setupConnectingRing();
        
        // Set radius based on screen size
        this.radius = this.calculateRadius();
        
        // Wait for DOM to be fully loaded before calculating positions
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        // Add resize handler
        this.resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);

        // Add tank name display to the main container instead of orbit container
        this.tankNameDisplay = document.createElement('div');
        this.tankNameDisplay.className = 'tank-name-display';
        document.querySelector('.settings-page-container').appendChild(this.tankNameDisplay);
    }

    init() {
        console.log('Starting initialization');
        this.setupOrbits();
        this.setupEventListeners();
    }

    setupOrbits() {
        console.log('Setting up orbits');
        this.processOrbit = document.querySelector('.process-orbit');
        this.tankOrbit = document.querySelector('.tank-orbit');
        
        if (!this.processOrbit || !this.tankOrbit) {
            console.error('Orbit elements not found!');
            return;
        }
        
        this.createProcessButtons();
    }

    setupConnectingRing() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "process-ring");
        svg.style.position = "absolute";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        // Set initial position based on container size
        const centerX = this.container.offsetWidth / 2;
        const centerY = this.container.offsetHeight / 2;
        circle.setAttribute("cx", centerX);
        circle.setAttribute("cy", centerY);
        circle.setAttribute("r", this.calculateRadius());
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", "rgba(255, 255, 255, 0.15)");
        circle.setAttribute("stroke-width", "3");
        
        svg.appendChild(circle);
        this.container.insertBefore(svg, this.container.firstChild);
    }

    createProcessButtons() {
        this.processOrbit.innerHTML = '';
        
        const processes = this.processes;
        const totalProcesses = processes.length;
        
        processes.forEach((process, index) => {
            const button = document.createElement('button');
            button.className = 'orbit-btn process-btn';
            button.style.backgroundColor = process.color;
            button.innerHTML = `<span>${formatName(process.name)}</span>`;
            button.dataset.processId = process.id;
            
            // Calculate angle for even distribution (starting from top)
            const angle = ((2 * Math.PI * index) / totalProcesses) - (Math.PI / 2);
            
            // Adjust offset to half the button size (now 55px/2 = 27.5)
            const offset = 27.5;
            const x = this.centerX + (Math.cos(angle) * this.radius) - offset;
            const y = this.centerY + (Math.sin(angle) * this.radius) - offset;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'button-wrapper';
            wrapper.style.position = 'absolute';
            wrapper.style.left = `${x}px`;
            wrapper.style.top = `${y}px`;
            
            wrapper.appendChild(button);
            this.processOrbit.appendChild(wrapper);
            
            button.addEventListener('click', () => this.handleProcessClick(process, index));
            
            console.log(`Process ${process.name}: angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x.toFixed(2)}, y=${y.toFixed(2)}, color=${process.color}`);
        });
    }

    createTankButtons(tanks) {
        this.tankOrbit.innerHTML = '';
        
        // Create the tank orbit ring
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "tank-ring");
        svg.style.position = "absolute";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        const tankRadius = this.calculateRadius() * 0.85;
        circle.setAttribute("cx", this.centerX);
        circle.setAttribute("cy", this.centerY);
        circle.setAttribute("r", tankRadius);
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", "rgba(255, 255, 255, 0.15)");
        circle.setAttribute("stroke-width", "3");
        
        svg.appendChild(circle);
        this.tankOrbit.appendChild(svg);
        
        // Create tank buttons
        tanks.forEach((tank, index) => {
            const button = document.createElement('button');
            button.className = 'orbit-btn tank-btn';
            button.style.backgroundColor = '#20E3B2';
            button.innerHTML = `<span>${formatName(tank.name)}</span>`;
            button.dataset.tankId = tank.id;
            
            const angle = ((2 * Math.PI * index) / tanks.length) - (Math.PI / 2);
            const offset = 27.5;
            const x = this.centerX + (Math.cos(angle) * tankRadius) - offset;
            const y = this.centerY + (Math.sin(angle) * tankRadius) - offset;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'button-wrapper';
            wrapper.style.position = 'absolute';
            wrapper.style.left = `${x}px`;
            wrapper.style.top = `${y}px`;
            
            wrapper.appendChild(button);
            this.tankOrbit.appendChild(wrapper);
            
            button.addEventListener('click', () => this.handleTankClick(tank));
        });
        
        requestAnimationFrame(() => {
            this.tankOrbit.classList.add('visible');
        });
    }

    handleProcessClick(process, index) {
        // If clicking the same process that's already active, do nothing
        if (this.activeProcess === process.id) {
            return;
        }
        
        // Reset battery to iconic state
        const batteryIcon = document.querySelector('.battery-icon');
        if (batteryIcon) {
            batteryIcon.classList.remove('active');
            const levelElement = batteryIcon.querySelector('.battery-level');
            if (levelElement) {
                levelElement.style.fill = '#20E3B2';  // Reset to default color
            }
            const bodyElement = batteryIcon.querySelector('.battery-body');
            const terminalElement = batteryIcon.querySelector('.battery-terminal');
            if (bodyElement) bodyElement.style.stroke = '#20E3B2';
            if (terminalElement) terminalElement.style.stroke = '#20E3B2';
        }
        
        // If a different process is active, handle the transition
        if (this.activeProcess !== null) {
            // Remove old tanks with fade out
            this.tankOrbit.classList.remove('visible');
            setTimeout(() => {
                // Clear and create new tanks after fade out
                this.createTankButtons(process.tanks);
            }, 300); // Match transition duration
        } else {
            // First expansion, just create tanks
            this.expandProcess(process, index);
            this.createTankButtons(process.tanks);
        }
        
        // Update active states
        const allButtons = this.processOrbit.querySelectorAll('.process-btn');
        allButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = this.processOrbit.querySelector(`[data-process-id="${process.id}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.activeProcess = process.id;

        // Hide tank name display when switching processes
        this.tankNameDisplay.classList.remove('visible');
    }

    expandProcess(process, index) {
        // Remove active class from all buttons first
        const allButtons = this.processOrbit.querySelectorAll('.process-btn');
        allButtons.forEach(btn => btn.classList.remove('active'));
        
        // Find and activate the clicked button
        const activeButton = this.processOrbit.querySelector(`[data-process-id="${process.id}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.activeProcess = process.id;
        
        // Only expand if not already expanded
        if (!this.processOrbit.classList.contains('expanded')) {
            const currentRadius = this.calculateRadius();
            const expandedRadius = currentRadius * 1.45;
            
            const ring = document.querySelector('.process-ring circle');
            if (ring) {
                ring.style.transition = 'all 0.3s ease';
                ring.setAttribute('r', expandedRadius);
            }
            
            const wrappers = this.processOrbit.querySelectorAll('.button-wrapper');
            wrappers.forEach((wrapper, i) => {
                wrapper.style.transition = 'all 0.3s ease';
                const angle = ((2 * Math.PI * i) / wrappers.length) - (Math.PI / 2);
                const offset = 20;
                const x = this.centerX + (Math.cos(angle) * expandedRadius) - offset;
                const y = this.centerY + (Math.sin(angle) * expandedRadius) - offset;
                wrapper.style.left = `${x}px`;
                wrapper.style.top = `${y}px`;
            });
            
            this.processOrbit.classList.add('expanded');
        }
        
        // Create tank buttons regardless of expansion state
        this.createTankButtons(process.tanks);
    }

    collapseProcess() {
        console.log('Collapsing active process');
        this.activeProcess = null;
        this.processOrbit.classList.remove('expanded');
        this.tankOrbit.classList.remove('visible');
        
        // Remove active state from all buttons
        const buttons = this.processOrbit.querySelectorAll('.process-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        setTimeout(() => {
            this.tankOrbit.innerHTML = '';
        }, 300);
    }

    handleTankClick(tank) {
        // Remove active class from all tank buttons
        const allTankButtons = this.tankOrbit.querySelectorAll('.tank-btn');
        allTankButtons.forEach(btn => btn.classList.remove('active'));
        
        // Find and activate the clicked tank button
        const activeTankButton = this.tankOrbit.querySelector(`[data-tank-id="${tank.id}"]`);
        if (activeTankButton) {
            activeTankButton.classList.add('active');
        }
        
        // Update tank name display with full name
        this.tankNameDisplay.textContent = getFullName(tank.name);
        this.tankNameDisplay.classList.add('visible');
        
        // Call the tank select callback
        if (this.onTankSelect) {
            this.onTankSelect(tank);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        // Add any global event listeners here if needed
        document.addEventListener('click', (e) => {
            if (!this.processOrbit.contains(e.target) && !this.tankOrbit.contains(e.target)) {
                this.collapseProcess();
            }
        });
    }

    get centerX() {
        return this.container.offsetWidth / 2;
    }

    get centerY() {
        return this.container.offsetHeight / 2;
    }

    handleResize() {
        // Debounce the resize event
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            console.log('Handling resize...');
            this.updatePositions();
        }, 100); // Wait for 100ms after last resize event
    }
    
    updatePositions() {
        // Recalculate radius on update
        this.radius = this.calculateRadius();
        
        const processes = this.processes;
        const totalProcesses = processes.length;
        
        // Get new container dimensions
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        
        // Update ring position and size
        const ring = document.querySelector('.process-ring circle');
        if (ring) {
            ring.setAttribute('cx', centerX);
            ring.setAttribute('cy', centerY);
            ring.setAttribute('r', this.radius);
        }
        
        // Update process button positions
        const wrappers = this.processOrbit.querySelectorAll('.button-wrapper');
        wrappers.forEach((wrapper, index) => {
            const angle = ((2 * Math.PI * index) / totalProcesses) - (Math.PI / 2);
            const x = centerX + (Math.cos(angle) * this.radius) - 20; // Smaller offset for mobile
            const y = centerY + (Math.sin(angle) * this.radius) - 20;
            
            wrapper.style.left = `${x}px`;
            wrapper.style.top = `${y}px`;
        });
    }

    calculateRadius() {
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        
        // Initial radius slightly larger
        if (screenSize < 768) {
            return 90; // Increased from 80 for mobile
        }
        return 130; // Increased from 120 for larger screens
    }

    cleanup() {
        // Remove resize listener when component is destroyed
        window.removeEventListener('resize', this.resizeHandler);
    }
} 