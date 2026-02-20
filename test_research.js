// test_research.js
const { createGameState, clearEffects } = require('./server/state');
const { aiTurn } = require('./server/ai');
const { collectResources, payUpkeep } = require('./server/resources');
const { resetActions } = require('./server/actions');
const { drawCards } = require('./server/cards');
const { WIN_TERRITORY_PERCENT, TOTAL_TERRITORIES } = require('./server/config');

// Override logging
global.console.log = () => { };

class EcoSim {
    getTerritoryCount(state, pid) {
        return state.territories.filter(t => t.owner === pid).length;
    }

    checkWin(state) {
        const p0 = this.getTerritoryCount(state, 0);
        const p1 = this.getTerritoryCount(state, 1);
        const threshold = Math.ceil(TOTAL_TERRITORIES * WIN_TERRITORY_PERCENT);

        if (p0 >= threshold || p1 === 0) {
            state.gameOver = true;
            state.winner = 0;
        } else if (p1 >= threshold || p0 === 0) {
            state.gameOver = true;
            state.winner = 1;
        }
    }

    async playOneGame() {
        const state = createGameState();

        let zeroResTurnsP0 = 0;
        let zeroResTurnsP1 = 0;

        let totalResP0 = 0;
        let totalResP1 = 0;

        // Give both players an AI brain
        let turn = 1;
        while (turn <= 200 && !state.gameOver) {
            state.turn = turn;

            // Player 0 (AI)
            state.currentPlayer = 0;
            resetActions(state);
            collectResources(state, 0);
            payUpkeep(state, 0);
            drawCards(state, 0);

            totalResP0 += state.players[0].resources.research;

            await aiTurn(state, null, 0);
            if (state.players[0].resources.research === 0) zeroResTurnsP0++;
            clearEffects(state, 0);
            this.checkWin(state);
            if (state.gameOver) break;

            // Player 1 (AI)
            state.currentPlayer = 1;
            resetActions(state);
            collectResources(state, 1);
            payUpkeep(state, 1);
            drawCards(state, 1);

            totalResP1 += state.players[1].resources.research;

            await aiTurn(state, null, 1);
            if (state.players[1].resources.research === 0) zeroResTurnsP1++;
            clearEffects(state, 1);
            this.checkWin(state);

            turn++;
        }

        return {
            turns: turn,
            zeroResTurnsP0,
            zeroResTurnsP1,
            avgResP0: totalResP0 / turn,
            avgResP1: totalResP1 / turn,
            finalResP0: state.players[0].resources.research,
            finalResP1: state.players[1].resources.research
        };
    }
}

async function runSims() {
    // Restore logging for summary
    const _log = process.stdout.write.bind(process.stdout);
    function log(msg) { _log(msg + '\n'); }

    const N = 1000;
    log(`Running ${N} AI vs AI games to analyze the RESEARCH economy...\n`);

    let totalZeroP0 = 0;
    let totalZeroP1 = 0;
    let gamesWithZeroRes = 0;
    let totalTurns = 0;
    let globalAvgResP0 = 0;
    let globalAvgResP1 = 0;

    const sim = new EcoSim();
    for (let i = 0; i < N; i++) {
        const res = await sim.playOneGame();
        totalTurns += res.turns;
        totalZeroP0 += res.zeroResTurnsP0;
        totalZeroP1 += res.zeroResTurnsP1;
        globalAvgResP0 += res.avgResP0;
        globalAvgResP1 += res.avgResP1;

        if (res.zeroResTurnsP0 > 0 || res.zeroResTurnsP1 > 0) {
            gamesWithZeroRes++;
        }
    }

    log(`=== Research Simulation Results (${N} games) ===`);
    log(`Average game length: ${(totalTurns / N).toFixed(1)} turns`);
    log(`Average Research held per turn (P0): ${(globalAvgResP0 / N).toFixed(1)} 🔬`);
    log(`Average Research held per turn (P1): ${(globalAvgResP1 / N).toFixed(1)} 🔬`);
    log(`Games where a player hit exactly 0 Research: ${gamesWithZeroRes} (${((gamesWithZeroRes / N) * 100).toFixed(1)}%)`);
    log(`Total turns played across all games: ${totalTurns * 2} player turns`);
    log(`Total turns a player had exactly 0 Research: ${totalZeroP0 + totalZeroP1} turns (${(((totalZeroP0 + totalZeroP1) / (totalTurns * 2)) * 100).toFixed(2)}%)`);
}

runSims();
