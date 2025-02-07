import { cacheService } from './cacheService.js';

export class DataService {
    constructor() {
        this.cache = cacheService;
        this.initialized = false;
        console.log('DataService constructed with cache:', this.cache);
        this.platingLineData = null;
        this.testResults = null;
    }

    async initialize() {
        try {
            console.log('Initializing DataService...');
            await this.cache.initialize();
            this.initialized = true;
            console.log('DataService initialization complete');
            return true;
        } catch (error) {
            console.error('Failed to initialize Data Service:', error);
            this.initialized = false;
            throw error;
        }
    }

    async loadPlatingLineData() {
        try {
            const fileUrl = '/data/Lapeer_Plating_Plastic.lbst';
            const data = await this.cache.getCachedData(fileUrl);
            if (!data) throw new Error('Failed to load plating line data from cache');
            return data;  // getCachedData already does the json parsing
        } catch (error) {
            console.error('Error loading plating line data:', error);
            throw error;
        }
    }

    async loadTestResults() {
        try {
            const fileUrl = '/data/test-results.json';
            const data = await this.cache.getCachedData(fileUrl);
            if (!data) throw new Error('Failed to load test results from cache');
            return data;  // getCachedData already does the json parsing
        } catch (error) {
            console.error('Error loading test results:', error);
            throw error;
        }
    }

    getPlatingLineData() {
        if (!this.initialized) {
            console.warn('Attempting to get data before initialization');
            return null;
        }
        return this.cache.getLineConfig();
    }

    getTestResults() {
        return this.testResults;
    }

    // Helper method to get process by ID
    getProcess(processId) {
        try {
            const platingData = this.getPlatingLineData();
            if (!platingData?.processes) {
                console.warn('No plating data available');
                return null;
            }

            console.log('Getting process data for:', processId);
            console.log('Available processes:', platingData.processes);
            
            const process = platingData.processes[processId];
            if (!process) {
                console.warn(`Process ${processId} not found`);
                return null;
            }

            return process;
        } catch (error) {
            console.error('Error getting process:', error);
            return null;
        }
    }

    // Helper method to get tank by process ID and tank ID
    getTank(processId, tankId) {
        try {
            const process = this.getProcess(processId);
            if (!process?.tanks) {
                console.warn(`No tanks found for process ${processId}`);
                return null;
            }

            console.log('Getting tank data for:', tankId);
            console.log('Available tanks:', process.tanks);
            
            const tank = process.tanks[tankId];
            if (!tank) {
                console.warn(`Tank ${tankId} not found in process ${processId}`);
                return null;
            }

            return tank;
        } catch (error) {
            console.error('Error getting tank:', error);
            return null;
        }
    }

