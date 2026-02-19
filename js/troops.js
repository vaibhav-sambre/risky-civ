// ── Risky Civ — Troop Deployment ────────────────────────────────────

import { TROOP_DEPLOY_COST, BASE_DEPLOY_COUNT, STRUCTURES, MIN_GARRISON } from './config.js';
import { getTerritory } from './territories.js';
import { addLog, hasEffect } from './state.js';

/** Calculate deploy cost per troop */
export function getDeployCost(state, playerId) {
    const player = state.players[playerId];
    let cost = TROOP_DEPLOY_COST;
    if (player.techUnlocked.includes('mil_t4')) cost = Math.ceil(cost / 2); // Elite Troops
    if (hasEffect(state, playerId, 'halfCostDeploy') || state.halfCostDeploy) cost = Math.ceil(cost / 2);
    return cost;
}

/** Calculate how many troops are deployed per action */
export function getDeployCount(state, playerId, territoryId) {
    const player = state.players[playerId];
    let count = BASE_DEPLOY_COUNT;

    // Double Deploy tech
    if (player.techUnlocked.includes('mil_t3')) count *= 2;

    return count;
}

/** Deploy troops to a territory (spends Production) */
export function deployTroops(state, territoryId, countOverride = null, free = false) {
    const t = getTerritory(state.territories, territoryId);
    const player = state.players[state.currentPlayer];

    if (!t || t.owner !== state.currentPlayer) return false;

    const count = countOverride || getDeployCount(state, state.currentPlayer, territoryId);
    const costPerTroop = getDeployCost(state, state.currentPlayer);
    const totalCost = count * costPerTroop;

    if (!free) {
        if (player.resources.production < totalCost) {
            // Deploy as many as we can afford
            const affordable = Math.floor(player.resources.production / costPerTroop);
            if (affordable <= 0) {
                addLog(state, `Not enough Production to deploy troops`);
                return false;
            }
            player.resources.production -= affordable * costPerTroop;
            t.troops += affordable;
            addLog(state, `${player.name} deployed ${affordable} troops to ${t.name}`);
            return true;
        }
        player.resources.production -= totalCost;
    }

    t.troops += count;
    addLog(state, `${player.name} deployed ${count} troops to ${t.name}`);
    return true;
}

/** Move troops between adjacent owned territories */
export function moveTroops(state, fromId, toId, count) {
    const from = getTerritory(state.territories, fromId);
    const to = getTerritory(state.territories, toId);

    if (!from || !to) return false;
    if (from.owner !== state.currentPlayer || to.owner !== state.currentPlayer) return false;
    if (!from.adjacent.includes(toId)) return false;
    if (from.troops - count < MIN_GARRISON) return false;

    from.troops -= count;
    to.troops += count;
    addLog(state, `${state.players[state.currentPlayer].name} moved ${count} troops from ${from.name} to ${to.name}`);
    return true;
}
