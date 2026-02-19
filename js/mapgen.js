// ── Risky Civ — Procedural Map Generator (Grid + K-Means) ───────────
// Generates map using Cellular Automata for continents and K-Means
// for territory subdivision. Outputs pixel-perfect boundaries.

const TERRITORY_NAMES = [
    'Ironforge', 'Stormreach', 'Northhaven', 'Goldvale', 'Silverpeak',
    'Redmoor', 'Darkhollow', 'Greywood', 'Frostwall', 'Brightfield',
    'Oldstone', 'Newgate', 'Portcrest', 'Lakeshire', 'Caperidge',
    'Dawnfield', 'Highford', 'Westmarch', 'Eastgate', 'Thornmere',
    'Ashmore', 'Sunhaven', 'Moonreach', 'Ravenshollow', 'Wolfshore',
    'Eaglecrest', 'Foxdale', 'Hawkridge', 'Bearhold', 'Starfall',
    'Mistpeak', 'Shadowfen', 'Crystalvale', 'Embercrest', 'Ivywall',
    'Thornwick', 'Dunmere', 'Oakhollow', 'Windcrest', 'Ferncross',
    'Duskwall', 'Briarstone', 'Copperdale', 'Aldenmoor', 'Stonewatch',
    'Whitpeak', 'Ravenford', 'Hollowgate', 'Pineshire', 'Willowfen',
    'Blackhollow', 'Amberfall', 'Greywatch', 'Dragonmere', 'Frostpeak',
    'Crowshollow', 'Goldenridge', 'Ironmarch', 'Silverbend', 'Deepvale',
];

const CONTINENT_NAMES_POOL = [
    'Aetheria', 'Borealis', 'Cindara', 'Drakmoor', 'Elysara',
    'Frostheim', 'Galadria', 'Havencross', 'Ironveil', 'Kaldheim',
];

export function generateMap(
    width = 1010,
    height = 590,
    numTerritories = 30,
    numContinents = 5
) {
    const scale = 5; // Higher scale = coarser grid, faster K-Means
    const gridW = Math.ceil(width / scale);
    const gridH = Math.ceil(height / scale);
    const targetLandRatio = 0.70;

    console.log(`MapGen: Initializing ${gridW}x${gridH} grid. Target: 70% Land.`);

    // 1. Grow Continents (1..5)
    //    grid holds Continent ID (1-based)
    const { grid } = growContinents(gridW, gridH, numContinents, targetLandRatio);

    // 2. Subdivide into Territories (K-Means)
    //    grid now holds Territory ID (1..30)
    //    We distribute count per continent first.
    const perContinent = distributeTerritories(numTerritories, numContinents);

    // Map global territory IDs
    let globalIdx = 0;
    const continentRanges = [];
    const territoryToContinent = {}; // id -> cId
    const rangePerContinent = []; // cIdx -> [start, end]

    for (let c = 0; c < numContinents; c++) {
        const count = perContinent[c];
        const start = globalIdx;
        const end = start + count;

        // Find all pixels for this continent
        const pixels = [];
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] === (c + 1)) pixels.push(i);
        }

        // Run K-Means to assign Territory IDs
        if (pixels.length > 0) {
            runKMeans(grid, pixels, gridW, start, count);
        }

        continentRanges.push({ start, count });
        for (let i = start; i < end; i++) territoryToContinent[`t${i}`] = `c${c}`;
        rangePerContinent[c] = { start, count };

        globalIdx += count;
    }

    // 3. Trace Boundaries (Marching Squares / Edge Chaining)
    //    Produce polygons for each Territory ID (1..30)
    //    Note: Territory IDs in grid are 1-based (1..30). Array indices 0..29.
    const polygons = traceContours(grid, gridW, gridH, numTerritories);

    // 4. Build Territory Objects
    const allTerritories = [];
    const names = pickRandom(TERRITORY_NAMES, numTerritories);

    // Calculate centroids & properties
    for (let i = 0; i < numTerritories; i++) {
        const tid = i + 1; // Grid value
        const poly = polygons[tid]; // List of points {x,y}

        // If poly is missing (K-means starvation? unlikely), skip?
        // Game expects 30 territories. We must fill.
        // If K-Means failed to assign pixels to a seed, map it to empty?
        // With robust K-Means, every ID should have pixels if count << pixels.

        const finalPoly = poly && poly.length > 2
            ? poly.map(p => ({ x: p.x * scale, y: p.y * scale }))
            : [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }]; // Degenerate fallback

        // Identify continent
        // Reverse lookup or check range
        let contId = "c0";
        for (let c = 0; c < numContinents; c++) {
            if (i >= rangePerContinent[c].start && i < rangePerContinent[c].start + rangePerContinent[c].count) {
                contId = `c${c}`;
                break;
            }
        }

        // Adjacency: Scan grid for neighbors
        // Doing this pixel-by-pixel is accurate.
        // We'll process global adjacency later or row-scan now.
        // Let's do a quick adjacency scan on the low-res grid

        allTerritories.push({
            id: `t${i}`,
            name: names[i] || `Land ${i}`,
            continent: contId,
            adjacent: [], // Filled later
            seaAdjacent: [],
            svgPoints: finalPoly.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' '),
            labelPos: getPolygonCentroid(finalPoly),
        });
    }

    // 5. Adjacency
    computeAdjacencyFromGrid(grid, gridW, gridH, allTerritories);

    // 6. Find Continent Centers (Avg of territory labels)
    const continentCenters = [];
    for (let c = 0; c < numContinents; c++) {
        const ts = allTerritories.filter(t => t.continent === `c${c}`);
        let x = 0, y = 0;
        ts.forEach(t => { x += t.labelPos.x; y += t.labelPos.y; });
        continentCenters.push({ x: x / ts.length || 0, y: y / ts.length || 0 });
    }

    // 7. Sea Routes
    const seaRoutes = createSeaRoutes(allTerritories, continentCenters, numContinents);

    // 8. Debug Area
    let totalLandArea = 0;
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] > 0) totalLandArea++;
    }
    const landPercent = (totalLandArea / (gridW * gridH)) * 100;
    console.log(`MapGen: Actual Land Area: ${totalLandArea * scale * scale}px (${landPercent.toFixed(1)}%)`);

    // 9. Metadata
    const continents = {};
    const continentNames = pickRandom(CONTINENT_NAMES_POOL, numContinents);
    for (let c = 0; c < numContinents; c++) {
        continents[`c${c}`] = {
            name: continentNames[c],
            size: perContinent[c],
            bonus: computeContinentBonus(Math.max(2, Math.round(perContinent[c] / 2))),
        };
    }

    return { territories: allTerritories, continents, seaRoutes };
}

