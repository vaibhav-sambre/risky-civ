const { addLog, getMaxActions } = require('./state');
// ── Risky Civ — Action System ───────────────────────────────────────

/** Check if player has actions remaining */
function hasActions(state) {
    return state.actionsRemaining > 0;
}

/** Spend one action */
function spendAction(state) {
    if (state.actionsRemaining <= 0) return false;
    state.actionsRemaining--;
    return true;
}

/** Reset actions for the current player's turn */
function resetActions(state) {
    state.actionsRemaining = getMaxActions(state);
}

/** Transition from action phase to attack phase */
function startAttackPhase(state) {
    state.phase = 'attack';
    addLog(state, `${state.players[state.currentPlayer].name} enters attack phase`);
}

module.exports = { hasActions, spendAction, resetActions, startAttackPhase };
