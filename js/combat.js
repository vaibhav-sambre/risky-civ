// ── Risky Civ — Combat Helpers ──────────────────────────────────────

import { MIN_GARRISON } from './config.js';
import { getTerritory } from './territories.js';

/** Check if an attack is valid */
export function canAttack(state, attackId, defendId) {
    const attacker = getTerritory(state.territories, attackId);
    const defender = getTerritory(state.territories, defendId);

    if (!attacker || !defender) return false;
    if (attacker.owner !== state.currentPlayer) return false;
    if (defender.owner === state.currentPlayer) return false;
    if (attacker.troops <= MIN_GARRISON) return false;

    // Land adjacency — always allowed
    if (attacker.adjacent.includes(defendId)) return true;

    // Sea adjacency — requires Naval Supremacy tech
    if (attacker.seaAdjacent && attacker.seaAdjacent.includes(defendId)) {
        return state.players[state.currentPlayer].techUnlocked.includes('mil_t5');
    }

    return false;
}

/** Get maximum troops that can attack from a territory */
export function getMaxAttackers(state, territoryId) {
    const t = getTerritory(state.territories, territoryId);
    if (!t) return 0;
    return Math.max(0, t.troops - MIN_GARRISON);
}
