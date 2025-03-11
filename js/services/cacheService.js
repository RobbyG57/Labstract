export class CacheService {
    constructor() {
        this.CACHE_NAME = 'labstract-data-v1';  // Match the name in sw.js
        this.urlsToCache = [
            '../data/Lapeer_Plating_Plastic.lbst',
            '../data/test-results.json'
        ];
        this.lineConfig = null;
        this.testResults = null;
        this.processedTestResults = null; // New property for processed data
    }

    async initialize() {
        try {
            // Try with the current paths first
            let configResponse, resultsResponse;
            
            try {
                [configResponse, resultsResponse] = await Promise.all([
                    fetch('./data/Lapeer_Plating_Plastic.lbst'),
                    fetch('./data/test-results.json')
                ]);
            } catch (error) {
                console.log('Failed with ./data/ path, trying with /Labstract/labstract-frontend/data/ path');
                // Try with GitHub Pages path
                [configResponse, resultsResponse] = await Promise.all([
                    fetch('/Labstract/labstract-frontend/data/Lapeer_Plating_Plastic.lbst'),
                    fetch('/Labstract/labstract-frontend/data/test-results.json')
                ]);
            }
            
            // If we still don't have valid responses, try one more path format
            if (!configResponse.ok || !resultsResponse.ok) {
                console.log('Failed with GitHub Pages path, trying with relative path');
                [configResponse, resultsResponse] = await Promise.all([
                    fetch('data/Lapeer_Plating_Plastic.lbst'),
                    fetch('data/test-results.json')
                ]);
            }

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
            console.warn('Cache API not supported, fetching directly');
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Direct fetch error:', error);
                throw error;
            }
        }

        try {
            // Try to get from cache first
            const cache = await caches.open(this.CACHE_NAME);
            let response = await cache.match(url);
            
            // If not in cache or cache fails, fetch directly
            if (!response) {
                console.log('Data not found in cache, fetching directly:', url);
                response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                // Store in cache for future use
                await cache.put(url, response.clone());
            }
            
            return await response.json();
        } catch (error) {
            console.error('Cache retrieval error:', error);
            
            // Final fallback: try direct fetch without caching
            try {
                console.log('Trying direct fetch as fallback for:', url);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (fetchError) {
                console.error('Direct fetch fallback error:', fetchError);
                throw error; // Throw the original error
            }
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