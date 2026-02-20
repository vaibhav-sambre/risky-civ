const fs = require('fs');

function updateEconomy(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Triple Upkeep
    content = content.replace(/(TROOP_UPKEEP_COST\s*=\s*)[\d\.]+;/g, '$11.5;');

    // 2. Double playing card costs
    let lines = content.split('\n');
    let cardsUpdated = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("type: 'bonus'") && lines[i].includes("cost: ")) {
            lines[i] = lines[i].replace(/cost:\s*(\d+)/, (match, p1) => {
                cardsUpdated++;
                return `cost: ${parseInt(p1) * 2}`;
            });
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Updated ${filePath}`);
    console.log(` -> Tripled troop upkeep to 1.5`);
    console.log(` -> Doubled cost of ${cardsUpdated} bonus cards`);
}

updateEconomy('./server/config.js');
updateEconomy('./js/config.js');
