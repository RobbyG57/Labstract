export class CacheService {
    constructor() {
        this.CACHE_NAME = 'labstract-data-v1';  // Match the name in sw.js
        this.urlsToCache = [
            '/lab_web_app_frontend/data/Lapeer_Plating_Plastic.lbst',
            '/lab_web_app_frontend/data/test-results.json'
        ];
        this.lineConfig = null;
        this.testResults = null;
        this.processedTestResults = null; // New property for processed data
    }

    async initialize() {
        try {
            const [configResponse, resultsResponse] = await Promise.all([
                fetch('/lab_web_app_frontend/data/Lapeer_Plating_Plastic.lbst'),
                fetch('/lab_web_app_frontend/data/test-results.json')
            ]);

            this.lineConfig = await configResponse.json();
            const results = await resultsResponse.json();
            
            // Only log data load confirmation
            console.log('Data loaded successfully');
            
            this.setTestResults(results);
            return true;
        } catch (error) {
            console.error('Failed to initialize CacheService:', error);
            throw error;
        }
    }

    async cacheFiles() {
        if (!('caches' in window)) {
            console.warn('Cache API not supported');
            return false;
        }

        try {
            const cache = await caches.open(this.CACHE_NAME);
            
            for (const url of this.urlsToCache) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    await cache.put(url, response);
                } catch (error) {
                    console.error(`Failed to cache: ${url}`, error);
                }
            }
            return true;
        } catch (error) {
            console.error('Cache error:', error);
            return false;
        }
    }

    async getCachedData(url) {
        if (!('caches' in window)) {
            throw new Error('Cache API not supported');
        }

        try {
            const cache = await caches.open(this.CACHE_NAME);
            const response = await cache.match(url);
            if (!response) throw new Error('Data not found in cache');
            return await response.json();
        } catch (error) {
            console.error('Cache retrieval error:', error);
            throw error;
        }
    }

    getLineConfig() {
        return this.lineConfig;
    }

    getTestResults() {
        return this.testResults;
    }

    getProcessedTestResults() {
        return this.processedTestResults;
    }

    setTestResults(results) {
        this.testResults = results;
        this.processedTestResults = this.processTestResults(results);
    }

    processTestResults(results) {
        if (!results?.testResults) {
            return null;
        }

        const processed = {};

        results.testResults.forEach(result => {
            const { processId, tankId } = result;
            
            if (!processed[processId]) {
                processed[processId] = { tanks: {} };
            }

            if (!processed[processId].tanks[tankId]) {
                processed[processId].tanks[tankId] = { chemicals: {} };
            }

            Object.entries(result.chemicals).forEach(([chemName, data]) => {
                processed[processId].tanks[tankId].chemicals[chemName] = {
                    ...data,
                    timestamp: result.timestamp
                };
            });
        });

        return processed;
    }
}

// Export a singleton instance
export const cacheService = new CacheService(); 