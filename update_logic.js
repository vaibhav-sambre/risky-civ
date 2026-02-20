const fs = require('fs');

function processFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    if (content !== original) {
        fs.writeFileSync(path, content, 'utf8');
        console.log(`Updated ${path}`);
    } else {
        console.log(`No changes made to ${path}`);
    }
}

// 1. server/state.js
processFile('./server/state.js', [
    [
        "if (player.techUnlocked.includes('sci_t2')) max = 4;",
        "if (player.techUnlocked.includes('sci_t2') && !hasEffect(state, state.currentPlayer, 'cyberattack')) max = 4;\n    if (player.techUnlocked.includes('sci_t5') && !hasEffect(state, state.currentPlayer, 'cyberattack')) max = 5;"
    ]
]);

// 2. server/resources.js
let resChanges = [
    // eco_t2, eco_t1
    [/player\.techUnlocked\.includes\('eco_t2'\)/g, "(player.techUnlocked.includes('eco_t2') && !hasEffect(state, playerId, 'cyberattack'))"],
    [/player\.techUnlocked\.includes\('eco_t1'\)/g, "(player.techUnlocked.includes('eco_t1') && !hasEffect(state, playerId, 'cyberattack'))"],
    [/player\.techUnlocked\.includes\('eco_t4'\)/g, "(player.techUnlocked.includes('eco_t4') && !hasEffect(state, playerId, 'cyberattack'))"],

    // eco_t5 Banking Guild
    [
        "mon += bankCount * STRUCTURES.bank.bonus.money;",
        "const bankBase = player.techUnlocked.includes('eco_t5') && !hasEffect(state, playerId, 'cyberattack') ? 4 : STRUCTURES.bank.bonus.money;\n        mon += bankCount * bankBase;"
    ],

    // sci_t6 Scientific Method
    [
        "player.resources.research += resTotal;",
        "if (player.techUnlocked.includes('sci_t6') && !hasEffect(state, playerId, 'cyberattack')) resTotal *= 2;\n    player.resources.research += resTotal;"
    ],

    // eco_t7 Industrial Espionage (Adding to end of collectResources)
    [
        "addLog(state, `${player.name} collected +${prodTotal} ⚙️, +${resTotal} 🔬, +${monTotal} 💰`);\n}",
        "addLog(state, `${player.name} collected +${prodTotal} ⚙️, +${resTotal} 🔬, +${monTotal} 💰`);\n" +
        "    if (player.techUnlocked.includes('eco_t7') && !hasEffect(state, playerId, 'cyberattack')) {\n" +
        "        const enemyId = playerId === 0 ? 1 : 0;\n" +
        "        // Simple implementation: just 10% of this turn's collection. For a better implementation we'd calculate enemy's base, but this is simple.\n" +
        "        const espProd = Math.floor(prodTotal * 0.1);\n" +
        "        const espRes = Math.floor(resTotal * 0.1);\n" +
        "        const espMon = Math.floor(monTotal * 0.1);\n" +
        "        state.players[enemyId].resources.production += espProd;\n" +
        "        state.players[enemyId].resources.research += espRes;\n" +
        "        state.players[enemyId].resources.money += espMon;\n" +
        "        if (espProd > 0 || espRes > 0 || espMon > 0) addLog(state, `${state.players[enemyId].name} gained resources from Industrial Espionage!`);\n" +
        "    }\n}"
    ],

    // eco_t6 Tax Havens & Cyberattack check for troops
    [
        "const cost = Math.ceil(totalTroops * TROOP_UPKEEP_COST);",
        "const upkeepMultiplier = (player.techUnlocked.includes('eco_t6') && !hasEffect(state, playerId, 'cyberattack')) ? 0.5 : TROOP_UPKEEP_COST;\n    const cost = Math.ceil(totalTroops * upkeepMultiplier);"
    ]
];
processFile('./server/resources.js', resChanges);

// 3. server/troops.js
processFile('./server/troops.js', [
    [
        "if (player.techUnlocked.includes('mil_t4')) cost = Math.ceil(cost / 2);",
        "if (player.techUnlocked.includes('mil_t4') && !state.players[playerId].tempEffects['cyberattack']) cost = Math.ceil(cost / 2);"
    ],
    [
        "if (player.techUnlocked.includes('mil_t3')) count *= 2;",
        "if (player.techUnlocked.includes('mil_t3') && !state.players[playerId].tempEffects['cyberattack']) count *= 2;"
    ]
]);

// 4. server/territories.js
processFile('./server/territories.js', [
    [
        "state.players[playerId].techUnlocked.includes('mil_t5')",
        "(state.players[playerId].techUnlocked.includes('mil_t5') && !state.players[playerId].tempEffects['cyberattack'])"
    ]
]);

