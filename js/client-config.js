// ── Browser-Only Configuration ────────────────────────────────────────
// This file is NOT auto-generated. Edit directly.
// Shared game constants live in server/config.js — run `npm run sync` to update js/config.js.

export const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://risky-civ.onrender.com';

// Continent bonus display values (for UI tooltips).
// Server computes actual continent bonuses from map generation data at runtime.
export const CONTINENT_BONUSES = {
  northAmerica: { production: 3, research: 1, money: 2 },
  southAmerica: { production: 1, research: 1, money: 2 },
  europe: { production: 2, research: 3, money: 2 },
  africa: { production: 2, research: 1, money: 3 },
  asia: { production: 3, research: 2, money: 3 },
};
