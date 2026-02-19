// ── Risky Civ — Structure Helpers ───────────────────────────────────

import { STRUCTURES } from './config.js';
import { getTerritory } from './territories.js';

/** Check if a player can afford a structure */
export function canAffordStructure(state, playerId, structureType) {
    const hasFreeBuild = state.players[playerId].tempEffects['freeBuild'] || state.freeBuild;
    if (hasFreeBuild) return true;

    const player = state.players[playerId];
    const cost = STRUCTURES[structureType].cost;
    return player.resources.production >= cost.production &&
        player.resources.money >= cost.money;
}

/** Get structures buildable in a territory */
export function getBuildableStructures(state, territoryId) {
    const t = getTerritory(state.territories, territoryId);
    if (!t || t.owner !== state.currentPlayer) return [];
    if (t.structures.length >= 4) return [];

    return Object.keys(STRUCTURES).map(key => ({
        type: key,
        ...STRUCTURES[key],
        canAfford: canAffordStructure(state, state.currentPlayer, key),
    }));
}