// ── Region Growing ──────────────────────────────────────────────────

function growContinents(width, height, numContinents, targetRatio) {
    const grid = new Int8Array(width * height).fill(0);
    const frontiers = Array.from({ length: numContinents }, () => []);

    // Seed
    const seeds = [];
    let attempts = 0;
    while (seeds.length < numContinents && attempts < 5000) {
        const x = Math.floor(Math.random() * (width - 4)) + 2;
        const y = Math.floor(Math.random() * (height - 4)) + 2;
        // Check dist
        if (seeds.every(s => Math.hypot(s.x - x, s.y - y) > Math.min(width, height) / numContinents)) {
            seeds.push({ x, y });
            const idx = seeds.length; // 1..5
            const p = y * width + x;
            grid[p] = idx;
            getNeighbors(x, y, width, height).forEach(n => {
                if (grid[n] === 0) frontiers[idx - 1].push(n);
            });
        }
        attempts++;
    }
    // Fallback seed
    while (seeds.length < numContinents) {
        const r = Math.floor(Math.random() * grid.length);
        if (grid[r] === 0) {
            seeds.push({ x: r % width, y: Math.floor(r / width) });
            const idx = seeds.length;
            grid[r] = idx;
            const x = r % width, y = Math.floor(r / width);
            getNeighbors(x, y, width, height).forEach(n => { if (grid[n] === 0) frontiers[idx - 1].push(n); });
        }
    }

    let landPixels = numContinents;
    const targetPixels = Math.floor(width * height * targetRatio);

    let iter = 0;
    while (landPixels < targetPixels && iter < 500000) {
        let placed = false;
        for (let c = 0; c < numContinents; c++) {
            const f = frontiers[c];
            if (f.length === 0) continue;

            const pick = Math.floor(Math.random() * f.length);
            const t = f[pick];

            if (grid[t] !== 0) { // Occupied
                f[pick] = f[f.length - 1]; f.pop();
                continue;
            }

            // Overlap check (buffer)
            const tx = t % width, ty = Math.floor(t / width);
            const ns = getNeighbors(tx, ty, width, height);
            const safe = ns.every(n => grid[n] === 0 || grid[n] === (c + 1));

            if (safe) {
                grid[t] = c + 1;
                landPixels++;
                placed = true;
                f[pick] = f[f.length - 1]; f.pop();
                ns.forEach(n => { if (grid[n] === 0) f.push(n); });
            } else {
                f[pick] = f[f.length - 1]; f.pop();
            }
        }
        if (!placed && frontiers.every(x => x.length === 0)) break;
        iter++;
    }
    return { grid };
}

