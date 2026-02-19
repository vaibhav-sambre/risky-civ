// ── Risky Civ — UI Rendering ────────────────────────────────────────

import {
    STRUCTURES, TECH_TREE, PLAYER_COLORS, PLAYER_NAMES,
    WIN_TERRITORY_PERCENT, TOTAL_TERRITORIES, BASE_ACTIONS_PER_TURN
} from './config.js';
import { getPlayerTerritories, getTerritory, getAdjacentEnemies } from './territories.js';
import { getBuildableStructures } from './structures.js';
import { canAffordCard } from './cards.js';
import { getTechTreeStatus } from './tech.js';
import { getDeployCount, getDeployCost } from './troops.js';
import { getMaxAttackers } from './combat.js';

function getMaxActions(state) {
    const player = state.players[state.currentPlayer];
    let max = BASE_ACTIONS_PER_TURN;
    if (player.techUnlocked.includes('sci_t2')) max = 4;
    return max;
}

// ── Left Panel ──────────────────────────────────────────────────────
export function updateLeftPanel(state) {
    const player = state.players[0];
    const owned = getPlayerTerritories(state.territories, 0);

    // Resources
    document.getElementById('res-production').textContent = player.resources.production;
    document.getElementById('res-research').textContent = player.resources.research;
    document.getElementById('res-money').textContent = player.resources.money;

    // Territory count
    document.getElementById('territory-count').textContent = `${owned.length} / ${TOTAL_TERRITORIES}`;

    // Turn counter
    document.getElementById('turn-counter').textContent = `Turn ${state.turn}`;

    // Phase indicator
    const phaseEl = document.getElementById('phase-indicator');
    if (state.phase === 'action') {
        phaseEl.textContent = '⚡ Action Phase';
        phaseEl.className = 'phase-badge action-phase';
    } else if (state.phase === 'attack') {
        phaseEl.textContent = '⚔️ Attack Phase';
        phaseEl.className = 'phase-badge attack-phase';
    } else {
        phaseEl.textContent = '🤖 AI Turn';
        phaseEl.className = 'phase-badge ai-phase';
    }

    // Action tokens
    const tokensEl = document.getElementById('action-tokens');
    tokensEl.innerHTML = '';
    const maxActions = getMaxActions(state);
    for (let i = 0; i < maxActions; i++) {
        const token = document.createElement('div');
        token.className = 'action-token' + (i < state.actionsRemaining ? ' active' : ' spent');
        token.innerHTML = '⚡';
        tokensEl.appendChild(token);
    }

    // End turn / Start attack button
    const endBtn = document.getElementById('end-turn-btn');
    if (state.currentPlayer !== 0 || state.gameOver) {
        endBtn.style.display = 'none';
    } else {
        endBtn.style.display = 'block';
        if (state.phase === 'action') {
            endBtn.textContent = 'Start Attack Phase ⚔️';
            endBtn.className = 'btn btn-attack';
        } else {
            endBtn.textContent = 'End Turn →';
            endBtn.className = 'btn btn-end';
        }
    }
}

// ── Card Hand (Bottom Panel) ────────────────────────────────────────
export function updateCardHand(state, onPlayCard) {
    const container = document.getElementById('card-hand');
    container.innerHTML = '';
    const player = state.players[0];

    if (state.currentPlayer !== 0) {
        container.innerHTML = '<div class="card-wait">Waiting for AI...</div>';
        return;
    }

    player.hand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        const cost = card.cost || 0;
        const affordable = state.players[0].resources.money >= cost;
        cardEl.className = `game-card card-${card.type}`;
        cardEl.innerHTML = `
      <div class="card-icon">${card.icon}</div>
      <div class="card-title">${card.name}</div>
      <div class="card-desc">${card.description}</div>
      <div class="card-footer">
        <span class="card-category">${card.category}</span>
        ${cost > 0 ? `<span class="card-cost">💰 ${cost}</span>` : '<span class="card-cost free">FREE</span>'}
      </div>
    `;

        if (state.phase === 'action' && state.actionsRemaining > 0 && affordable) {
            cardEl.classList.add('playable');
            cardEl.addEventListener('click', () => onPlayCard(index));
        } else if (state.phase === 'action' && state.actionsRemaining > 0 && !affordable) {
            cardEl.classList.add('too-expensive');
        }
        container.appendChild(cardEl);
    });

    // Hand count
    const countEl = document.getElementById('hand-count');
    if (countEl) countEl.textContent = `${player.hand.length} / 7`;
}

