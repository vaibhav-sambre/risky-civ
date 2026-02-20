// ── Risky Civ — Game Configuration ──────────────────────────────────

export const PLAYER_COLORS = ['#4A90D9', '#D94A4A'];
export const PLAYER_NAMES = ['Player', 'AI'];
export const NEUTRAL_COLOR = '#8B8B8B';

// ── Backend Configuration ──────────────────────────────────────────
export const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://risky-civ.onrender.com'; // User must update this if differet

// ── Resources ───────────────────────────────────────────────────────
export const RESOURCE_TYPES = ['production', 'research', 'money'];
export const STARTING_RESOURCES = { production: 10, research: 0, money: 15 };

// ── Base resource output per territory (before structures) ──────────
export const BASE_TERRITORY_RESOURCES = { production: 1, research: 1, money: 1 };

// ── Continent bonuses (extra resources for owning a full continent) ─
export const CONTINENT_BONUSES = {
  northAmerica: { production: 3, research: 1, money: 2 },
  southAmerica: { production: 1, research: 1, money: 2 },
  europe: { production: 2, research: 3, money: 2 },
  africa: { production: 2, research: 1, money: 3 },
  asia: { production: 3, research: 2, money: 3 },
};

// ── Structures ──────────────────────────────────────────────────────
export const STRUCTURES = {
  factory: { name: 'Factory', icon: '🏭', cost: { production: 5, money: 3 }, bonus: { production: 2 } },
  university: { name: 'University', icon: '🎓', cost: { production: 3, money: 5 }, bonus: { research: 2 } },
  bank: { name: 'Bank', icon: '🏦', cost: { production: 3, money: 4 }, bonus: { money: 2 } },
};

// ── Troops ──────────────────────────────────────────────────────────
export const TROOP_DEPLOY_COST = 3;   // Production per troop
export const TROOP_UPKEEP_COST = 1.5;   // Money per troop per turn
export const BASE_DEPLOY_COUNT = 3;   // Troops per deploy action
export const MIN_GARRISON = 1;   // Minimum troops in any owned territory

// ── Actions ─────────────────────────────────────────────────────────
export const BASE_ACTIONS_PER_TURN = 3;

// ── Combat ──────────────────────────────────────────────────────────
export const MAX_ATTACK_DICE = 3;
export const MAX_DEFEND_DICE = 2;
export const DICE_SIDES = 6;

// ── Cards ───────────────────────────────────────────────────────────
export const STARTING_HAND_SIZE = 7;
export const MAX_HAND_SIZE = 7;
export const CARDS_DRAWN_PER_TURN = 1;

