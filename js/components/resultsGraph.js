// import { DataService } from '../services/dataService.js';

export class ResultsGraph {
    constructor() {
        // Get the canvas with the correct ID
        const canvas = document.getElementById('resultsGraph');
        if (!canvas) {
            throw new Error('Results graph canvas not found');
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Calculate center and radius
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.35;

        console.log('Creating new ResultsGraph instance');
    }

    updateGraph(data) {
        console.log('Updating graph with:', data);
        if (!data || !data.nodes) {
            console.warn('Invalid data provided to ResultsGraph');
            return;
        }

        // Clear the entire canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw base elements
        this.drawOptimalRing();
        
        // Draw data points if we have any
        if (data.nodes.length > 0) {
            this.drawDataPoints(data.nodes);
        }
        
        // Update center value and label
        this.updateCenterValue(data.centerValue, data.level, data.centerLabel);
    }

    updateCenterValue(value, level, centerLabel = '') {
        const overallValue = document.getElementById('overallValue');
        const overallLabel = document.querySelector('.overall-label');
        
        if (overallValue) {
            overallValue.textContent = Math.round(value);
        }
        
        if (overallLabel && centerLabel) {
            overallLabel.textContent = centerLabel;
        } else if (overallLabel) {
            // Fallback labels if centerLabel is not provided
            switch(level) {
                case 'line':
                    overallLabel.textContent = 'Line Efficiency';
                    break;
                case 'process':
                    overallLabel.textContent = 'Process Efficiency';
                    break;
                case 'tank':
                    overallLabel.textContent = 'Tank Efficiency';
                    break;
                case 'chemical':
                    overallLabel.textContent = 'Chemical Efficiency';
                    break;
            }
        }
    }

    drawDataPoints(nodes) {
        const angleStep = (Math.PI * 2) / nodes.length;
        
        // Draw connecting lines first (background)
        this.drawConnectingLines(nodes, angleStep);
        
        // Draw points and labels on top
        this.drawPointsAndLabels(nodes, angleStep);
    }

    drawConnectingLines(nodes, angleStep) {
        this.ctx.beginPath();
        nodes.forEach((node, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = (node.efficiency / 100) * this.radius;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            if (index === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(102, 252, 241, 0.2)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#66FCF1';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawPointsAndLabels(nodes, angleStep) {
        nodes.forEach((node, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = (node.efficiency / 100) * this.radius;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            // Draw connecting lines
            this.ctx.beginPath();
            this.ctx.strokeStyle = `${node.color}80`;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            // Draw point
            this.ctx.beginPath();
            this.ctx.fillStyle = node.color;
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw label
            const labelDistance = this.radius * 1.25;
            const labelX = this.centerX + Math.cos(angle) * labelDistance;
            const labelY = this.centerY + Math.sin(angle) * labelDistance;
            
            this.ctx.font = 'bold 14px Arial';
            const textWidth = this.ctx.measureText(node.name).width;
            
            this.ctx.fillStyle = 'rgba(30, 32, 40, 0.7)';
            this.ctx.fillRect(
                labelX - (textWidth / 2) - 6,
                labelY - 10,
                textWidth + 12,
                20
            );
            
            this.ctx.fillStyle = node.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.name, labelX, labelY);
        });
    }

    drawOptimalRing() {
        // Draw the optimal ring with slightly thicker lines
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(102, 252, 241, 0.15)';
        this.ctx.lineWidth = 2;  // Increased from 1
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw the main ring thicker
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#66FCF1';
        this.ctx.lineWidth = 2.5;  // Increased from 1.5
        this.ctx.setLineDash([]);
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Optional: Add a very subtle inner ring for depth
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(102, 252, 241, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.arc(this.centerX, this.centerY, this.radius * 0.98, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}

// Remove the automatic initialization
// Let app.js handle it instead
