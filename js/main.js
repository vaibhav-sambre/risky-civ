// ── Risky Civ — Main Entry Point ────────────────────────────────────

import { createGameState, addLog, clearEffects, getMaxActions } from './state.js';
import { renderMap, updateMap, highlightTerritories, clearHighlights } from './map.js';
import { collectResources, payUpkeep } from './resources.js';
import { deployTroops } from './troops.js';
import { buildStructure } from './structures.js';
import { spendAction, hasActions, resetActions, startAttackPhase } from './actions.js';
import { resolveCombatRound, applyCombatResult, canAttack, getMaxAttackers } from './combat.js';
import { drawCards, playCard, mustPlayCard } from './cards.js';
import { unlockTech } from './tech.js';
import { aiTurn } from './ai.js';
import { getPlayerTerritories, getAdjacentEnemies, canAttackFrom } from './territories.js';
import { WIN_TERRITORY_PERCENT, TOTAL_TERRITORIES } from './config.js';
import {
    updateLeftPanel, updateCardHand, updateTechTree,
    showTerritoryPopup, hideTerritoryPopup,
    showCombatDialog, showGameOver, updateLog
} from './ui.js';

let state;

/**  Show a full-width event banner when a global event fires  */
function showEventNotification(event) {
    if (!event) return;
    let banner = document.getElementById('event-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'event-banner';
        document.body.appendChild(banner);
    }
    banner.innerHTML = `
        <div class="event-banner-content">
            <span class="event-banner-icon">${event.icon}</span>
            <div class="event-banner-text">
                <strong>⚡ GLOBAL EVENT: ${event.name}</strong>
                <span>${event.description}</span>
            </div>
        </div>
    `;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 4000);
}

/** Initialize the game */
function init() {
    state = createGameState();
    addLog(state, '🎮 Game started! Conquer territories and build your empire.');
    addLog(state, 'Spend your 3 actions: deploy troops, build structures, or play cards.');
    addLog(state, 'Then attack enemy territories in the attack phase.');

    // Initial resource collection
    collectResources(state, 0);
    collectResources(state, 1);

    renderAll();
    wireEvents();
}

/** Full render of all UI components */
function renderAll() {
    renderMap(document.getElementById('map-container'), state.territories, onTerritoryClick);
    updateLeftPanel(state);
    updateCardHand(state, onPlayCard);
    updateTechTree(state, onUnlockTech);
    updateLog(state);
}

/** Lighter update (no full map re-render) */
function updateAll() {
    updateMap(state.territories);
    updateLeftPanel(state);
    updateCardHand(state, onPlayCard);
    updateTechTree(state, onUnlockTech);
    updateLog(state);
}

// ── Event Handlers ──────────────────────────────────────────────────

function wireEvents() {
    document.getElementById('end-turn-btn').addEventListener('click', onEndTurnBtn);
}

function onEndTurnBtn() {
    if (state.gameOver) return;
    if (state.currentPlayer !== 0) return;

    if (state.phase === 'action') {
        // Transition to attack phase
        startAttackPhase(state);
        state.attackSource = null;
        clearHighlights();
        hideTerritoryPopup();
        renderAll();
        addLog(state, 'Click your territory to select attack source, then click enemy to attack.');
        updateLog(state);
    } else if (state.phase === 'attack') {
        // End player turn, start AI turn  
        endPlayerTurn();
    }
}

function onTerritoryClick(territoryId) {
    if (state.gameOver) return;
    if (state.currentPlayer !== 0) return;

    state.selectedTerritory = territoryId;

    // In attack phase, handle attack source/target selection
    if (state.phase === 'attack') {
        const t = state.territories.find(t => t.id === territoryId);

        if (!state.attackSource) {
            // Selecting attack source
            if (t.owner === 0 && t.troops > 1) {
                const enemies = getAdjacentEnemies(state.territories, territoryId, 0, state);
                if (enemies.length > 0) {
                    state.attackSource = territoryId;
                    highlightTerritories(enemies.map(e => e.id), 'attack-target');
                }
            }
        } else if (state.attackSource === territoryId) {
            // Deselect
            state.attackSource = null;
            clearHighlights();
            hideTerritoryPopup();
            return;
        } else if (t.owner !== 0) {
            // Attacking!
            if (canAttack(state, state.attackSource, territoryId)) {
                executeAttack(state.attackSource, territoryId);
                return;
            }
        } else {
            // Clicked own territory — switch source
            state.attackSource = null;
            clearHighlights();
            if (t.troops > 1) {
                const enemies = getAdjacentEnemies(state.territories, territoryId, 0, state);
                if (enemies.length > 0) {
                    state.attackSource = territoryId;
                    highlightTerritories(enemies.map(e => e.id), 'attack-target');
                }
            }
        }
    }

    showTerritoryPopup(state, territoryId, {
        onDeploy: onDeploy,
        onBuild: onBuild,
        onAttackSelect: (id) => {
            state.attackSource = id;
            const enemies = getAdjacentEnemies(state.territories, id, 0, state);
            highlightTerritories(enemies.map(e => e.id), 'attack-target');
            hideTerritoryPopup();
            renderAll();
        },
        onAttackTarget: (id) => {
            if (state.attackSource) {
                executeAttack(state.attackSource, id);
            }
        },
        onClose: () => {
            state.selectedTerritory = null;
            if (state.phase !== 'attack') clearHighlights();
        }
    });
}

