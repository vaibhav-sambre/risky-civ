const fs = require('fs');

function doubleTechCosts(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Find TECH_TREE block and double the cost value
    // Pattern: cost: XX
    let lines = content.split('\n');
    let insideTechTree = false;

    for (let i = 0; i < lines.length; i++) {
        if (filePath.includes('server/config.js') && lines[i].includes('const TECH_TREE = {')) {
            insideTechTree = true;
        }
        if (filePath.includes('js/config.js') && lines[i].includes('export const TECH_TREE = {')) {
            insideTechTree = true;
        }

        if (insideTechTree && lines[i].trim() === '};') {
            insideTechTree = false;
        }

        if (insideTechTree && lines[i].includes('cost:')) {
            lines[i] = lines[i].replace(/cost:\s*(\d+)/, (match, p1) => {
                return `cost: ${parseInt(p1) * 2}`;
            });
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Updated tech costs in ${filePath}`);
}

doubleTechCosts('./server/config.js');
doubleTechCosts('./js/config.js');