// ── Bonus Cards (60 playable cards — cost Money + 1 Action) ─────────
export const BONUS_CARDS = [
  // ── Production (12) ──
  { id: 'prod_01', name: 'Industrial Revolution', category: 'production', type: 'bonus', cost: 10, description: 'All factories produce double this turn.', icon: '🏭' },
  { id: 'prod_02', name: 'Free Construction', category: 'production', type: 'bonus', cost: 6, description: 'Build one structure for free.', icon: '🔨' },
  { id: 'prod_03', name: 'Supply Surge', category: 'production', type: 'bonus', cost: 8, description: 'Gain +15 Production immediately.', icon: '📦' },
  { id: 'prod_04', name: 'Overtime Workers', category: 'production', type: 'bonus', cost: 4, description: 'Gain +8 Production immediately.', icon: '👷' },
  { id: 'prod_05', name: 'Mass Production', category: 'production', type: 'bonus', cost: 8, description: 'Deploy troops at half cost this turn.', icon: '🔧' },
  { id: 'prod_06', name: 'Harvest Festival', category: 'production', type: 'bonus', cost: 6, description: 'Gain +5 of each resource.', icon: '🎉' },
  { id: 'prod_07', name: 'Iron Mine', category: 'production', type: 'bonus', cost: 4, description: 'Gain +6 Production immediately.', icon: '⛏️' },
  { id: 'prod_08', name: 'Assembly Line', category: 'production', type: 'bonus', cost: 10, description: 'Gain +20 Production immediately.', icon: '🏗️' },
  { id: 'prod_09', name: 'Salvage Operation', category: 'production', type: 'bonus', cost: 2, description: 'Gain +4 Production immediately.', icon: '♻️' },
  { id: 'prod_10', name: 'Resource Convoy', category: 'production', type: 'bonus', cost: 6, description: 'Gain +10 Production immediately.', icon: '🚛' },
  { id: 'prod_11', name: 'Wartime Economy', category: 'production', type: 'bonus', cost: 8, description: 'Convert 10 Money into 15 Production.', icon: '⚙️' },
  { id: 'prod_12', name: 'Blueprint Cache', category: 'production', type: 'bonus', cost: 6, description: 'Gain +5 Production and +5 Research.', icon: '📐' },

  // ── Research (12) ──
  { id: 'res_01', name: 'Eureka Moment', category: 'research', type: 'bonus', cost: 10, description: 'Gain +15 Research immediately.', icon: '💡' },
  { id: 'res_02', name: 'Stolen Blueprints', category: 'research', type: 'bonus', cost: 12, description: 'Steal 10 Research from the enemy.', icon: '📜' },
  { id: 'res_03', name: 'Think Tank', category: 'research', type: 'bonus', cost: 8, description: 'Universities produce double this turn.', icon: '🧠' },
  { id: 'res_04', name: 'Academic Exchange', category: 'research', type: 'bonus', cost: 6, description: 'Gain +10 Research immediately.', icon: '📚' },
  { id: 'res_05', name: 'Innovation Grant', category: 'research', type: 'bonus', cost: 8, description: 'Gain +8 Research and draw a card.', icon: '🏅' },
  { id: 'res_06', name: 'Laboratory', category: 'research', type: 'bonus', cost: 4, description: 'Gain +6 Research immediately.', icon: '🔬' },
  { id: 'res_07', name: 'Breakthrough', category: 'research', type: 'bonus', cost: 10, description: 'Gain +18 Research immediately.', icon: '⚡' },
  { id: 'res_08', name: 'Knowledge Transfer', category: 'research', type: 'bonus', cost: 6, description: 'Convert 8 Money into 12 Research.', icon: '🎓' },
  { id: 'res_09', name: 'Patent Office', category: 'research', type: 'bonus', cost: 2, description: 'Gain +4 Research immediately.', icon: '📋' },
  { id: 'res_10', name: 'Research Expedition', category: 'research', type: 'bonus', cost: 8, description: 'Gain +12 Research immediately.', icon: '🧭' },
  { id: 'res_11', name: 'Science Fair', category: 'research', type: 'bonus', cost: 4, description: 'Gain +5 Research per University you own.', icon: '🏆' },
  { id: 'res_12', name: 'Ancient Library', category: 'research', type: 'bonus', cost: 6, description: 'Gain +8 Research and +4 Production.', icon: '📖' },

  // ── Money (12) ──
  { id: 'mon_01', name: 'Tax Collection', category: 'money', type: 'bonus', cost: 6, description: 'Collect 3 Money per territory you own.', icon: '💰' },
  { id: 'mon_02', name: 'Economic Boom', category: 'money', type: 'bonus', cost: 10, description: 'Gain +20 Money immediately.', icon: '📈' },
  { id: 'mon_03', name: 'Trade Agreement', category: 'money', type: 'bonus', cost: 6, description: 'Gain +12 Money immediately.', icon: '🤝' },
  { id: 'mon_04', name: 'Gold Rush', category: 'money', type: 'bonus', cost: 8, description: 'Banks produce double this turn.', icon: '💎' },
  { id: 'mon_05', name: 'Foreign Investment', category: 'money', type: 'bonus', cost: 4, description: 'Gain +8 Money immediately.', icon: '🏦' },
  { id: 'mon_06', name: 'War Chest', category: 'money', type: 'bonus', cost: 6, description: 'Gain +10 Money and +5 Production.', icon: '🗃️' },
  { id: 'mon_07', name: 'Treasure Map', category: 'money', type: 'bonus', cost: 4, description: 'Gain +15 Money.', icon: '🗺️' },
  { id: 'mon_08', name: 'Market Manipulation', category: 'money', type: 'bonus', cost: 8, description: 'Steal 8 Money from the enemy.', icon: '🎭' },
  { id: 'mon_09', name: 'Trade Caravan', category: 'money', type: 'bonus', cost: 2, description: 'Gain +5 Money immediately.', icon: '🐫' },
  { id: 'mon_10', name: 'Royal Treasury', category: 'money', type: 'bonus', cost: 10, description: 'Gain +25 Money immediately.', icon: '👑' },
  { id: 'mon_11', name: 'Merchant Fleet', category: 'money', type: 'bonus', cost: 6, description: 'Gain +4 Money per Bank you own.', icon: '⛵' },
  { id: 'mon_12', name: 'Loan Shark', category: 'money', type: 'bonus', cost: 0, description: 'Gain +12 Money but lose 5 Production.', icon: '🦈' },

  // ── Military (12) ──
  { id: 'mil_01', name: 'Paradrop', category: 'military', type: 'bonus', cost: 12, description: 'Deploy 5 troops to any territory you own.', icon: '🪂' },
  { id: 'mil_02', name: 'Mutiny', category: 'military', type: 'bonus', cost: 10, description: 'Enemy weakest territory loses half its troops.', icon: '🏴' },
  { id: 'mil_03', name: 'Forced March', category: 'military', type: 'bonus', cost: 6, description: 'Move up to 5 troops between adjacent owned territories.', icon: '🚩' },
  { id: 'mil_04', name: 'Veteran Troops', category: 'military', type: 'bonus', cost: 8, description: '+1 to all attack dice this turn.', icon: '🎖️' },
  { id: 'mil_05', name: 'Conscription', category: 'military', type: 'bonus', cost: 6, description: 'Deploy 3 troops for free to your capital.', icon: '📯' },
  { id: 'mil_06', name: 'Fortify', category: 'military', type: 'bonus', cost: 6, description: '+1 to all defense dice this turn.', icon: '🛡️' },
  { id: 'mil_07', name: 'Mercenaries', category: 'military', type: 'bonus', cost: 12, description: 'Deploy 4 troops for free to any territory.', icon: '💂' },
  { id: 'mil_08', name: 'Alliance', category: 'military', type: 'bonus', cost: 10, description: 'Gain +4 troops in a territory of your choice.', icon: '🤝' },
  { id: 'mil_09', name: 'Spy Network', category: 'military', type: 'bonus', cost: 12, description: 'Steal one card from enemy hand.', icon: '🕵️' },
  { id: 'mil_10', name: 'Ambush', category: 'military', type: 'bonus', cost: 8, description: '+2 to your highest attack die this turn.', icon: '🏹' },
  { id: 'mil_11', name: 'Garrison Reinforcement', category: 'military', type: 'bonus', cost: 4, description: 'Add +2 troops to all territories with 1 troop.', icon: '🏰' },
  { id: 'mil_12', name: 'War Banner', category: 'military', type: 'bonus', cost: 6, description: 'Deploy 2 free troops to your 3 weakest territories.', icon: '🚩' },

  // ── Multi-Resource (12) ──
  { id: 'multi_01', name: 'Golden Age', category: 'multi', type: 'bonus', cost: 10, description: 'Gain +8 of each resource.', icon: '🌟' },
  { id: 'multi_02', name: 'Bountiful Harvest', category: 'multi', type: 'bonus', cost: 6, description: 'Gain +5 of each resource.', icon: '🌾' },
  { id: 'multi_03', name: 'Diplomatic Victory', category: 'multi', type: 'bonus', cost: 10, description: 'An unclaimed territory joins you with 2 troops.', icon: '🕊️' },
  { id: 'multi_04', name: 'Refugees', category: 'multi', type: 'bonus', cost: 4, description: 'Gain +3 troops in your weakest territory.', icon: '🏕️' },
  { id: 'multi_05', name: 'Festival', category: 'multi', type: 'bonus', cost: 4, description: 'Gain +4 of each resource.', icon: '🎊' },
  { id: 'multi_06', name: 'Peace Treaty', category: 'multi', type: 'bonus', cost: 8, description: 'Gain +10 Money and +10 Research.', icon: '📜' },
  { id: 'multi_07', name: 'Cultural Exchange', category: 'multi', type: 'bonus', cost: 6, description: 'Gain +6 Research and +6 Money.', icon: '🎭' },
  { id: 'multi_08', name: 'Nationalization', category: 'multi', type: 'bonus', cost: 8, description: 'Gain +3 of each resource per Factory you own.', icon: '🏛️' },
  { id: 'multi_09', name: 'War Bonds', category: 'multi', type: 'bonus', cost: 2, description: 'Gain +3 Production and +3 Money.', icon: '📃' },
  { id: 'multi_10', name: 'Prosperity', category: 'multi', type: 'bonus', cost: 6, description: 'Gain +7 Production and +7 Money.', icon: '🌈' },
  { id: 'multi_11', name: 'Expeditionary Force', category: 'multi', type: 'bonus', cost: 10, description: 'Deploy 3 troops and gain +8 Production.', icon: '⚓' },
  { id: 'multi_12', name: 'Windfall', category: 'multi', type: 'bonus', cost: 2, description: 'Gain +3 of each resource.', icon: '🍀' },
];

