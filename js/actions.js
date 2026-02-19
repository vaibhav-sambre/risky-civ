// ── Risky Civ — Action System ───────────────────────────────────────

import { addLog, getMaxActions } from './state.js';

/** Check if player has actions remaining */
export function hasActions(state) {
    return state.actionsRemaining > 0;
}

/** Spend one action */
export function spendAction(state) {
    if (state.actionsRemaining <= 0) return false;
    state.actionsRemaining--;
    return true;
}

/** Reset actions for the current player's turn */
export function resetActions(state) {
    state.actionsRemaining = getMaxActions(state);
}

/** Transition from action phase to attack phase */
export function startAttackPhase(state) {
    state.phase = 'attack';
    addLog(state, `${state.players[state.currentPlayer].name} enters attack phase`);
}