function onDeploy(territoryId, count) {
    if (!hasActions(state)) return;
    if (state.phase !== 'action') return;

    spendAction(state);
    deployTroops(state, territoryId, count);
    hideTerritoryPopup();
    renderAll();
    checkGameEnd();
}

function onBuild(territoryId, structureType) {
    if (!hasActions(state)) return;
    if (state.phase !== 'action') return;

    spendAction(state);
    const success = buildStructure(state, territoryId, structureType);
    if (!success) {
        // Refund action
        state.actionsRemaining++;
    }
    hideTerritoryPopup();
    renderAll();
}

function onPlayCard(cardIndex) {
    if (!hasActions(state)) return;
    if (state.phase !== 'action') return;

    spendAction(state);
    const success = playCard(state, 0, cardIndex);
    if (!success) {
        // Refund the action (card too expensive)
        state.actionsRemaining++;
    }
    renderAll();
    checkGameEnd();
}

function onUnlockTech(techId) {
    if (!hasActions(state)) return;
    if (state.phase !== 'action') return;

    spendAction(state);
    const success = unlockTech(state, 0, techId);
    if (!success) {
        state.actionsRemaining++;
    }
    renderAll();
    checkGameEnd();
}

function executeAttack(sourceId, targetId) {
    const maxAtk = getMaxAttackers(state, sourceId);
    const attackCount = Math.min(maxAtk, 3);

    const result = resolveCombatRound(state, sourceId, targetId, attackCount);
    const outcome = applyCombatResult(state, sourceId, targetId, result, attackCount);

    state.attackSource = null;
    clearHighlights();
    hideTerritoryPopup();

    showCombatDialog(result, outcome.captured, () => {
        renderAll();
        checkGameEnd();
    });
}

// ── Turn Management ─────────────────────────────────────────────────

async function endPlayerTurn() {
    // Clear temporary effects
    clearEffects(state, 0);
    state.freeBuild = false;
    state.halfCostDeploy = false;
    state.attackSource = null;
    state.selectedTerritory = null;
    clearHighlights();
    hideTerritoryPopup();

    // ── AI Turn ──
    state.currentPlayer = 1;
    state.phase = 'ai';
    resetActions(state);
    addLog(state, '── AI Turn ──');

    // AI: draw cards (may trigger global event)
    const aiEvent = drawCards(state, 1);
    collectResources(state, 1);
    payUpkeep(state, 1);

    if (aiEvent) showEventNotification(aiEvent);
    renderAll();

    await aiTurn(state, () => renderAll());

    clearEffects(state, 1);

    if (checkGameEnd()) return;

    // ── Next Player Turn ──
    state.turn++;
    state.currentPlayer = 0;
    state.phase = 'action';
    resetActions(state);

    // Player: draw cards (may trigger global event)
    const playerEvent = drawCards(state, 0);
    collectResources(state, 0);
    payUpkeep(state, 0);

    addLog(state, `── Turn ${state.turn} ──`);
    if (playerEvent) showEventNotification(playerEvent);
    renderAll();
}

// ── Win/Loss Detection ──────────────────────────────────────────────

function checkGameEnd() {
    if (state.gameOver) {
        const won = state.winner === 0;
        showGameOver(won, won ? 'You achieved World Domination!' : 'The AI achieved World Domination!');
        return true;
    }

    const playerCount = getPlayerTerritories(state.territories, 0).length;
    const aiCount = getPlayerTerritories(state.territories, 1).length;
    const winThreshold = Math.ceil(TOTAL_TERRITORIES * WIN_TERRITORY_PERCENT);

    if (playerCount >= winThreshold) {
        state.gameOver = true;
        state.winner = 0;
        showGameOver(true, `You control ${playerCount} of ${TOTAL_TERRITORIES} territories!`);
        return true;
    }
    if (aiCount >= winThreshold) {
        state.gameOver = true;
        state.winner = 1;
        showGameOver(false, `AI controls ${aiCount} of ${TOTAL_TERRITORIES} territories.`);
        return true;
    }
    if (playerCount === 0) {
        state.gameOver = true;
        state.winner = 1;
        showGameOver(false, 'You lost all your territories!');
        return true;
    }
    if (aiCount === 0) {
        state.gameOver = true;
        state.winner = 0;
        showGameOver(true, 'You eliminated the AI!');
        return true;
    }

    return false;
}

// ── Start ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // ── Intro screen tab switching ──
    const tabs = document.querySelectorAll('.intro-tab');
    const contents = document.querySelectorAll('.intro-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // ── Start game button ──
    document.getElementById('start-game-btn').addEventListener('click', () => {
        const intro = document.getElementById('intro-screen');
        intro.style.transition = 'opacity 0.5s ease';
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.style.display = 'none';
            document.getElementById('game-container').style.display = '';
            init();
        }, 500);
    });
});
