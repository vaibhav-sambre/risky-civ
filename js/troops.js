// ── Risky Civ — Troop Helpers ───────────────────────────────────────

import { TROOP_DEPLOY_COST, BASE_DEPLOY_COUNT } from './config.js';

/** Calculate deploy cost per troop */
export function getDeployCost(state, playerId) {
    const player = state.players[playerId];
    let cost = TROOP_DEPLOY_COST;
    if (player.techUnlocked.includes('mil_t4')) cost = Math.ceil(cost / 2); // Elite Troops
    if (state.halfCostDeploy) cost = Math.ceil(cost / 2); // state.halfCostDeploy flag from server
    // Note: client doesn't check tempEffects because server handles truth. 
    // But for UI display we try to respect what we know. 
    // Ideally state.halfCostDeploy should be set by server if effect active.
    return cost;
}

/** Calculate how many troops are deployed per action */
export function getDeployCount(state, playerId, territoryId) {
    const player = state.players[playerId];
    let count = BASE_DEPLOY_COUNT;
    if (player.techUnlocked.includes('mil_t3')) count *= 2;
    return count;
}
