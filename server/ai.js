const { getPlayerTerritories, getAdjacentEnemies, getTerritory, getNeutralTerritories, canAttackFrom } = require('./territories');
const { deployTroops } = require('./troops');
const { buildStructure, canAffordStructure } = require('./structures');
const { playCard } = require('./cards');
const { unlockTech, getNextTech } = require('./tech');
const { resolveCombatRound, applyCombatResult, canAttack, getMaxAttackers } = require('./combat');
const { spendAction, hasActions } = require('./actions');
const { addLog } = require('./state');
const { randomPick } = require('./utils');
// ── Risky Civ — AI Opponent ──────────────────────────────────────────

/** Execute the AI's full turn (actions + attacks) */
async function aiTurn(state, renderCallback, playerId = 1) {
    const aiId = playerId;
    const player = state.players[aiId];

    // ── Spend Actions ────────────────────────────────────────────────
    while (hasActions(state)) {
        const owned = getPlayerTerritories(state.territories, aiId);
        if (owned.length === 0) break;

        const action = chooseAction(state, aiId, owned);

        if (action === 'deploy') {
            // Deploy to the territory with the most adjacent enemies
            let bestTerritory = null;
            let maxThreats = -1;
            for (const t of owned) {
                const threats = getAdjacentEnemies(state.territories, t.id, aiId, state).length;
                if (threats > maxThreats || (threats === maxThreats && t.troops < (bestTerritory?.troops ?? Infinity))) {
                    maxThreats = threats;
                    bestTerritory = t;
                }
            }
            if (bestTerritory && player.resources.production >= 3) {
                spendAction(state);
                deployTroops(state, bestTerritory.id);
            } else {
                // Can't deploy, try something else
                tryBuildOrCard(state, aiId, owned);
            }
        } else if (action === 'build') {
            const buildTarget = chooseBuildTarget(state, aiId, owned);
            if (buildTarget) {
                spendAction(state);
                buildStructure(state, buildTarget.territory, buildTarget.type);
            } else {
                // Fallback: try deploy instead
                if (player.resources.production >= 3 && owned.length > 0) {
                    spendAction(state);
                    deployTroops(state, randomPick(owned).id);
                } else {
                    spendAction(state); // burn action to avoid infinite loop
                }
            }
        } else if (action === 'card') {
            if (player.hand.length > 0) {
                // All cards in hand are bonus cards — play the first affordable one
                const idx = player.hand.findIndex(c => player.resources.money >= (c.cost || 0));
                if (idx >= 0) {
                    spendAction(state);
                    playCard(state, aiId, idx);
                } else {
                    spendAction(state); // no affordable cards, burn action
                }
            } else {
                spendAction(state);
            }
        }

        if (renderCallback) {
            renderCallback();
            await new Promise(r => setTimeout(r, 300));
        }
    }

    // ── Tech Spending ───────────────────────────────────────────────
    aiSpendTech(state, aiId);

    // ── Attack Phase ────────────────────────────────────────────────
    await aiAttack(state, aiId, renderCallback);
}

function chooseAction(state, aiId, owned) {
    const player = state.players[aiId];

    // Hand near full — play a card
    if (player.hand.length >= 8) return 'card';

    // Early game: prioritize building
    if (state.turn < 8) {
        if (owned.some(t => t.structures.length === 0) && canAffordAnyStructure(state, aiId)) {
            return 'build';
        }
        if (player.resources.production >= 3) return 'deploy';
        if (player.hand.length > 0) return 'card';
        return 'deploy';
    }

    // Mid-late game: prioritize deploying troops
    const totalTroops = owned.reduce((s, t) => s + t.troops, 0);
    const avgTroops = totalTroops / owned.length;

    if (avgTroops < 4 && player.resources.production >= 3) return 'deploy';
    if (canAffordAnyStructure(state, aiId) && owned.some(t => t.structures.length < 2)) return 'build';
    if (player.resources.production >= 3) return 'deploy';
    if (player.hand.length > 0) return 'card';
    return 'deploy';
}

function canAffordAnyStructure(state, aiId) {
    return ['factory', 'bank', 'university'].some(s => canAffordStructure(state, aiId, s));
}

function tryBuildOrCard(state, aiId, owned) {
    const buildTarget = chooseBuildTarget(state, aiId, owned);
    if (buildTarget) {
        spendAction(state);
        buildStructure(state, buildTarget.territory, buildTarget.type);
    } else if (state.players[aiId].hand.length > 0) {
        spendAction(state);
        playCard(state, aiId, 0);
    } else {
        spendAction(state);
    }
}

function chooseBuildTarget(state, aiId, owned) {
    const priorities = ['bank', 'factory', 'university'];
    for (const structType of priorities) {
        if (!canAffordStructure(state, aiId, structType)) continue;
        const target = owned.find(t => t.structures.length < 3 && !t.structures.includes(structType));
        if (target) return { territory: target.id, type: structType };
    }
    return null;
}

function aiSpendTech(state, aiId) {
    // Prioritize: Economic early, Military mid-late
    const branches = state.turn < 10
        ? ['economic', 'science', 'military']
        : ['military', 'economic', 'science'];

    for (const branch of branches) {
        const next = getNextTech(state, aiId, branch);
        if (next && state.players[aiId].resources.research >= next.cost) {
            unlockTech(state, aiId, next.id);
            break;
        }
    }
}

async function aiAttack(state, aiId, renderCallback) {
    let attacked = true;
    let rounds = 0;
    while (attacked && rounds < 20) {
        attacked = false;
        rounds++;
        const owned = getPlayerTerritories(state.territories, aiId);

        for (const t of owned) {
            if (t.troops <= 2) continue;
            const enemies = getAdjacentEnemies(state.territories, t.id, aiId, state);

            for (const enemy of enemies) {
                // Attack if we have at least 2:1 advantage (or 1.5:1 for neutrals)
                const ratio = enemy.owner === null ? 1.5 : 2;
                if (t.troops >= enemy.troops * ratio && t.troops > 2) {
                    if (!canAttack(state, t.id, enemy.id)) continue;

                    const attackCount = Math.min(t.troops - 1, 3);
                    const result = resolveCombatRound(state, t.id, enemy.id, attackCount);
                    const outcome = applyCombatResult(state, t.id, enemy.id, result, attackCount);
                    attacked = true;

                    if (renderCallback) {
                        renderCallback();
                        await new Promise(r => setTimeout(r, 400));
                    }

                    if (outcome.captured) break; // territory changed, re-evaluate
                }
            }
            if (attacked) break; // re-evaluate territories
        }
    }
}

module.exports = { aiTurn, chooseAction, canAffordAnyStructure, tryBuildOrCard, chooseBuildTarget, aiSpendTech, aiAttack };
