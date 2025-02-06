export function formatName(name, maxLength = 3) {
    if (!name) return '';
    
    // Split into words
    const words = name.trim().split(' ');
    
    // If single word and within max length, return as is
    if (words.length === 1 && name.length <= maxLength) {
        return name;
    }
    
    // Extract number if exists
    const lastWord = words[words.length - 1];
    const hasNumber = !isNaN(lastWord);
    const number = hasNumber ? lastWord : '';
    
    // Special cases mapping
    const specialCases = {
        'copper': 'Cu',
        'electroless': 'El',
        'acid': 'A',
        'bright': 'Br',
        'semi': 'S',
        'micro': 'Mc',
        'satin': 'St'
    };
    
    // Create abbreviation
    let abbr = words
        .slice(0, hasNumber ? -1 : undefined)
        .map(word => {
            const lowerWord = word.toLowerCase();
            if (specialCases[lowerWord]) {
                return specialCases[lowerWord];
            }
            return word[0].toUpperCase();
        })
        .join('');
    
    // Add number if exists
    if (number) {
        abbr += number;
    }
    
    // Ensure final length is within max
    return abbr.substring(0, maxLength);
}

// Map of abbreviated names to full names
export const fullNameMap = {
    'AD': 'Acid Dip',
    'SB1': 'Semi Bright 1',
    'SB2': 'Semi Bright 2',
    'SB3': 'Semi Bright 3',
    'ST1': 'Satin 1',
    'ST2': 'Satin 2',
    'MC': 'Micro',
    'BR': 'Bright',
    'Cu': 'Copper',
    'El': 'Electroless'
};

export function getFullName(abbr) {
    return fullNameMap[abbr] || abbr;
} 