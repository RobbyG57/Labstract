// Shared mock data structure
const baseMockProcesses = {
    "1737261115260": {
        name: "Preplate",
        shortName: "PP",
        color: "#FF8A4C",
        tanks: {
            "1737261200332": {
                name: "Etch 1",
                shortName: "E1",
                volume: 2200,
                batteryLevel: Math.floor(Math.random() * (95 - 65) + 65), // Random between 65-95
                chemicals: {
                    "1737265012607": {
                        name: "Chrome",
                        range: { min: 25, max: 26 },
                        optimal: 27,
                        unit: "oz/gal",
                        currentLevel: Math.floor(Math.random() * (95 - 65) + 65) // For reagent display
                    },
                    "1737265025264": {
                        name: "Sulf",
                        range: { min: 20, max: 21 },
                        optimal: 22,
                        unit: "%",
                        currentLevel: Math.floor(Math.random() * (45 - 25) + 25)
                    }
                }
            },
            "1737261234817": {
                name: "Neutralizer",
                shortName: "NT",
                volume: 1100,
                batteryLevel: Math.floor(Math.random() * (95 - 65) + 65),
                chemicals: {
                    "1737264841887": {
                        name: "HCL",
                        range: { min: 7.8, max: 8 },
                        optimal: 9,
                        unit: "N",
                        currentLevel: Math.floor(Math.random() * (85 - 55) + 55)
                    }
                }
            }
        }
    },
    "1737261133669": {
        name: "Electroless",
        shortName: "EL",
        color: "#45CAFF",
        tanks: {
            "1737261295666": {
                name: "Electroless",
                volume: 4400,
                batteryLevel: Math.floor(Math.random() * (95 - 65) + 65),
                chemicals: {
                    "1737264513277": {
                        name: "Part 1",
                        range: { min: 7.5, max: 8 },
                        optimal: 9,
                        unit: "g/L",
                        currentLevel: Math.floor(Math.random() * (75 - 45) + 45)
                    },
                    "1737264532041": {
                        name: "Part 2",
                        range: { min: 28, max: 30 },
                        optimal: 32,
                        unit: "g/L",
                        currentLevel: Math.floor(Math.random() * (35 - 15) + 15)
                    }
                }
            }
        }
    },
    "1737261143886": {
        name: "Acid Copper",
        shortName: "AC",
        color: "#22D3EE",
        tanks: {
            "1737261325853": {
                name: "Strike",
                volume: 2200,
                batteryLevel: Math.floor(Math.random() * (95 - 65) + 65),
                chemicals: {
                    "1737264435826": {
                        name: "Copper Sulfates",
                        range: { min: 30, max: 31 },
                        optimal: 32,
                        unit: "oz/gal",
                        currentLevel: Math.floor(Math.random() * (95 - 65) + 65)
                    }
                }
            }
        }
    }
};

// Export different versions for different pages
export const batteryMockData = Object.entries(baseMockProcesses).map(([id, process]) => ({
    id,
    name: process.name,
    shortName: process.shortName,
    color: process.color,
    tanks: Object.entries(process.tanks).map(([tankId, tank]) => ({
        id: tankId,
        name: tank.name,
        shortName: tank.shortName,
        batteryLevel: tank.batteryLevel
    }))
}));

export const reagentMockData = Object.entries(baseMockProcesses).map(([id, process]) => ({
    id,
    name: process.name,
    shortName: process.shortName,
    color: process.color,
    tanks: Object.entries(process.tanks).map(([tankId, tank]) => ({
        id: tankId,
        name: tank.name,
        shortName: tank.shortName,
        chemicals: Object.entries(tank.chemicals).map(([chemId, chem]) => ({
            id: chemId,
            name: chem.name,
            level: chem.currentLevel,
            unit: chem.unit,
            range: chem.range,
            optimal: chem.optimal
        }))
    }))
}));

export const cameraMockData = Object.entries(baseMockProcesses).map(([id, process]) => ({
    id,
    name: process.name,
    shortName: process.shortName,
    color: process.color,
    tanks: Object.entries(process.tanks).map(([tankId, tank]) => ({
        id: tankId,
        name: tank.name,
        shortName: tank.shortName
    }))
})); 