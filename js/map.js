// ── Risky Civ — SVG Map Rendering ───────────────────────────────────

import { PLAYER_COLORS, NEUTRAL_COLOR, STRUCTURES } from './config.js';
import { getSeaRoutes } from './territories.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create the SVG map and insert into container */
export function renderMap(container, territories, onTerritoryClick) {
    container.innerHTML = '';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1020 600');
    svg.setAttribute('class', 'game-map');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Ocean background
    const ocean = document.createElementNS(SVG_NS, 'rect');
    ocean.setAttribute('width', '1020');
    ocean.setAttribute('height', '600');
    ocean.setAttribute('fill', '#0f1e2e');
    ocean.setAttribute('rx', '12');
    svg.appendChild(ocean);

    // Animated ocean waves pattern
    const defs = document.createElementNS(SVG_NS, 'defs');
    const pattern = document.createElementNS(SVG_NS, 'pattern');
    pattern.setAttribute('id', 'ocean-pattern');
    pattern.setAttribute('width', '80');
    pattern.setAttribute('height', '40');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    const wavePath = document.createElementNS(SVG_NS, 'path');
    wavePath.setAttribute('d', 'M0 20 Q20 10 40 20 T80 20');
    wavePath.setAttribute('stroke', 'rgba(100,180,255,0.06)');
    wavePath.setAttribute('stroke-width', '1');
    wavePath.setAttribute('fill', 'none');
    pattern.appendChild(wavePath);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const oceanOverlay = document.createElementNS(SVG_NS, 'rect');
    oceanOverlay.setAttribute('width', '1020');
    oceanOverlay.setAttribute('height', '600');
    oceanOverlay.setAttribute('fill', 'url(#ocean-pattern)');
    svg.appendChild(oceanOverlay);

    // Grid lines for aesthetic
    for (let x = 0; x <= 1020; x += 60) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', '0');
        line.setAttribute('x2', x); line.setAttribute('y2', '600');
        line.setAttribute('stroke', 'rgba(255,255,255,0.02)');
        svg.appendChild(line);
    }
    for (let y = 0; y <= 600; y += 60) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', '0'); line.setAttribute('y1', y);
        line.setAttribute('x2', '1020'); line.setAttribute('y2', y);
        line.setAttribute('stroke', 'rgba(255,255,255,0.02)');
        svg.appendChild(line);
    }

    // ── Sea Routes (dashed lines between continents) ──
    const seaRoutes = getSeaRoutes();
    for (const route of seaRoutes) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', Math.round(route.fromPos.x));
        line.setAttribute('y1', Math.round(route.fromPos.y));
        line.setAttribute('x2', Math.round(route.toPos.x));
        line.setAttribute('y2', Math.round(route.toPos.y));
        line.setAttribute('stroke', 'rgba(100, 200, 255, 0.35)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '6 4');
        line.setAttribute('class', 'sea-route');
        svg.appendChild(line);

        // Small anchor/ship icon at midpoint
        const mx = (route.fromPos.x + route.toPos.x) / 2;
        const my = (route.fromPos.y + route.toPos.y) / 2;
        const icon = document.createElementNS(SVG_NS, 'text');
        icon.setAttribute('x', Math.round(mx));
        icon.setAttribute('y', Math.round(my) + 3);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('font-size', '10');
        icon.setAttribute('class', 'sea-route-icon');
        icon.textContent = '⚓';
        svg.appendChild(icon);
    }

    // Render territories
    for (const t of territories) {
        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('class', 'territory-group');
        group.setAttribute('data-id', t.id);

        // Territory polygon
        const poly = document.createElementNS(SVG_NS, 'polygon');
        poly.setAttribute('points', t.svgPoints);
        poly.setAttribute('class', 'territory');
        poly.setAttribute('data-id', t.id);

        const color = t.owner !== null ? PLAYER_COLORS[t.owner] : NEUTRAL_COLOR;
        poly.setAttribute('fill', color);
        poly.setAttribute('fill-opacity', '0.65');
        poly.setAttribute('stroke', '#d4c9a8');
        poly.setAttribute('stroke-width', '1.5');

        poly.addEventListener('click', () => onTerritoryClick(t.id));
        poly.addEventListener('mouseenter', () => {
            poly.setAttribute('fill-opacity', '0.9');
            poly.setAttribute('stroke-width', '2.5');
            poly.setAttribute('stroke', '#fff');
        });
        poly.addEventListener('mouseleave', () => {
            poly.setAttribute('fill-opacity', '0.65');
            poly.setAttribute('stroke-width', '1.5');
            poly.setAttribute('stroke', '#d4c9a8');
        });
        group.appendChild(poly);

        // Troop count badge
        if (t.troops > 0) {
            const circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('cx', t.labelPos.x);
            circle.setAttribute('cy', t.labelPos.y);
            circle.setAttribute('r', '14');
            circle.setAttribute('fill', color);
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '1.5');
            circle.setAttribute('class', 'troop-badge');
            group.appendChild(circle);

            const txt = document.createElementNS(SVG_NS, 'text');
            txt.setAttribute('x', t.labelPos.x);
            txt.setAttribute('y', t.labelPos.y + 4);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('fill', '#fff');
            txt.setAttribute('font-size', '11');
            txt.setAttribute('font-weight', '700');
            txt.setAttribute('font-family', 'Outfit, sans-serif');
            txt.setAttribute('class', 'troop-count');
            txt.setAttribute('pointer-events', 'none');
            txt.textContent = t.troops;
            group.appendChild(txt);
        }

        // Territory name (small)
        const nameTxt = document.createElementNS(SVG_NS, 'text');
        nameTxt.setAttribute('x', t.labelPos.x);
        nameTxt.setAttribute('y', t.labelPos.y - 18);
        nameTxt.setAttribute('text-anchor', 'middle');
        nameTxt.setAttribute('fill', 'rgba(255,255,255,0.7)');
        nameTxt.setAttribute('font-size', '7');
        nameTxt.setAttribute('font-family', 'Outfit, sans-serif');
        nameTxt.setAttribute('pointer-events', 'none');
        nameTxt.textContent = t.name;
        group.appendChild(nameTxt);

        // Structure icons
        if (t.structures.length > 0) {
            const structs = t.structures.slice(0, 4);
            structs.forEach((s, idx) => {
                const def = STRUCTURES[s];
                if (!def) return;
                const stxt = document.createElementNS(SVG_NS, 'text');
                stxt.setAttribute('x', t.labelPos.x - 12 + idx * 10);
                stxt.setAttribute('y', t.labelPos.y + 20);
                stxt.setAttribute('font-size', '9');
                stxt.setAttribute('pointer-events', 'none');
                stxt.textContent = def.icon;
                group.appendChild(stxt);
            });
        }

        svg.appendChild(group);
    }

    container.appendChild(svg);
}

/** Update map colors and troop counts without full re-render */
export function updateMap(territories) {
    for (const t of territories) {
        const group = document.querySelector(`.territory-group[data-id="${t.id}"]`);
        if (!group) continue;

        const color = t.owner !== null ? PLAYER_COLORS[t.owner] : NEUTRAL_COLOR;
        const poly = group.querySelector('.territory');
        if (poly) {
            poly.setAttribute('fill', color);
        }

        const badge = group.querySelector('.troop-badge');
        const countText = group.querySelector('.troop-count');
        if (badge && countText) {
            badge.setAttribute('fill', color);
            countText.textContent = t.troops;
        }
    }
}

/** Highlight territories that can be acted upon */
export function highlightTerritories(territoryIds, className = 'highlight') {
    clearHighlights();
    for (const id of territoryIds) {
        const poly = document.querySelector(`.territory[data-id="${id}"]`);
        if (poly) poly.classList.add(className);
    }
}

export function clearHighlights() {
    document.querySelectorAll('.territory.highlight, .territory.attack-target').forEach(el => {
        el.classList.remove('highlight', 'attack-target');
    });
}