// ── Tech Tree (Right Panel) ─────────────────────────────────────────
export function updateTechTree(state, onUnlockTech) {
    const container = document.getElementById('tech-tree');
    container.innerHTML = '';

    const status = getTechTreeStatus(state, 0);
    const branchNames = { military: '⚔️ Military', economic: '💰 Economic', science: '🔬 Science' };
    const branchColors = { military: '#e74c3c', economic: '#f39c12', science: '#3498db' };

    for (const [branch, techs] of Object.entries(status)) {
        const branchEl = document.createElement('div');
        branchEl.className = 'tech-branch';

        const header = document.createElement('div');
        header.className = 'tech-branch-header';
        header.style.borderLeftColor = branchColors[branch];
        header.textContent = branchNames[branch];
        branchEl.appendChild(header);

        for (const tech of techs) {
            const techEl = document.createElement('div');
            techEl.className = 'tech-node ' +
                (tech.unlocked ? 'unlocked' : tech.canAfford ? 'affordable' : 'locked');

            techEl.innerHTML = `
        <div class="tech-name">${tech.name}</div>
        <div class="tech-desc">${tech.description}</div>
        <div class="tech-cost">🔬 ${tech.cost}</div>
      `;

            if (!tech.unlocked && tech.canAfford && state.currentPlayer === 0) {
                techEl.classList.add('clickable');
                techEl.addEventListener('click', () => onUnlockTech(tech.id));
            }

            branchEl.appendChild(techEl);
        }

        container.appendChild(branchEl);
    }
}

