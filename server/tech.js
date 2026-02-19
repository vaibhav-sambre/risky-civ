const { TECH_TREE } = require('./config');
const { addLog } = require('./state');
// ── Risky Civ — Tech Tree ───────────────────────────────────────────

/** Get the next unlockable tech in a branch for a player */
function getNextTech(state, playerId, branch) {
    const player = state.players[playerId];
    const techs = TECH_TREE[branch];
    for (const tech of techs) {
        if (!player.techUnlocked.includes(tech.id)) return tech;
    }
    return null; // branch complete
}

/** Check if a player can afford the next tech in a branch */
function canAffordTech(state, playerId, techId) {
    const player = state.players[playerId];
    for (const branch of Object.values(TECH_TREE)) {
        const tech = branch.find(t => t.id === techId);
        if (tech) {
            // Must have unlocked all previous techs in branch
            const branchTechs = branch;
            const idx = branchTechs.indexOf(tech);
            for (let i = 0; i < idx; i++) {
                if (!player.techUnlocked.includes(branchTechs[i].id)) return false;
            }
            return player.resources.research >= tech.cost;
        }
    }
    return false;
}

/** Unlock a technology */
function unlockTech(state, playerId, techId) {
    const player = state.players[playerId];
    if (!canAffordTech(state, playerId, techId)) return false;

    for (const branch of Object.values(TECH_TREE)) {
        const tech = branch.find(t => t.id === techId);
        if (tech) {
            player.resources.research -= tech.cost;
            player.techUnlocked.push(tech.id);
            addLog(state, `${player.name} unlocked ${tech.name}!`);

            // Check for world domination win
            if (tech.effect === 'worldDomination') {
                state.gameOver = true;
                state.winner = playerId;
                addLog(state, `${player.name} achieved World Domination!`);
            }
            return true;
        }
    }
    return false;
}

/** Get the full tech tree status for a player */
function getTechTreeStatus(state, playerId) {
    const player = state.players[playerId];
    const status = {};
    for (const [branch, techs] of Object.entries(TECH_TREE)) {
        status[branch] = techs.map(tech => ({
            ...tech,
            unlocked: player.techUnlocked.includes(tech.id),
            canAfford: canAffordTech(state, playerId, tech.id),
        }));
    }
    return status;
}

module.exports = { getNextTech, canAffordTech, unlockTech, getTechTreeStatus };
