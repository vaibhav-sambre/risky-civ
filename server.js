// ── Risky Civ — Express Server with Game API ────────────────────────
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const game = require('./server/game');

const app = express();
const port = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors({
    origin: '*', // Allow all origins solely to prevent CORS issues
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ── In-memory game store ────────────────────────────────────────────
const games = new Map();

// ── Health Check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Risky Civ Server is running', activeGames: games.size });
});

// ── Create New Game ─────────────────────────────────────────────────
app.post('/api/game/new', (req, res) => {
    try {
        const gameId = uuidv4();
        const state = game.createGame();
        games.set(gameId, state);
        console.log(`New game created: ${gameId}`);
        res.json({ gameId, state });
    } catch (err) {
        console.error('Error creating game:', err);
        res.status(500).json({ error: 'Failed to create game' });
    }
});

// ── Get Game State ──────────────────────────────────────────────────
app.get('/api/game/:id/state', (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    res.json({ state });
});

// ── Deploy Troops ───────────────────────────────────────────────────
app.post('/api/game/:id/deploy', (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    const { territoryId, count } = req.body;
    const result = game.deploy(state, territoryId, count);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ state });
});

// ── Build Structure ─────────────────────────────────────────────────
app.post('/api/game/:id/build', (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    const { territoryId, type } = req.body;
    const result = game.build(state, territoryId, type);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ state });
});

// ── Play Card ───────────────────────────────────────────────────────
app.post('/api/game/:id/play-card', (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    const { cardIndex, targetId } = req.body;
    const result = game.playCardAction(state, cardIndex, targetId);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ state });
});

// ── Unlock Tech ─────────────────────────────────────────────────────
app.post('/api/game/:id/unlock-tech', (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    const { techId } = req.body;
    const result = game.unlock(state, techId);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ state });
});

// ── Attack ──────────────────────────────────────────────────────────
app.post('/api/game/:id/attack', (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    const { sourceId, targetId } = req.body;
    const result = game.attack(state, sourceId, targetId);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ state, combatResult: result.combatResult, captured: result.captured });
});

// ── End Phase ───────────────────────────────────────────────────────
app.post('/api/game/:id/end-phase', async (req, res) => {
    const state = games.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Game not found' });
    try {
        const result = await game.endPhase(state);
        res.json({ state, aiEvent: result.aiEvent, playerEvent: result.playerEvent });
    } catch (err) {
        console.error('Error ending phase:', err);
        res.status(500).json({ error: 'Failed to process turn' });
    }
});

// ── Start Server ────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`Risky Civ server listening on port ${port}`);
});
