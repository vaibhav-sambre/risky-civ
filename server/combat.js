const { MAX_ATTACK_DICE, MAX_DEFEND_DICE, MIN_GARRISON } = require('./config');
const { rollDice, clamp } = require('./utils');
const { getTerritory } = require('./territories');
const { addLog, hasEffect } = require('./state');
// ── Risky Civ — Combat System ───────────────────────────────────────

/** Resolve one round of combat between two territories */
function resolveCombatRound(state, attackId, defendId, attackCount) {
    const attacker = getTerritory(state.territories, attackId);
    const defender = getTerritory(state.territories, defendId);
    const attackPlayer = state.players[attacker.owner];
    const defendPlayer = state.players[defender.owner];

    // Number of dice
    let maxAtk = MAX_ATTACK_DICE;
    if (attackPlayer.techUnlocked.includes('sci_t3')) maxAtk = 4; // Advanced Tactics
    const atkDiceCount = clamp(attackCount, 1, maxAtk);
    const defDiceCount = clamp(defender.troops, 1, MAX_DEFEND_DICE);

    // Roll
    let atkDice = rollDice(atkDiceCount);
    let defDice = rollDice(defDiceCount);

    // Tech bonuses
    if (attackPlayer.techUnlocked.includes('mil_t1') || hasEffect(state, attacker.owner, 'attackBonus')) {
        atkDice[0] = clamp(atkDice[0] + 1, 1, 7); // can exceed 6 with bonus
    }
    if (defendPlayer.techUnlocked.includes('mil_t2') || hasEffect(state, defender.owner, 'defenseBonus')) {
        defDice[0] = clamp(defDice[0] + 1, 1, 7);
    }

    // Compare dice
    let atkLosses = 0, defLosses = 0;
    const comparisons = Math.min(atkDice.length, defDice.length);
    for (let i = 0; i < comparisons; i++) {
        if (atkDice[i] > defDice[i]) {
            defLosses++;
        } else {
            atkLosses++;
        }
    }

    return {
        atkDice,
        defDice,
        atkLosses,
        defLosses,
        attackerName: attacker.name,
        defenderName: defender.name,
        attackPlayerName: attackPlayer.name,
        defendPlayerName: defendPlayer.name,
    };
}

/** Apply combat result and check for territory capture */
function applyCombatResult(state, attackId, defendId, result, troopsCommitted) {
    const attacker = getTerritory(state.territories, attackId);
    const defender = getTerritory(state.territories, defendId);

    attacker.troops -= result.atkLosses;
    defender.troops -= result.defLosses;

    addLog(state,
        `Combat: ${attacker.name} → ${defender.name} | ` +
        `Atk dice [${result.atkDice.join(',')}] vs Def dice [${result.defDice.join(',')}] | ` +
        `Atk lost ${result.atkLosses}, Def lost ${result.defLosses}`
    );

    // Check capture
    if (defender.troops <= 0) {
        defender.troops = 0;
        const moveTroops = Math.min(attacker.troops - MIN_GARRISON, troopsCommitted - result.atkLosses);
        const actualMove = Math.max(1, moveTroops);
        defender.owner = attacker.owner;
        defender.troops = actualMove;
        attacker.troops -= actualMove;
        if (attacker.troops < MIN_GARRISON) attacker.troops = MIN_GARRISON;

        addLog(state, `${state.players[attacker.owner].name} captured ${defender.name}!`);
        return { captured: true, movedTroops: actualMove };
    }

    return { captured: false };
}

/** Check if an attack is valid */
function canAttack(state, attackId, defendId) {
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
function getMaxAttackers(state, territoryId) {
    const t = getTerritory(state.territories, territoryId);
    if (!t) return 0;
    return Math.max(0, t.troops - MIN_GARRISON);
}

module.exports = { resolveCombatRound, applyCombatResult, canAttack, getMaxAttackers };