    // Helper method to get latest results for a specific tank
    getLatestTankResults(tankId) {
        if (!this.testResults?.testResults) return null;
        
        return this.testResults.testResults
            .filter(result => result.tankId === tankId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    }

    // Get process colors from config
    async getProcessColors() {
        const config = await this.getPlatingLineConfig();
        const colors = {};
        
        Object.entries(config.processes).forEach(([id, process]) => {
            colors[id] = process.color;
        });
        
        return colors;
    }

    // Calculate process efficiency
    calculateProcessEfficiency(processId, results) {
        const processResults = results.testResults.filter(result => result.processId === processId);
        let totalEfficiency = 0;
        let measurements = 0;

        processResults.forEach(result => {
            Object.values(result.chemicals).forEach(chemical => {
                const efficiency = this.calculateChemicalEfficiency(chemical);
                totalEfficiency += efficiency;
                measurements++;
            });
        });

        return measurements > 0 ? totalEfficiency / measurements : 0;
    }

    // Calculate chemical efficiency (0-100%)
    calculateChemicalEfficiency(chemical) {
        if (!chemical.inSpec) return 0;
        
        const range = chemical.range.max - chemical.range.min;
        const optimalDistance = Math.abs(chemical.value - chemical.optimal);
        const maxDistance = range / 2;
        
        return Math.max(0, 100 * (1 - (optimalDistance / maxDistance)));
    }

    calculateEfficiency(value, optimal, min, max) {
        if (!value || !optimal || !min || !max) return 0;

        // Add range validation logging
        if (optimal < min || optimal > max) {
            console.warn('Invalid range configuration:', {
                chemical: 'Unknown',  // We don't have chemical name in this context
                optimal,
                min,
                max,
                issue: 'Optimal value outside min-max range'
            });
        }

        const range = max - min;
        const deviation = Math.abs(value - optimal);
        const maxDeviation = Math.max(optimal - min, max - optimal);
        const efficiency = Math.max(0, 100 * (1 - deviation / maxDeviation));
        
        return Math.round(efficiency);
    }

    async getProcessEfficiencies() {
        const platingData = this.getPlatingLineData();
        const results = this.getTestResults();
        
        if (!platingData || !results) return {};

        const efficiencies = {};
        Object.entries(platingData.processes).forEach(([processId, process]) => {
            let totalEfficiency = 0;
            let measurementCount = 0;

            // Calculate efficiency for each tank in the process
            Object.values(process.tanks).forEach(tank => {
                Object.values(tank.chemicals).forEach(chemical => {
                    const testResults = results.testResults.filter(r => 
                        r.processId === processId && 
                        r.chemicals[chemical.name]
                    );

                    testResults.forEach(result => {
                        const value = result.chemicals[chemical.name].value;
                        totalEfficiency += this.calculateEfficiency(
                            value,
                            chemical.optimal,
                            chemical.range.min,
                            chemical.range.max
                        );
                        measurementCount++;
                    });
                });
            });

            efficiencies[processId] = {
                efficiency: measurementCount > 0 ? totalEfficiency / measurementCount : 0,
                color: process.color,
                name: process.name
            };
        });

        return efficiencies;
    }

    async getTankEfficiencies(processId) {
        const config = this.cache.getLineConfig();
        const results = this.cache.getTestResults();
        
        if (!config || !results) return {};

        const process = config.processes[processId];
        const tankEfficiencies = {};

        Object.entries(process.tanks).forEach(([tankId, tank]) => {
            let totalEfficiency = 0;
            let measurementCount = 0;

            Object.values(tank.chemicals).forEach(chemical => {
                const testResults = results.testResults.filter(r => 
                    r.processId === processId && 
                    r.tankId === tankId && 
                    r.chemicals[chemical.name]
                );

                testResults.forEach(result => {
                    const value = result.chemicals[chemical.name].value;
                    totalEfficiency += this.calculateEfficiency(
                        value,
                        chemical.optimal,
                        chemical.range.min,
                        chemical.range.max
                    );
                    measurementCount++;
                });
            });

            tankEfficiencies[tankId] = {
                efficiency: measurementCount > 0 ? totalEfficiency / measurementCount : 0,
                name: tank.name,
                color: this.generateTankColor(process.color, Object.keys(process.tanks).length)
            };
        });

        return tankEfficiencies;
    }

    generateTankColor(baseColor, index) {
        // Generate variations of the process color for tanks
        const hsl = this.hexToHSL(baseColor);
        const step = 360 / index;
        hsl.h = (hsl.h + step) % 360;
        return this.hslToHex(hsl);
    }

    // Color utility functions
    hexToHSL(hex) {
        // ... hex to HSL conversion
    }

    hslToHex(hsl) {
        // ... HSL to hex conversion
    }

    getGraphData(level = 'line', processId = null, tankId = null, chemicalId = null) {
        try {
            const platingData = this.getPlatingLineData();
            if (!platingData?.processes) {
                console.warn('No plating data available for graph');
                return null;
            }

            let graphData;
            switch(level) {
                case 'line':
                    graphData = {
                        nodes: Object.entries(platingData.processes).map(([id, process]) => ({
                            id,
                            name: process.name,
                            color: process.color,
                            efficiency: this.getProcessEfficiency(id)
                        })),
                        centerValue: this.getLineEfficiency(),
                        centerLabel: 'Line Efficiency',
                        level: 'line'
                    };
                    break;

                case 'process':
                    const process = platingData.processes[processId];
                    if (!process) return null;

                    graphData = {
                        nodes: Object.entries(process.tanks).map(([id, tank]) => ({
                            id,
                            name: tank.name,
                            color: process.color,
                            efficiency: this.getTankEfficiency(processId, id)
                        })),
                        centerValue: this.getProcessEfficiency(processId),
                        centerLabel: `${process.name} Efficiency`,
                        level: 'process'
                    };
                    break;

                case 'tank':
                    const tank = platingData.processes[processId]?.tanks[tankId];
                    if (!tank) return null;

                    graphData = {
                        nodes: Object.entries(tank.chemicals)
                            .filter(([_, chem]) => chem.type === 'chemical')
                            .map(([id, chemical]) => ({
                                id,
                                name: chemical.name,
                                color: platingData.processes[processId].color,
                                efficiency: this.getChemicalEfficiency(processId, tankId, id)
                            })),
                        centerValue: this.getTankEfficiency(processId, tankId),
                        centerLabel: `${tank.name} Efficiency`,
                        level: 'tank'
                    };
                    break;

                case 'chemical':
                    const chemical = platingData.processes[processId]?.tanks[tankId]?.chemicals[chemicalId];
                    if (!chemical) return null;

                    const testResults = this.cache.getProcessedTestResults();
                    const testValue = testResults?.[processId]?.tanks[tankId]?.chemicals[chemical.name]?.value;
                    const unit = chemical.unit;

                    graphData = {
                        nodes: [],
                        centerValue: this.getChemicalEfficiency(processId, tankId, chemicalId),
                        centerLabel: `${chemical.name}\n${testValue}${unit}`,
                        level: 'chemical'
                    };
                    break;

                default:
                    console.warn('Invalid graph level:', level);
                    return null;
            }

            console.log('Graph Data:', graphData); // Debug output
            return graphData;

        } catch (error) {
            console.error('Error getting graph data:', error);
            return null;
        }
    }

    getLineEfficiency() {
        try {
            const processes = this.getPlatingLineData()?.processes;
            if (!processes) return 0;

            let totalEfficiency = 0;
            let count = 0;

            // Only count processes that have valid measurements
            Object.keys(processes).forEach(processId => {
                const efficiency = this.getProcessEfficiency(processId);
                if (efficiency !== null) {  // Only count valid results
                    totalEfficiency += efficiency;
                    count++;
                }
            });

            return count > 0 ? Math.round(totalEfficiency / count) : 0;
        } catch (error) {
            console.error('Error calculating line efficiency:', error);
            return 0;
        }
    }

    getProcessEfficiency(processId) {
        try {
            const testResults = this.cache.getProcessedTestResults();
            if (!testResults?.[processId]?.tanks) {
                console.warn(`No test results found for process ${processId}`);
                return null;
            }

            let totalEfficiency = 0;
            let count = 0;

            Object.keys(testResults[processId].tanks).forEach(tankId => {
                const tankEff = this.getTankEfficiency(processId, tankId);
                if (tankEff !== null) {
                    totalEfficiency += tankEff;
                    count++;
                }
            });

            return count > 0 ? Math.round(totalEfficiency / count) : null;
        } catch (error) {
            console.error('Error calculating process efficiency:', error);
            return null;
        }
    }

    getTankEfficiency(processId, tankId) {
        try {
            const testResults = this.cache.getProcessedTestResults();
            const platingData = this.getPlatingLineData();
            
            const tankResults = testResults?.[processId]?.tanks[tankId]?.chemicals;
            const tankConfig = platingData?.processes[processId]?.tanks[tankId]?.chemicals;
            
            if (!tankResults || !tankConfig) return null;

            let totalEfficiency = 0;
            let count = 0;

            // For each test result, find matching config by chemical name
            Object.entries(tankResults).forEach(([testChemName, testData]) => {
                // Find matching chemical in config by name
                const configChem = Object.values(tankConfig).find(c => c.name === testChemName);
                
                if (configChem && testData.inSpec) {
                    const efficiency = this.calculateEfficiency(
                        testData.value,
                        configChem.optimal,
                        configChem.range.min,
                        configChem.range.max
                    );
                    
                    totalEfficiency += efficiency;
                    count++;
                }
            });

            return count > 0 ? Math.round(totalEfficiency / count) : null;
        } catch (error) {
            console.error('Error in getTankEfficiency:', error);
            return null;
        }
    }

    getChemicalEfficiency(processId, tankId, chemicalId) {
        try {
            // Get config and test data
            const chemical = this.getPlatingLineData()?.processes[processId]?.tanks[tankId]?.chemicals[chemicalId];
            const testResults = this.cache.getProcessedTestResults();

            if (!chemical || !testResults) return null;

            // Direct lookup of latest result
            const testResult = testResults[processId]?.tanks[tankId]?.chemicals[chemical.name];
            
            console.log('Test Result for', chemical.name, ':', testResult);
            
            if (!testResult) return null;

            // Calculate efficiency
            const value = testResult.value;
            const optimal = chemical.optimal;
            const range = chemical.range.max - chemical.range.min;

            const distance = Math.abs(value - optimal);
            const efficiency = Math.max(0, 100 * (1 - (distance / (range / 2))));

            return Math.round(efficiency);
        } catch (error) {
            console.error('Error calculating chemical efficiency:', error);
            return null;
        }
    }

    getLatestChemicalResult(tankId, chemicalName) {
        try {
            const results = this.testResults?.testResults;
            if (!results) return null;

            // Filter results for this tank and chemical, sort by timestamp
            const tankResults = results
                .filter(r => r.tankId === tankId && r.chemicals[chemicalName])
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return tankResults[0]?.chemicals[chemicalName] || null;
        } catch (error) {
            console.error('Error getting latest chemical result:', error);
            return null;
        }
    }

    validateTank(processId, tankId) {
        try {
            const testResults = this.cache.getProcessedTestResults();
            const platingData = this.getPlatingLineData();
            
            const tank = platingData?.processes[processId]?.tanks[tankId];
            const tankResults = testResults?.[processId]?.tanks[tankId]?.chemicals;
            
            if (!tank || !tankResults) return;

            console.group(`\n=== ${tank.name} Analysis ===`);
            
            let totalEfficiency = 0;
            let chemCount = 0;

            Object.entries(tankResults).forEach(([chemName, testData]) => {
                const chemConfig = Object.values(tank.chemicals)
                    .find(c => c.name === chemName);
                
                if (chemConfig && testData.inSpec) {
                    const efficiency = this.calculateEfficiency(
                        testData.value,
                        chemConfig.optimal,
                        chemConfig.range.min,
                        chemConfig.range.max
                    );

                    totalEfficiency += efficiency;
                    chemCount++;
                }
            });

            const tankEfficiency = chemCount > 0 ? Math.round(totalEfficiency / chemCount) : 0;
            console.groupEnd();
            
            return tankEfficiency;
        } catch (error) {
            console.error('Tank validation error:', error);
            return null;
        }
    }
}

// Export a singleton instance
export const dataService = new DataService(); 