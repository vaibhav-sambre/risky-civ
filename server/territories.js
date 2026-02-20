const { BASE_TERRITORY_RESOURCES } = require('./config');
const { generateMap } = require('./mapgen');
// ── Risky Civ — Territory Management ────────────────────────────────

// Store the generated map data (set once per game init)
let _continentData = {};
let _seaRoutes = [];

/**
 * Create territories using a procedurally generated island-continent map.
 * Each call produces a unique random map layout with sea-separated continents.
 */
function createTerritories() {
    const { territories: mapTerritories, continents, seaRoutes } = generateMap();
    _continentData = continents;
    _seaRoutes = seaRoutes;

    return mapTerritories.map(t => ({
        ...t,
        owner: null,
        troops: 0,
        structures: [],
        baseResources: { ...BASE_TERRITORY_RESOURCES },
    }));
}

/** Get the continent metadata generated alongside this map */
function getContinentData() {
    return _continentData;
}

/** Get the sea routes for rendering */
function getSeaRoutes() {
    return _seaRoutes;
}

/** Look up a territory by id */
function getTerritory(territories, id) {
    return territories.find(t => t.id === id);
}

/** Get all territories owned by a player */
function getPlayerTerritories(territories, playerId) {
    return territories.filter(t => t.owner === playerId);
}

/**
 * Get adjacent territories that belong to an enemy (or are neutral).
 * If state is provided, respects inter-continental combat tech restriction.
 * Sea-adjacent enemies are only included if the player has 'intercontinentalCombat'.
 */
function getAdjacentEnemies(territories, territoryId, playerId, state = null) {
    const t = getTerritory(territories, territoryId);
    if (!t) return [];

    // Land adjacencies — always available
    const landEnemies = t.adjacent
        .map(id => getTerritory(territories, id))
        .filter(adj => adj && adj.owner !== playerId);

    // Sea adjacencies — only if tech is unlocked
    let seaEnemies = [];
    if (t.seaAdjacent && t.seaAdjacent.length > 0) {
        const hasNavalTech = state
            ? (state.players[playerId].techUnlocked.includes('mil_t5') && !state.players[playerId].tempEffects['cyberattack'])
            : false;
        if (hasNavalTech) {
            seaEnemies = t.seaAdjacent
                .map(id => getTerritory(territories, id))
                .filter(adj => adj && adj.owner !== playerId);
        }
    }

    return [...landEnemies, ...seaEnemies];
}

/** Check if a player can attack from a given territory */
function canAttackFrom(territories, territoryId, playerId, state = null) {
    const t = getTerritory(territories, territoryId);
    if (t.owner !== playerId || t.troops <= 1) return false;
    return getAdjacentEnemies(territories, territoryId, playerId, state).length > 0;
}

/** Get all continents and whether a player controls them fully */
function getControlledContinents(territories, playerId) {
    const continents = {};
    for (const t of territories) {
        if (!continents[t.continent]) continents[t.continent] = { total: 0, owned: 0 };
        continents[t.continent].total++;
        if (t.owner === playerId) continents[t.continent].owned++;
    }
    const controlled = [];
    for (const [name, data] of Object.entries(continents)) {
        if (data.owned === data.total) controlled.push(name);
    }
    return controlled;
}

/** Get unclaimed (neutral) territories */
function getNeutralTerritories(territories) {
    return territories.filter(t => t.owner === null);
}

module.exports = { createTerritories, getContinentData, getSeaRoutes, getTerritory, getPlayerTerritories, getAdjacentEnemies, canAttackFrom, getControlledContinents, getNeutralTerritories };
