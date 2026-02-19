
import { createGameState, addLog, clearEffects, getMaxActions } from '../js/state.js';
import { aiTurn } from '../js/ai.js';
import { collectResources, payUpkeep } from '../js/resources.js';
import { resetActions } from '../js/actions.js';
import { drawCards } from '../js/cards.js';
// Import dependencies needed for game loop logic
import { createTerritories } from '../js/territories.js';
import { getPlayerTerritories } from '../js/territories.js';

// Configuration
const WIN_PERCENT = 0.75;
const TOTAL_TERRITORIES = 30;

// Mock console.log to suppress output during simulation
const originalLog = console.log;
const quietLog = () => { };

class HeadlessGame {
    constructor(id) {
        this.id = id;
        this.state = createGameState();
        // Initial setup
        collectResources(this.state, 0);
        collectResources(this.state, 1);
        this.winner = null;
    }

    async play(maxTurns = 1000) {
        let turn = 1;
        while (turn <= maxTurns && !this.state.gameOver) {
            this.state.turn = turn;

            // Player 0 (Start Player)
            this.state.currentPlayer = 0;
            resetActions(this.state);
            collectResources(this.state, 0);
            payUpkeep(this.state, 0); // Handles desertion log internally
            drawCards(this.state, 0);

            // Execute AI logic for Player 0
            // logic: aiTurn(state, renderCallback=null, playerId=0)
            await aiTurn(this.state, null, 0);

            clearEffects(this.state, 0);
            this.checkWin();
            if (this.state.gameOver) break;

            // Player 1 (AI / Opponent)
            this.state.currentPlayer = 1;
            resetActions(this.state);
            collectResources(this.state, 1);
            payUpkeep(this.state, 1);
            drawCards(this.state, 1);

            // Execute AI logic for Player 1
            await aiTurn(this.state, null, 1);

            clearEffects(this.state, 1);
            this.checkWin();
            if (this.state.gameOver) break;

            turn++;
        }

        return {
            winner: this.state.winner, // 0, 1, or null (draw)
            turns: turn,
            p0Terr: this.getTerritoryCount(0),
            p1Terr: this.getTerritoryCount(1)
        };
    }

    getTerritoryCount(pid) {
        return this.state.territories.filter(t => t.owner === pid).length;
    }

    checkWin() {
        const p0 = this.getTerritoryCount(0);
        const p1 = this.getTerritoryCount(1);
        const threshold = Math.ceil(TOTAL_TERRITORIES * WIN_PERCENT);

        if (p0 >= threshold || p1 === 0) {
            this.state.gameOver = true;
            this.state.winner = 0;
        } else if (p1 >= threshold || p0 === 0) {
            this.state.gameOver = true;
            this.state.winner = 1;
        }
    }
}

async function runSimulation(count) {
    originalLog(`Starting ${count} simulations...`);

    // Suppress logs for the games
    console.log = quietLog;

    let p0Wins = 0;
    let p1Wins = 0;
    let draws = 0;
    let totalTurns = 0;

    const start = Date.now();

    for (let i = 0; i < count; i++) {
        const game = new HeadlessGame(i);
        const res = await game.play();

        if (res.winner === 0) p0Wins++;
        else if (res.winner === 1) p1Wins++;
        else draws++;

        totalTurns += res.turns;

        if ((i + 1) % 10 === 0) {
            originalLog(`Running... ${i + 1}/${count}`);
        }
    }

    const end = Date.now();
    const duration = (end - start) / 1000;

    // Restore logs
    console.log = originalLog;

    originalLog(`\n── Simulation Results (${count} Games) ──`);
    originalLog(`Time Taken: ${duration.toFixed(2)}s`);
    originalLog(`Player 0 (Start) Wins: ${p0Wins} (${((p0Wins / count) * 100).toFixed(1)}%)`);
    originalLog(`Player 1 (AI) Wins:    ${p1Wins} (${((p1Wins / count) * 100).toFixed(1)}%)`);
    originalLog(`Draws / Timeouts:      ${draws}`);
    originalLog(`Avg Turns:             ${(totalTurns / count).toFixed(1)}`);
}

runSimulation(100);
