// ── Risky Civ — Game API Layer ──────────────────────────────────────
// Unified API that the server.js routes call. Each function takes
// the game state, performs the action, and returns the updated state.

const { createGameState, addLog, clearEffects, getMaxActions } = require('./state');
const { collectResources, payUpkeep } = require('./resources');
const { drawCards, playCard, mustPlayCard } = require('./cards');
const { unlockTech, getTechTreeStatus } = require('./tech');
const { resolveCombatRound, applyCombatResult, canAttack, getMaxAttackers } = require('./combat');
const { deployTroops, getDeployCost } = require('./troops');
const { buildStructure, getBuildableStructures } = require('./structures');
const { spendAction, hasActions, resetActions, startAttackPhase } = require('./actions');
const { aiTurn } = require('./ai');
const { getPlayerTerritories, getAdjacentEnemies, canAttackFrom } = require('./territories');
const { WIN_TERRITORY_PERCENT, TOTAL_TERRITORIES } = require('./config');

// ── Create a new game ───────────────────────────────────────────────
function createGame() {
    const state = createGameState();
    addLog(state, '🎮 Game started! Conquer territories and build your empire.');
    addLog(state, 'Spend your 3 actions: deploy troops, build structures, or play cards.');
    addLog(state, 'Then attack enemy territories in the attack phase.');
    return state;
}

// ── Deploy troops ───────────────────────────────────────────────────
function deploy(state, territoryId, count) {
    if (state.currentPlayer !== 0 || state.phase !== 'action') {
        return { error: 'Cannot deploy now' };
    }
    if (!hasActions(state)) {
        return { error: 'No actions remaining' };
    }
    spendAction(state);
    const success = deployTroops(state, territoryId, count);
    if (!success) {
        state.actionsRemaining++; // refund action if failed
        return { error: 'Failed to deploy troops' };
    }
    return { state };
}

// ── Build structure ─────────────────────────────────────────────────
function build(state, territoryId, structureType) {
    if (state.currentPlayer !== 0 || state.phase !== 'action') {
        return { error: 'Cannot build now' };
    }
    if (!hasActions(state)) {
        return { error: 'No actions remaining' };
    }
    spendAction(state);
    const success = buildStructure(state, territoryId, structureType);
    if (!success) {
        state.actionsRemaining++; // refund action if failed
        return { error: 'Failed to build structure' };
    }
    return { state };
}

// ── Play a card ─────────────────────────────────────────────────────
function playCardAction(state, cardIndex, targetId) {
    if (state.currentPlayer !== 0 || state.phase !== 'action') {
        return { error: 'Cannot play cards now' };
    }
    if (!hasActions(state)) {
        return { error: 'No actions remaining' };
    }
    spendAction(state);
    const success = playCard(state, 0, cardIndex, targetId);
    if (!success) {
        state.actionsRemaining++; // refund action if failed to afford
        return { error: 'Failed to play card' };
    }
    return { state };
}

// ── Unlock technology ───────────────────────────────────────────────
function unlock(state, techId) {
    if (state.currentPlayer !== 0) {
        return { error: 'Not your turn' };
    }
    const success = unlockTech(state, 0, techId);
    if (!success) {
        return { error: 'Cannot unlock tech' };
    }
    checkWinCondition(state);
    return { state };
}

// ── Attack ──────────────────────────────────────────────────────────
function attack(state, sourceId, targetId) {
    if (state.currentPlayer !== 0 || state.phase !== 'attack') {
        return { error: 'Cannot attack now' };
    }
    if (!canAttack(state, sourceId, targetId)) {
        return { error: 'Invalid attack' };
    }
    const maxAtk = getMaxAttackers(state, sourceId);
    const attackCount = Math.min(maxAtk, 3);
    const result = resolveCombatRound(state, sourceId, targetId, attackCount);
    const outcome = applyCombatResult(state, sourceId, targetId, result, attackCount);
    checkWinCondition(state);
    return { state, combatResult: result, captured: outcome.captured };
}

// ── End phase (action → attack → AI turn → next player turn) ────────
async function endPhase(state) {
    if (state.gameOver) {
        return { state };
    }

    if (state.currentPlayer === 0 && state.phase === 'action') {
        // Action → Attack
        startAttackPhase(state);
        return { state };
    }

    if (state.currentPlayer === 0 && state.phase === 'attack') {
        // Player's attack phase ends → AI turn
        state.currentPlayer = 1;
        state.phase = 'ai';
        state.players[0].tempEffects['capturedThisTurn'] = 0;
        state.players[1].tempEffects['capturedThisTurn'] = 0;
        state.attackSource = null;
        state.selectedTerritory = null;

        // AI's full turn: collect, draw, actions, tech, attack
        clearEffects(state, 1);
        collectResources(state, 1);
        payUpkeep(state, 1);
        const event = drawCards(state, 1);
        resetActions(state);
        await aiTurn(state, null, 1);

        checkWinCondition(state);

        // Back to player's turn
        state.turn++;
        state.currentPlayer = 0;
        state.phase = 'action';
        state.players[0].tempEffects['capturedThisTurn'] = 0;
        state.players[1].tempEffects['capturedThisTurn'] = 0;
        clearEffects(state, 0);
        state.freeBuild = false;
        state.halfCostDeploy = false;
        collectResources(state, 0);
        payUpkeep(state, 0);
        const playerEvent = drawCards(state, 0);
        resetActions(state);

        checkWinCondition(state);

        return { state, aiEvent: event, playerEvent };
    }

    return { state };
}

// ── Win condition check ─────────────────────────────────────────────
function checkWinCondition(state) {
    if (state.gameOver) return;
    for (let pid = 0; pid < 2; pid++) {
        const owned = getPlayerTerritories(state.territories, pid);
        if (owned.length >= TOTAL_TERRITORIES * WIN_TERRITORY_PERCENT) {
            state.gameOver = true;
            state.winner = pid;
            addLog(state, `${state.players[pid].name} wins by territorial domination!`);
        }
    }
}

module.exports = {
    createGame,
    deploy,
    build,
    playCardAction,
    unlock,
    attack,
    endPhase,
};