function getNeighbors(x, y, w, h) {
    const idxs = [];
    // 4-way connectivity
    if (x > 0) idxs.push(y * w + (x - 1));
    if (x < w - 1) idxs.push(y * w + (x + 1));
    if (y > 0) idxs.push((y - 1) * w + x);
    if (y < h - 1) idxs.push((y + 1) * w + x);
    return idxs;
}

// ── K-Means Subdivision ─────────────────────────────────────────────

function runKMeans(grid, pixels, width, startId, count) {
    // 1. Pick K centers from pixels
    let centers = [];
    if (pixels.length <= count) {
        // Not enough pixels? Just assign 1-to-1
        pixels.forEach((p, i) => grid[p] = startId + i + 1);
        return;
    }

    // Random init
    for (let i = 0; i < count; i++) {
        const p = pixels[Math.floor(Math.random() * pixels.length)];
        centers.push({ x: p % width, y: Math.floor(p / width) });
    }

    // 2. Iterate
    for (let iter = 0; iter < 3; iter++) {
        const sums = centers.map(() => ({ x: 0, y: 0, c: 0 }));
        const newAssignment = new Map(); // pixelIdx -> localClusterIdx

        for (const pIdx of pixels) {
            const px = pIdx % width;
            const py = Math.floor(pIdx / width);
            let minDist = Infinity, bestK = 0;
            for (let k = 0; k < count; k++) {
                const d = (px - centers[k].x) ** 2 + (py - centers[k].y) ** 2;
                if (d < minDist) { minDist = d; bestK = k; }
            }
            newAssignment.set(pIdx, bestK);
            sums[bestK].x += px;
            sums[bestK].y += py;
            sums[bestK].c++;
        }

        // Move centers
        let changed = 0;
        for (let k = 0; k < count; k++) {
            if (sums[k].c > 0) {
                const nx = sums[k].x / sums[k].c;
                const ny = sums[k].y / sums[k].c;
                if (Math.abs(nx - centers[k].x) > 0.5 || Math.abs(ny - centers[k].y) > 0.5) changed++;
                centers[k].x = nx;
                centers[k].y = ny;
            } else {
                // Respawn empty center
                const p = pixels[Math.floor(Math.random() * pixels.length)];
                centers[k] = { x: p % width, y: Math.floor(p / width) };
            }
        }

        // Final pass: Update grid
        if (iter === 2) {
            newAssignment.forEach((localK, pIdx) => {
                grid[pIdx] = startId + localK + 1; // 1-based Global ID
            });
        }
    }
}

// ── Contour Tracing (Edge Chaining) ─────────────────────────────────