// ── Territory Popup ─────────────────────────────────────────────────
export function showTerritoryPopup(state, territoryId, callbacks) {
    const t = getTerritory(state.territories, territoryId);
    if (!t) return;

    const popup = document.getElementById('territory-popup');
    const isOwned = t.owner === 0;
    const isEnemy = t.owner === 1;
    const isNeutral = t.owner === null;

    let ownerLabel = isNeutral ? 'Neutral' : PLAYER_NAMES[t.owner];
    let ownerColor = isNeutral ? '#888' : PLAYER_COLORS[t.owner];

    // Structures list
    const structList = t.structures.length > 0
        ? t.structures.map(s => `${STRUCTURES[s].icon} ${STRUCTURES[s].name}`).join(', ')
        : 'None';

    // Resource output
    let resOutput = `⚙️ ${t.baseResources.production} | 🔬 ${t.baseResources.research} | 💰 ${t.baseResources.money}`;

    let actionsHTML = '';

    if (state.currentPlayer === 0 && !state.gameOver) {
        // Action phase: deploy & build
        if (state.phase === 'action' && isOwned) {
            const deployCost = getDeployCost(state, 0);
            const maxAffordable = Math.floor(state.players[0].resources.production / deployCost);

            if (state.actionsRemaining > 0 && maxAffordable > 0) {
                actionsHTML += `
                <div class="deploy-section">
                  <div class="build-label">Deploy Troops (1 Action):</div>
                  <div class="deploy-stepper">
                    <button class="stepper-btn" id="deploy-minus">−</button>
                    <span class="stepper-value" id="deploy-count">1</span>
                    <button class="stepper-btn" id="deploy-plus">+</button>
                  </div>
                  <div class="deploy-cost-label" id="deploy-cost-label">Cost: ⚙️ ${deployCost}</div>
                  <button class="btn btn-deploy" id="btn-deploy">Deploy 1 Troop</button>
                </div>`;

                // Build structure buttons
                const buildable = getBuildableStructures(state, territoryId);
                if (buildable.length > 0) {
                    actionsHTML += '<div class="build-section"><div class="build-label">Build Structure (1 Action):</div>';
                    for (const s of buildable) {
                        actionsHTML += `<button class="btn btn-build ${!s.canAfford && !state.freeBuild ? 'disabled' : ''}"
              data-type="${s.type}" ${!s.canAfford && !state.freeBuild ? 'disabled' : ''}>
              ${s.icon} ${s.name} (⚙️ ${s.cost.production} 💰 ${s.cost.money})</button>`;
                    }
                    actionsHTML += '</div>';
                }
            } else if (state.actionsRemaining > 0) {
                actionsHTML += `<div class="deploy-section"><div class="build-label">Deploy Troops:</div>
                  <div class="deploy-cost-label" style="color:var(--accent-red)">Not enough ⚙️ Production</div></div>`;

                const buildable = getBuildableStructures(state, territoryId);
                if (buildable.length > 0) {
                    actionsHTML += '<div class="build-section"><div class="build-label">Build Structure (1 Action):</div>';
                    for (const s of buildable) {
                        actionsHTML += `<button class="btn btn-build ${!s.canAfford && !state.freeBuild ? 'disabled' : ''}"
              data-type="${s.type}" ${!s.canAfford && !state.freeBuild ? 'disabled' : ''}>
              ${s.icon} ${s.name} (⚙️ ${s.cost.production} 💰 ${s.cost.money})</button>`;
                    }
                    actionsHTML += '</div>';
                }
            }
        }

        // Attack phase: select as source or target
        if (state.phase === 'attack' && isOwned && t.troops > 1) {
            const enemies = getAdjacentEnemies(state.territories, territoryId, 0, state);
            if (enemies.length > 0) {
                actionsHTML += `<button class="btn btn-attack-select" id="btn-attack-select">
          ⚔️ Attack From Here (${t.troops - 1} available)</button>`;
            }
        }

        // Attack target selection
        if (state.phase === 'attack' && state.attackSource && !isOwned) {
            const source = getTerritory(state.territories, state.attackSource);
            // Check adjacency (land or sea) using getAdjacentEnemies on source to be consistent
            const enemies = getAdjacentEnemies(state.territories, state.attackSource, 0, state);
            if (enemies.find(e => e.id === territoryId)) {
                const maxAtk = getMaxAttackers(state, state.attackSource);
                actionsHTML += `<button class="btn btn-attack-target" id="btn-attack-target">
          ⚔️ Attack! (up to ${Math.min(maxAtk, 3)} dice)</button>`;
            }
        }
    }

    popup.innerHTML = `
    <div class="popup-header" style="border-left: 4px solid ${ownerColor}">
      <span class="popup-title">${t.name}</span>
      <button class="popup-close" id="popup-close">✕</button>
    </div>
    <div class="popup-body">
      <div class="popup-stat"><span>Owner</span><span style="color:${ownerColor}">${ownerLabel}</span></div>
      <div class="popup-stat"><span>Troops</span><span>🪖 ${t.troops}</span></div>
      <div class="popup-stat"><span>Base Output</span><span>${resOutput}</span></div>
      <div class="popup-stat"><span>Structures</span><span>${structList}</span></div>
      <div class="popup-stat"><span>Continent</span><span>${formatContinent(t.continent, state.continentData)}</span></div>
      ${actionsHTML ? `<div class="popup-actions">${actionsHTML}</div>` : ''}
    </div>
  `;

    popup.classList.add('visible');

    // Wire up handlers
    document.getElementById('popup-close')?.addEventListener('click', () => {
        popup.classList.remove('visible');
        state.selectedTerritory = null;
        state.attackSource = null;
        callbacks.onClose?.();
    });

    // Deploy stepper logic
    const deployMinus = document.getElementById('deploy-minus');
    const deployPlus = document.getElementById('deploy-plus');
    const deployCountEl = document.getElementById('deploy-count');
    const deployCostLabel = document.getElementById('deploy-cost-label');
    const deployBtn = document.getElementById('btn-deploy');

    if (deployMinus && deployPlus && deployCountEl && deployBtn) {
        const deployCost = getDeployCost(state, 0);
        const maxAffordable = Math.floor(state.players[0].resources.production / deployCost);
        let currentCount = 1;

        const updateDeployUI = () => {
            deployCountEl.textContent = currentCount;
            deployCostLabel.textContent = `Cost: ⚙️ ${currentCount * deployCost}`;
            deployBtn.textContent = `Deploy ${currentCount} Troop${currentCount > 1 ? 's' : ''}`;
            deployMinus.disabled = currentCount <= 1;
            deployPlus.disabled = currentCount >= maxAffordable;
        };

        deployMinus.addEventListener('click', () => {
            if (currentCount > 1) { currentCount--; updateDeployUI(); }
        });
        deployPlus.addEventListener('click', () => {
            if (currentCount < maxAffordable) { currentCount++; updateDeployUI(); }
        });
        deployBtn.addEventListener('click', () => {
            callbacks.onDeploy?.(territoryId, currentCount);
        });
        updateDeployUI();
    }

    document.querySelectorAll('.btn-build').forEach(btn => {
        btn.addEventListener('click', () => {
            callbacks.onBuild?.(territoryId, btn.dataset.type);
        });
    });

    document.getElementById('btn-attack-select')?.addEventListener('click', () => {
        callbacks.onAttackSelect?.(territoryId);
    });

    document.getElementById('btn-attack-target')?.addEventListener('click', () => {
        callbacks.onAttackTarget?.(territoryId);
    });
}

