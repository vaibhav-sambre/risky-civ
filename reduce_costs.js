const fs = require('fs');

function reduceCosts(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');

    let inTechTree = false;
    let inBonusCards = false;

    for (let i = 0; i < lines.length; i++) {
        // Track blocks
        if (lines[i].includes('TECH_TREE = {')) inTechTree = true;
        if (inTechTree && lines[i].trim() === '};') inTechTree = false;

        if (lines[i].includes('BONUS_CARDS = [')) inBonusCards = true;
        if (inBonusCards && lines[i].trim() === '];') inBonusCards = false;

        // 1. Reduce all tech costs by 25%
        if (inTechTree && lines[i].includes('cost:')) {
            lines[i] = lines[i].replace(/cost:\s*(\d+)/, (match, p1) => {
                const oldCost = parseInt(p1);
                // Reduce by 25% and round to nearest integer avoiding strange decimals
                const newCost = Math.ceil(oldCost * 0.75);
                return `cost: ${newCost}`;
            });
        }

        // 2. Reduce the cost of research cards by 25%
        if (inBonusCards && lines[i].includes("category: 'research'") && lines[i].includes('cost:')) {
            lines[i] = lines[i].replace(/cost:\s*(\d+)/, (match, p1) => {
                const oldCost = parseInt(p1);
                const newCost = Math.ceil(oldCost * 0.75);
                return `cost: ${newCost}`;
            });
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Updated ${filePath}`);
}

reduceCosts('./server/config.js');
reduceCosts('./js/config.js');
