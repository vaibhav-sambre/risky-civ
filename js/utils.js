// ── Risky Civ — Utility Functions ───────────────────────────────────

import { DICE_SIDES } from './config.js';

/** Roll n dice, return array of results sorted descending */
export function rollDice(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
        results.push(Math.floor(Math.random() * DICE_SIDES) + 1);
    }
    return results.sort((a, b) => b - a);
}

/** Fisher-Yates shuffle (in-place, returns same array) */
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Random integer between min and max inclusive */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
export function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Clamp a value between min and max */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/** Deep clone a plain object */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/** Delay helper for async/await */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