export function hideTerritoryPopup() {
    document.getElementById('territory-popup')?.classList.remove('visible');
}

// ── Combat Dialog ───────────────────────────────────────────────────
export function showCombatDialog(result, captured, onContinue) {
    const dialog = document.getElementById('combat-dialog');

    const atkDiceHTML = result.atkDice.map(d => `<span class="die atk-die">${getDieUnicode(d)}</span>`).join('');
    const defDiceHTML = result.defDice.map(d => `<span class="die def-die">${getDieUnicode(d)}</span>`).join('');

    dialog.innerHTML = `
    <div class="combat-content">
      <div class="combat-title">⚔️ Combat Result</div>
      <div class="combat-row">
        <div class="combat-side atk-side">
          <div class="combat-label">Attacker — ${result.attackerName}</div>
          <div class="combat-dice">${atkDiceHTML}</div>
          <div class="combat-loss">Lost ${result.atkLosses} troop(s)</div>
        </div>
        <div class="combat-vs">VS</div>
        <div class="combat-side def-side">
          <div class="combat-label">Defender — ${result.defenderName}</div>
          <div class="combat-dice">${defDiceHTML}</div>
          <div class="combat-loss">Lost ${result.defLosses} troop(s)</div>
        </div>
      </div>
      ${captured ? '<div class="combat-captured">🏴 Territory Captured!</div>' : ''}
      <button class="btn btn-continue" id="combat-continue">Continue</button>
    </div>
  `;

    dialog.classList.add('visible');
    document.getElementById('combat-continue').addEventListener('click', () => {
        dialog.classList.remove('visible');
        onContinue?.();
    });
}

function getDieUnicode(val) {
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return dice[Math.min(val, 6) - 1] || '🎲';
}

// ── Game Over Screen ────────────────────────────────────────────────
export function showGameOver(won, reason) {
    const overlay = document.getElementById('game-over');
    overlay.innerHTML = `
    <div class="game-over-content">
      <div class="game-over-icon">${won ? '🏆' : '💀'}</div>
      <div class="game-over-title">${won ? 'VICTORY!' : 'DEFEAT'}</div>
      <div class="game-over-reason">${reason}</div>
      <button class="btn btn-restart" id="btn-restart">Play Again</button>
    </div>
  `;
    overlay.classList.add('visible');
    document.getElementById('btn-restart').addEventListener('click', () => {
        location.reload();
    });
}

// ── Game Log ────────────────────────────────────────────────────────
export function updateLog(state) {
    const logEl = document.getElementById('game-log');
    if (!logEl) return;
    const recent = state.log.slice(-8);
    logEl.innerHTML = recent.map(l =>
        `<div class="log-entry"><span class="log-turn">T${l.turn}</span> ${l.message}</div>`
    ).join('');
    logEl.scrollTop = logEl.scrollHeight;
}

// ── Helpers ─────────────────────────────────────────────────────────
function formatContinent(id, continentData) {
    return continentData?.[id]?.name || id;
}
