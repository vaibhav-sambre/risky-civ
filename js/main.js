// ── Risky Civ — Main Entry Point ────────────────────────────────────

import { API_URL } from './config.js';
import { renderMap, updateMap, highlightTerritories, clearHighlights } from './map.js';
import {
    updateLeftPanel, updateCardHand, updateTechTree,
    showTerritoryPopup, hideTerritoryPopup,
    showCombatDialog, showGameOver, updateLog
} from './ui.js';
import { getAdjacentEnemies, canAttackFrom } from './territories.js';
import { canAttack, getMaxAttackers } from './combat.js';

let state = null;
let gameId = null;

// Local UI state (not synced to server)
let uiState = {
    selectedTerritory: null,
    attackSource: null
};

// ── Event Banner ────────────────────────────────────────────────────
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

// ── API Helpers ─────────────────────────────────────────────────────

async function apiCall(endpoint, method = 'POST', body = {}) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        // If we have a gameId, we might need it, but endpoints are like /api/game/:id/...
        // We construct full URL outside or here. 
        // Let's assume endpoint passed is relative to API_URL
        const url = `${API_URL}${endpoint}`;

        console.log(`API ${method} ${url}`, body);

        const res = await fetch(url, {
            method,
            headers,
            body: method === 'POST' ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'API Request Failed');
        }

        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        alert(`Error: ${err.message}`);
        return null;
    }
}

async function updateGameState(newState) {
    if (!newState) return;

    // Check for new events to show notification
    if (newState.lastEvent && (!state || state.lastEvent?.id !== newState.lastEvent.id)) {
        showEventNotification(newState.lastEvent);
    }

    state = newState;

    // Merge local UI logic
    state.selectedTerritory = uiState.selectedTerritory;
    state.attackSource = uiState.attackSource;

    renderAll();
    checkGameEnd();
}

// ── Initialization ──────────────────────────────────────────────────

async function init() {
    console.log(`Connecting to Game Server at ${API_URL}...`);

    const data = await apiCall('/api/game/new', 'POST');
    if (data) {
        gameId = data.gameId;
        console.log("Game Created, ID:", gameId);
        await updateGameState(data.state);
        wireEvents();
    } else {
        document.body.innerHTML = '<h1>Error connecting to game server. Please ensure server is running.</h1>';
    }
}

// ── Rendering ───────────────────────────────────────────────────────

function renderAll() {
    if (!state) return;
    renderMap(document.getElementById('map-container'), state, onTerritoryClick);
    updateLeftPanel(state);
    updateCardHand(state, onPlayCard);
    updateTechTree(state, onUnlockTech);
    updateLog(state);
}

// ── Event Handlers ──────────────────────────────────────────────────

function wireEvents() {
    const endBtn = document.getElementById('end-turn-btn');
    // Remove old listeners to prevent duplicates if any
    const newBtn = endBtn.cloneNode(true);
    endBtn.parentNode.replaceChild(newBtn, endBtn);
    newBtn.addEventListener('click', onEndTurnBtn);
}

function onEndTurnBtn() {
    if (!state || state.gameOver) return;

    if (state.phase === 'action') {
        // Just switching UI phase to attack?
        // Wait, server manages phase.
        // If I click "Start Attack Phase", I call 'end-phase' endpoint on server?
        // Server's 'endPhase' logic: Action -> Attack -> AI.
        // Yes.
        apiCall(`/api/game/${gameId}/end-phase`, 'POST').then(data => {
            if (data) updateGameState(data.state);
        });

        // Clear local selection
        uiState.attackSource = null;
        uiState.selectedTerritory = null;
        clearHighlights();
        hideTerritoryPopup();

    } else if (state.phase === 'attack') {
        // End attack phase -> AI Turn
        // Calls end-phase again
        apiCall(`/api/game/${gameId}/end-phase`, 'POST').then(data => {
            if (data) updateGameState(data.state);
        });
    }
}

