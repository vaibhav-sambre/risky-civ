const { STARTING_RESOURCES, BASE_ACTIONS_PER_TURN, STARTING_HAND_SIZE, BONUS_CARDS, EVENT_CARDS, PLAYER_NAMES, PLAYER_COLORS } = require('./config');
const { createTerritories, getContinentData, getSeaRoutes } = require('./territories');
const { shuffle, deepClone } = require('./utils');

// ── Risky Civ — Game State Management ───────────────────────────────

function createGameState() {
    // Build bonus deck (two copies for variety) — these go into player hands
    const bonusDeck = shuffle([...BONUS_CARDS.map(c => ({ ...c })), ...BONUS_CARDS.map(c => ({ ...c }))]);

    // Build event deck (one copy) — these trigger on draw and don't go to hand
    const eventDeck = shuffle([...EVENT_CARDS.map(c => ({ ...c }))]);

    const players = [0, 1].map(id => ({
        id,
        name: PLAYER_NAMES[id],
        color: PLAYER_COLORS[id],
        resources: { ...STARTING_RESOURCES },
        hand: [],
        techUnlocked: [],       // array of tech ids
        tempEffects: {},        // turn-scoped effects like attackBonus, researchHalted, etc.
    }));

    // Deal starting hands (only bonus cards)
    for (const p of players) {
        for (let i = 0; i < STARTING_HAND_SIZE; i++) {
            if (bonusDeck.length > 0) p.hand.push(bonusDeck.pop());
        }
    }

    const territories = createTerritories();
    const continentData = getContinentData();

    // Assign territories evenly (shuffle, alternate)
    const territoryOrder = shuffle([...Array(territories.length).keys()]);
    territoryOrder.forEach((idx, i) => {
        const owner = i % 2;
        territories[idx].owner = owner;
        territories[idx].troops = 2; // starting garrison
    });

    return {
        turn: 1,
        continentData,
        seaRoutes: getSeaRoutes(),
        currentPlayer: 0,
        phase: 'action',         // 'action' | 'attack' | 'ai'
        actionsRemaining: BASE_ACTIONS_PER_TURN,
        players,
        territories,
        deck: bonusDeck,
        eventDeck,
        discard: [],
        selectedTerritory: null,
        attackSource: null,
        gameOver: false,
        winner: null,
        log: [],
        // temporary combat state
        combatResult: null,
        // for card effects that need territory selection
        pendingCardEffect: null,
        // free build from card
        freeBuild: false,
        // half cost deploy
        halfCostDeploy: false,
        // last triggered event (for UI notification)
        lastEvent: null,
    };
}

function addLog(state, message) {
    state.log.push({ turn: state.turn, message });
    if (state.log.length > 100) state.log.shift();
}

function getMaxActions(state) {
    const player = state.players[state.currentPlayer];
    let max = BASE_ACTIONS_PER_TURN;
    if (player.techUnlocked.includes('sci_t2')) max = 4;
    return max;
}

function hasEffect(state, playerId, effectName) {
    return state.players[playerId].tempEffects[effectName] === true;
}

function setEffect(state, playerId, effectName, value = true) {
    state.players[playerId].tempEffects[effectName] = value;
}

function clearEffects(state, playerId) {
    state.players[playerId].tempEffects = {};
}

module.exports = { createGameState, addLog, getMaxActions, hasEffect, setEffect, clearEffects };