// ── Event Cards (10 global events — trigger on draw, affect ALL players) ─
export const EVENT_CARDS = [
  { id: 'evt_01', name: 'Plague', category: 'event', type: 'event', cost: 0, description: 'All players lose 2 troops from their most populated territory.', icon: '☠️' },
  { id: 'evt_02', name: 'Earthquake', category: 'event', type: 'event', cost: 0, description: 'A random structure is destroyed for each player.', icon: '🌋' },
  { id: 'evt_03', name: 'Recession', category: 'event', type: 'event', cost: 0, description: 'All players lose 30% of their Money.', icon: '📉' },
  { id: 'evt_04', name: 'Famine', category: 'event', type: 'event', cost: 0, description: 'All players lose 8 Production.', icon: '🥀' },
  { id: 'evt_05', name: 'Civil Unrest', category: 'event', type: 'event', cost: 0, description: 'All players lose 1 troop in every territory.', icon: '🔥' },
  { id: 'evt_06', name: 'Desertion', category: 'event', type: 'event', cost: 0, description: 'All players lose 2 troops in their weakest territory.', icon: '🏳️' },
  { id: 'evt_07', name: 'Corruption', category: 'event', type: 'event', cost: 0, description: 'All players lose 5 Money and 3 Production.', icon: '🐀' },
  { id: 'evt_08', name: 'Arms Race', category: 'event', type: 'event', cost: 0, description: 'All players gain +3 troops to their capital but lose 10 Money.', icon: '🚀' },
  { id: 'evt_09', name: 'Meteor Shower', category: 'event', type: 'event', cost: 0, description: 'All players lose a random structure and 2 troops from their strongest territory.', icon: '☄️' },
  { id: 'evt_10', name: 'Embargo', category: 'event', type: 'event', cost: 0, description: 'All players\' Banks produce nothing this turn.', icon: '🚢' },
];

