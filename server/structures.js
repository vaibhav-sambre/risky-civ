const { STRUCTURES } = require('./config');
const { addLog, hasEffect } = require('./state');
const { getTerritory } = require('./territories');
// ── Risky Civ — Structure Building ──────────────────────────────────

/** Check if a player can afford a structure */
function canAffordStructure(state, playerId, structureType) {
    if (hasEffect(state, playerId, 'freeBuild') || state.freeBuild) return true;
    const player = state.players[playerId];
    const cost = STRUCTURES[structureType].cost;
    return player.resources.production >= cost.production &&
        player.resources.money >= cost.money;
}

/** Build a structure in a territory */
function buildStructure(state, territoryId, structureType, free = false) {
    const t = getTerritory(state.territories, territoryId);
    const player = state.players[state.currentPlayer];
    const def = STRUCTURES[structureType];

    if (!def) return false;
    if (t.owner !== state.currentPlayer) return false;

    // Max 4 structures per territory
    if (t.structures.length >= 4) {
        addLog(state, `Cannot build — ${t.name} already has maximum structures`);
        return false;
    }

    // Pay cost (unless free)
    if (!free && !state.freeBuild) {
        if (!canAffordStructure(state, state.currentPlayer, structureType)) {
            addLog(state, `Cannot afford ${def.name}`);
            return false;
        }
        player.resources.production -= def.cost.production;
        player.resources.money -= def.cost.money;
    } else {
        state.freeBuild = false; // consume free build
    }

    t.structures.push(structureType);
    addLog(state, `${player.name} built ${def.icon} ${def.name} in ${t.name}`);
    return true;
}

/** Get structures buildable in a territory */
function getBuildableStructures(state, territoryId) {
    const t = getTerritory(state.territories, territoryId);
    if (!t || t.owner !== state.currentPlayer) return [];
    if (t.structures.length >= 4) return [];

    return Object.keys(STRUCTURES).map(key => ({
        type: key,
        ...STRUCTURES[key],
        canAfford: canAffordStructure(state, state.currentPlayer, key),
    }));
}

module.exports = { canAffordStructure, buildStructure, getBuildableStructures };