function traceContours(grid, width, height, maxId) {
    // Map of StartPointStr -> EndPointObj
    const edgeMaps = Array.from({ length: maxId + 1 }, () => new Map());

    const key = (x, y) => `${x},${y}`;

    // 1. Find Edges
    // Vertical scan (Right edges)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x <= width; x++) {
            const vL = (x === 0) ? 0 : grid[y * width + x - 1];
            const vR = (x === width) ? 0 : grid[y * width + x];
            if (vL !== vR) {
                if (vL > 0) edgeMaps[vL].set(key(x, y), { x, y: y + 1 }); // Down
                if (vR > 0) edgeMaps[vR].set(key(x, y + 1), { x, y }); // Up
            }
        }
    }
    // Horizontal scan (Bottom edges)
    for (let x = 0; x < width; x++) {
        for (let y = 0; y <= height; y++) {
            const vT = (y === 0) ? 0 : grid[(y - 1) * width + x];
            const vB = (y === height) ? 0 : grid[y * width + x];
            if (vT !== vB) {
                if (vT > 0) edgeMaps[vT].set(key(x + 1, y), { x, y }); // Left
                if (vB > 0) edgeMaps[vB].set(key(x, y), { x: x + 1, y }); // Right
            }
        }
    }

    // 2. Chain Loops
    const polygons = [];
    for (let id = 1; id <= maxId; id++) {
        const map = edgeMaps[id];
        if (map.size === 0) { polygons[id] = []; continue; }

        // Find largest loop (main territory)
        let maxPoly = [];
        let maxLen = 0;

        while (map.size > 0) {
            const startKey = map.keys().next().value; // Pick arbitrary start
            let currKey = startKey;
            const poly = [];

            // Traverse loop
            while (map.has(currKey)) {
                const [sx, sy] = currKey.split(',').map(Number);
                poly.push({ x: sx, y: sy });
                const next = map.get(currKey);
                map.delete(currKey);
                currKey = key(next.x, next.y);
                if (currKey === startKey) break; // Closed loop
                // Safety break for unclosed chains (shouldn't happen with valid grid)
                if (poly.length > 5000) break;
            }

            if (poly.length > maxLen) {
                maxLen = poly.length;
                maxPoly = poly;
            }
        }

        // Simplification (Critical for SVG perf)
        // Simple step skip
        const simplified = maxPoly.filter((_, i) => i % 2 === 0);
        polygons[id] = simplified.length > 2 ? simplified : maxPoly;
    }
    return polygons;
}

// ── Adjacency Scan ──────────────────────────────────────────────────

function computeAdjacencyFromGrid(grid, w, h, territories) {
    const adjSets = territories.map(() => new Set());

    // Horizontal adjacency
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w - 1; x++) {
            const a = grid[y * w + x];
            const b = grid[y * w + x + 1];
            if (a > 0 && b > 0 && a !== b) {
                adjSets[a - 1].add(b - 1);
                adjSets[b - 1].add(a - 1);
            }
        }
    }
    // Vertical adjacency
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h - 1; y++) {
            const a = grid[y * w + x];
            const b = grid[(y + 1) * w + x];
            if (a > 0 && b > 0 && a !== b) {
                adjSets[a - 1].add(b - 1);
                adjSets[b - 1].add(a - 1);
            }
        }
    }

    territories.forEach((t, i) => {
        t.adjacent = Array.from(adjSets[i]).map(nId => `t${nId}`);
    });
}

// ── Utils ───────────────────────────────────────────────────────────

function getPolygonCentroid(poly) {
    if (!poly || !poly.length) return { x: 0, y: 0 };
    let x = 0, y = 0;
    poly.forEach(p => { x += p.x; y += p.y; });
    return { x: x / poly.length, y: y / poly.length };
}

function distributeTerritories(total, numContinents) {
    const min = 4;
    const result = new Array(numContinents).fill(min);
    let remaining = total - min * numContinents;
    while (remaining > 0) {
        result[Math.floor(Math.random() * numContinents)]++;
        remaining--;
    }
    return result;
}

function pickRandom(pool, count) {
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

function computeContinentBonus(size) {
    return { production: size, research: size, money: size };
}

function createSeaRoutes(territories, centers, numContinents) {
    const seaRoutes = [];
    for (let a = 0; a < numContinents; a++) {
        for (let b = a + 1; b < numContinents; b++) {
            const da = territories.filter(t => t.continent === `c${a}`);
            const db = territories.filter(t => t.continent === `c${b}`);
            if (!da.length || !db.length) continue;
            // Dist
            const dCenter = Math.hypot(centers[a].x - centers[b].x, centers[a].y - centers[b].y);
            if (dCenter > 400) continue;

            let minDist = Infinity, pair = null;
            for (const ta of da) {
                for (const tb of db) {
                    const d = Math.hypot(ta.labelPos.x - tb.labelPos.x, ta.labelPos.y - tb.labelPos.y);
                    if (d < minDist) { minDist = d; pair = [ta, tb]; }
                }
            }
            if (pair && minDist < 200) { // Tight connection
                const [ta, tb] = pair;
                ta.seaAdjacent.push(tb.id);
                tb.seaAdjacent.push(ta.id);
                seaRoutes.push({ from: ta.id, to: tb.id, fromPos: ta.labelPos, toPos: tb.labelPos });
            }
        }
    }
    return seaRoutes;
}