// Combined for backwards compatibility (deck building)
export const CARD_DEFINITIONS = [...BONUS_CARDS, ...EVENT_CARDS];

// ── Tech Tree ───────────────────────────────────────────────────────
export const TECH_TREE = {
  military: [
    { id: 'mil_t1', name: 'Sharpened Blades', cost: 10, description: '+1 to highest attack die', effect: 'attackBonus' },
    { id: 'mil_t2', name: 'Fortified Walls', cost: 20, description: '+1 to highest defense die', effect: 'defenseBonus' },
    { id: 'mil_t3', name: 'Double Deploy', cost: 35, description: 'Deploy action gives 2× troops', effect: 'doubleDeploy' },
    { id: 'mil_t4', name: 'Elite Troops', cost: 50, description: 'Troops cost 50% less to deploy', effect: 'eliteTroops' },
    { id: 'mil_t5', name: 'Naval Supremacy', cost: 40, description: 'Attack across sea routes between continents', effect: 'intercontinentalCombat' },
  ],
  economic: [
    { id: 'eco_t1', name: 'Improved Structures', cost: 10, description: 'Structures give +1 extra bonus', effect: 'betterStructures' },
    { id: 'eco_t2', name: 'Prosperous Lands', cost: 20, description: 'Base territory output +1 each', effect: 'betterBase' },
    { id: 'eco_t3', name: 'Rapid Construction', cost: 35, description: 'Build action constructs 2 structures', effect: 'rapidConstruction' },
    { id: 'eco_t4', name: 'Trade Routes', cost: 50, description: 'Continent bonuses doubled', effect: 'tradeRoutes' },
  ],
  science: [
    { id: 'sci_t1', name: 'Expanded Library', cost: 10, description: 'Draw 2 cards per turn instead of 1', effect: 'extraDraw' },
    { id: 'sci_t2', name: 'Efficient Planning', cost: 20, description: 'Gain a 4th action per turn', effect: 'extraAction' },
    { id: 'sci_t3', name: 'Advanced Tactics', cost: 35, description: 'Can attack with 4 dice', effect: 'fourDice' },
    { id: 'sci_t4', name: 'World Domination', cost: 60, description: 'Instant victory — you win!', effect: 'worldDomination' },
  ],
};

// ── Win Conditions ──────────────────────────────────────────────────
export const WIN_TERRITORY_PERCENT = 0.75;
export const TOTAL_TERRITORIES = 30;