// 5. server/cards.js
processFile('./server/cards.js', [
    [
        "const extraDraw = player.techUnlocked.includes('sci_t1') ? 1 : 0;",
        "const extraDraw = (player.techUnlocked.includes('sci_t1') && !player.tempEffects['cyberattack'] && !player.tempEffects['skipDraw']) ? 1 : 0;"
    ],
    // Remove skipDraw after drawing
    [
        "for (let i = 0; i < totalDraw; i++) {",
        "if (player.tempEffects['skipDraw']) { player.tempEffects['skipDraw'] = false; return null; }\n    for (let i = 0; i < totalDraw; i++) {"
    ]
]);

// 6. server/combat.js
let combatChanges = [
    // mil_t8 Combined Arms and sci_t3 Advanced Tactics
    [
        "if (attackPlayer.techUnlocked.includes('sci_t3')) maxAtk = 4; // Advanced Tactics",
        "if (attackPlayer.techUnlocked.includes('mil_t8') && !hasEffect(state, attacker.owner, 'cyberattack')) maxAtk = 5;\n    else if (attackPlayer.techUnlocked.includes('sci_t3') && !hasEffect(state, attacker.owner, 'cyberattack')) maxAtk = 4; // Advanced Tactics"
    ],
    [
        "if (attackPlayer.techUnlocked.includes('mil_t1') || hasEffect(state, attacker.owner, 'attackBonus')) {",
        "if ((attackPlayer.techUnlocked.includes('mil_t1') && !hasEffect(state, attacker.owner, 'cyberattack')) || hasEffect(state, attacker.owner, 'attackBonus')) {"
    ],
    [
        "if (defendPlayer.techUnlocked.includes('mil_t2') || hasEffect(state, defender.owner, 'defenseBonus')) {",
        "if ((defendPlayer.techUnlocked.includes('mil_t2') && !hasEffect(state, defender.owner, 'cyberattack')) || hasEffect(state, defender.owner, 'defenseBonus')) {"
    ],
    // mil_t5 intercontinental
    [
        "state.players[state.currentPlayer].techUnlocked.includes('mil_t5')",
        "(state.players[state.currentPlayer].techUnlocked.includes('mil_t5') && !hasEffect(state, state.currentPlayer, 'cyberattack'))"
    ],
    // mil_t6 Siege Tactics
    [
        "const target = getTerritory(state.territories, targetId);\n    let defBonus = 0;\n    if (hasEffect(state, target.owner, 'defenseBonus')) defBonus++;\n    if (target.structures.includes('fort')) defBonus++;",
        "const target = getTerritory(state.territories, targetId);\n    let defBonus = 0;\n    const ignoreBonus = attackPlayer.techUnlocked.includes('mil_t6') && !hasEffect(state, attacker.owner, 'cyberattack');\n    if (!ignoreBonus) {\n        if (hasEffect(state, target.owner, 'defenseBonus')) defBonus++;\n        if (target.structures.includes('fort')) defBonus++;\n    }"
    ],
    // mil_t7 Guerilla warfare casualty
    [
        "if (defRoll >= atkRoll) {\n            attackLosses++;\n        } else {\n            defenseLosses++;\n        }\n    }\n\n    // Ambush",
        "if (defRoll >= atkRoll) {\n            attackLosses++;\n        } else {\n            defenseLosses++;\n        }\n    }\n\n    if (defenseLosses === attackCount && defendPlayer.techUnlocked.includes('mil_t7') && !hasEffect(state, defender.owner, 'cyberattack')) {\n        // Guerilla warfare guarantees at least 1 casualty\n        if (attackLosses === 0) {\n            attackLosses = 1;\n            defenseLosses = Math.max(0, defenseLosses - 1);\n        }\n    }\n\n    // Ambush"
    ]
];
processFile('./server/combat.js', combatChanges);

// 7. server/game.js (win checking)
processFile('./server/game.js', [
    [
        "if (state.players[0].techUnlocked.includes('sci_t4')) {",
        "if (state.players[0].techUnlocked.includes('sci_t8')) {"
    ],
    [
        "if (state.players[1].techUnlocked.includes('sci_t4')) {",
        "if (state.players[1].techUnlocked.includes('sci_t8')) {"
    ]
]);

// 8. End Phase (capturedThisTurn and blitzkrieg)
processFile('./server/game.js', [
    [
        "state.currentPlayer = 1;\n        state.phase = 'ai';",
        "state.currentPlayer = 1;\n        state.phase = 'ai';\n        state.players[0].tempEffects['capturedThisTurn'] = 0;\n        state.players[1].tempEffects['capturedThisTurn'] = 0;"
    ],
    [
        "state.currentPlayer = 0;\n        state.phase = 'action';",
        "state.currentPlayer = 0;\n        state.phase = 'action';\n        state.players[0].tempEffects['capturedThisTurn'] = 0;\n        state.players[1].tempEffects['capturedThisTurn'] = 0;"
    ]
]);

processFile('./server/combat.js', [
    [
        "outcome.captured = true;",
        "outcome.captured = true;\n    attackPlayer.tempEffects['capturedThisTurn'] = (attackPlayer.tempEffects['capturedThisTurn'] || 0) + 1;"
    ]
]);

console.log('Done script');
