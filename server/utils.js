// ── Server-Side Utils (CommonJS) ────────────────────────────────────
const { DICE_SIDES } = require('./config');

function rollDice(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
        results.push(Math.floor(Math.random() * DICE_SIDES) + 1);
    }
    return results.sort((a, b) => b - a);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

module.exports = { rollDice, shuffle, randomInt, randomPick, clamp, deepClone };
