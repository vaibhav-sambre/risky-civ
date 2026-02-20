const fs = require('fs');

const NEW_BONUS_CARDS = `
    { id: 'mil_ex01', name: 'Blitzkrieg', category: 'military', type: 'bonus', cost: 12, description: 'Attack one territory for free (costs 0 actions).', icon: '⚡' },
    { id: 'mil_ex02', name: 'Scorched Earth', category: 'military', type: 'bonus', cost: 10, description: 'Destroy all structures in a selected enemy territory.', icon: '🔥' },
    { id: 'mil_ex03', name: 'Draft', category: 'military', type: 'bonus', cost: 8, description: 'Gain +1 troop in every territory you own.', icon: '🪖' },
    { id: 'mil_ex04', name: 'Naval Blockade', category: 'military', type: 'bonus', cost: 10, description: 'Enemy cannot attack across sea routes on their next turn.', icon: '⚓' },
    { id: 'prod_ex01', name: 'Supply Chain Optimization', category: 'production', type: 'bonus', cost: 8, description: 'Treat all structures as costing 0 production this turn.', icon: '📦' },
    { id: 'prod_ex02', name: 'Deforestation', category: 'production', type: 'bonus', cost: 6, description: 'Gain +30 Production immediately, but effectively lose 1 Money income from your Capital permanently.', icon: '🪓' },
    { id: 'prod_ex03', name: 'Urban Sprawl', category: 'production', type: 'bonus', cost: 12, description: 'Build up to 2 structures of any type for free.', icon: '🏙️' },
    { id: 'res_ex01', name: 'Brain Drain', category: 'research', type: 'bonus', cost: 10, description: 'Steal 20 Research from the enemy.', icon: '🧠' },
    { id: 'res_ex02', name: 'Reverse Engineering', category: 'research', type: 'bonus', cost: 8, description: 'Gain +30 Research if the enemy has more tech unlocked than you.', icon: '🔧' },
    { id: 'res_ex03', name: 'Space Program', category: 'research', type: 'bonus', cost: 16, description: 'Gain +50 Research immediately.', icon: '🚀' },
    { id: 'mon_ex01', name: 'Billionaire Benefactor', category: 'money', type: 'bonus', cost: 0, description: 'Gain +40 Money immediately, but skip your next Card Draw phase.', icon: '🎩' },
    { id: 'mon_ex02', name: 'War Profiteering', category: 'money', type: 'bonus', cost: 6, description: 'Gain +10 Money for every territory you captured this turn.', icon: '💹' },
];`;

const NEW_EVENT_CARDS = `
    { id: 'evt_11', name: 'Golden Age', category: 'event', type: 'event', cost: 0, description: 'Both players gain +40 to all resources (Production, Research, Money).', icon: '🌟' },
    { id: 'evt_12', name: 'Cyberattack', category: 'event', type: 'event', cost: 0, description: 'All technology effects are temporarily disabled for 1 turn.', icon: '💻' },
    { id: 'evt_13', name: 'Pandemic', category: 'event', type: 'event', cost: 0, description: 'Both players lose 30% of their troops across all territories.', icon: '☣️' },
    { id: 'evt_14', name: 'Economic Crash', category: 'event', type: 'event', cost: 0, description: 'Both players lose 100% of their currently banked Money.', icon: '📉' },
];`;

const MIL_TECH = `
        { id: 'mil_t6', name: 'Siege Tactics', cost: 60, description: 'Ignore target\\'s "Fortify" and structure defensive bonuses when attacking', effect: 'siegeTactics' },
        { id: 'mil_t7', name: 'Guerilla Warfare', cost: 75, description: 'When defending, guaranteed to inflict at least 1 casualty', effect: 'guerillaWarfare' },
        { id: 'mil_t8', name: 'Combined Arms', cost: 100, description: 'Attack with up to 5 dice instead of 3', effect: 'combinedArms' },
    ],`;

const ECO_TECH = `
        { id: 'eco_t5', name: 'Banking Guild', cost: 60, description: 'All Banks provide +4 Money instead of +2', effect: 'bankingGuild' },
        { id: 'eco_t6', name: 'Tax Havens', cost: 80, description: 'Troop upkeep costs permanently reduced to 0.5 per troop', effect: 'taxHavens' },
        { id: 'eco_t7', name: 'Industrial Espionage', cost: 100, description: 'Passively gain resources equal to 10% of enemy\\'s income each turn', effect: 'industrialEspionage' },
    ],`;

const SCI_TECH = `
        { id: 'sci_t4', name: 'World Domination', cost: 150, description: 'Instant victory — you win!', effect: 'worldDomination' },
    ],`;

const SCI_TECH_INSERT = `
        { id: 'sci_t4', name: 'World Domination', cost: 150, description: 'Instant victory — you win!', effect: 'worldDomination' }, // Will replace
`;

function processFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Bonus Cards
    content = content.replace("    { id: 'multi_12', name: 'Windfall', category: 'multi', type: 'bonus', cost: 2, description: 'Gain +3 of each resource.', icon: '🍀' },\n];",
        "    { id: 'multi_12', name: 'Windfall', category: 'multi', type: 'bonus', cost: 2, description: 'Gain +3 of each resource.', icon: '🍀' },\n" + NEW_BONUS_CARDS.replace('];', '').trimEnd() + "\n];");

    // Event Cards
    content = content.replace("    { id: 'evt_10', name: 'Embargo', category: 'event', type: 'event', cost: 0, description: \"All players' Banks produce nothing this turn.\", icon: '🚢' },\n];",
        "    { id: 'evt_10', name: 'Embargo', category: 'event', type: 'event', cost: 0, description: \"All players' Banks produce nothing this turn.\", icon: '🚢' },\n" + NEW_EVENT_CARDS.replace('];', '').trimEnd() + "\n];");

    // Mil Tech
    content = content.replace("        { id: 'mil_t5', name: 'Naval Supremacy', cost: 40, description: 'Attack across sea routes between continents', effect: 'intercontinentalCombat' },\n    ],",
        "        { id: 'mil_t5', name: 'Naval Supremacy', cost: 40, description: 'Attack across sea routes between continents', effect: 'intercontinentalCombat' },\n" + MIL_TECH.replace('],', '').trimEnd() + "\n    ],");

    // Eco Tech
    content = content.replace("        { id: 'eco_t4', name: 'Trade Routes', cost: 50, description: 'Continent bonuses doubled', effect: 'tradeRoutes' },\n    ],",
        "        { id: 'eco_t4', name: 'Trade Routes', cost: 50, description: 'Continent bonuses doubled', effect: 'tradeRoutes' },\n" + ECO_TECH.replace('],', '').trimEnd() + "\n    ],");

    // Sci Tech
    content = content.replace("        { id: 'sci_t4', name: 'World Domination', cost: 60, description: 'Instant victory — you win!', effect: 'worldDomination' },\n    ],",
        "        { id: 'sci_t5', name: 'Logistics Network', cost: 60, description: 'Max actions increased from 4 to 5 per turn', effect: 'logisticsNetwork' },\n" +
        "        { id: 'sci_t6', name: 'Scientific Method', cost: 80, description: 'Base research output from all sources is doubled', effect: 'scientificMethod' },\n" +
        "        { id: 'sci_t8', name: 'World Domination', cost: 150, description: 'Instant victory — you win!', effect: 'worldDomination' },\n    ],");

    fs.writeFileSync(path, content, 'utf8');
}

processFile('./server/config.js');
processFile('./js/config.js');
console.log('Done');