function onTerritoryClick(territoryId) {
    if (!state || state.gameOver || state.currentPlayer !== 0) return;

    uiState.selectedTerritory = territoryId;
    state.selectedTerritory = territoryId; // sync for UI rendering immediately if helpful

    // Attack Phase Logic
    if (state.phase === 'attack') {
        const t = state.territories.find(t => t.id === territoryId);

        if (!uiState.attackSource) {
            // Select Source
            if (t.owner === 0 && t.troops > 1) {
                const enemies = getAdjacentEnemies(state.territories, territoryId, 0, state);
                if (enemies.length > 0) {
                    uiState.attackSource = territoryId;
                    state.attackSource = territoryId;
                    highlightTerritories(enemies.map(e => e.id), 'attack-target');
                }
            }
        } else if (uiState.attackSource === territoryId) {
            // Deselect
            uiState.attackSource = null;
            state.attackSource = null;
            clearHighlights();
            hideTerritoryPopup();
            renderAll(); // re-render to clear highlights
            return;
        } else if (t.owner !== 0) {
            // Attack Target?
            if (canAttack(state, uiState.attackSource, territoryId)) {
                executeAttack(uiState.attackSource, territoryId);
                return;
            } else {
                // Invalid target, select it normally
                // uiState.attackSource = null; 
                // clearHighlights();
            }
        } else {
            // Clicked another own territory -> switch source
            uiState.attackSource = null;
            clearHighlights();
            if (t.troops > 1) {
                const enemies = getAdjacentEnemies(state.territories, territoryId, 0, state);
                if (enemies.length > 0) {
                    uiState.attackSource = territoryId;
                    state.attackSource = territoryId;
                    highlightTerritories(enemies.map(e => e.id), 'attack-target');
                }
            }
        }
    }

    // Show Popup
    showTerritoryPopup(state, territoryId, {
        onDeploy: onDeploy,
        onBuild: onBuild,
        onAttackSelect: (id) => {
            uiState.attackSource = id;
            state.attackSource = id;
            const enemies = getAdjacentEnemies(state.territories, id, 0, state);
            highlightTerritories(enemies.map(e => e.id), 'attack-target');
            hideTerritoryPopup();
            renderAll();
        },
        onAttackTarget: (id) => {
            if (uiState.attackSource) {
                executeAttack(uiState.attackSource, id);
            }
        },
        onClose: () => {
            uiState.selectedTerritory = null;
            state.selectedTerritory = null;
            if (state.phase !== 'attack') clearHighlights();
            renderAll();
        }
    });

    renderAll(); // update map highlights etc
}

async function onDeploy(territoryId, count) {
    const data = await apiCall(`/api/game/${gameId}/deploy`, 'POST', { territoryId, count });
    if (data) {
        updateGameState(data.state);
        hideTerritoryPopup();
    }
}

async function onBuild(territoryId, structureType) {
    const data = await apiCall(`/api/game/${gameId}/build`, 'POST', { territoryId, structureType });
    if (data) {
        updateGameState(data.state);
        hideTerritoryPopup();
    }
}

async function onPlayCard(cardIndex) {
    const data = await apiCall(`/api/game/${gameId}/play-card`, 'POST', { cardIndex });
    if (data) {
        updateGameState(data.state);
    }
}

async function onUnlockTech(techId) {
    const data = await apiCall(`/api/game/${gameId}/unlock-tech`, 'POST', { techId });
    if (data) {
        updateGameState(data.state);
    }
}

async function executeAttack(sourceId, targetId) {
    const data = await apiCall(`/api/game/${gameId}/attack`, 'POST', { sourceId, targetId });
    if (data) {
        // Server returns result in `data.result` and captured bool in `data.captured`
        // But wait, my endpoint `attack` returns { state, result, captured }

        uiState.attackSource = null;
        state.attackSource = null;
        clearHighlights();
        hideTerritoryPopup();

        updateGameState(data.state);

        if (data.result) {
            showCombatDialog(data.result, data.captured, () => {
                // remove dialog
            });
        }
    }
}

function checkGameEnd() {
    if (state.gameOver) {
        const won = state.winner === 0;
        showGameOver(won, won ? 'You achieved World Domination!' : 'The AI achieved World Domination!');
    }
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
