const { STRUCTURES, TROOP_UPKEEP_COST } = require('./config');
const { getPlayerTerritories, getControlledContinents } = require('./territories');
const { addLog, hasEffect } = require('./state');
// ── Risky Civ — Resource Collection ─────────────────────────────────

/** Collect resources for a player from all owned territories */
function collectResources(state, playerId) {
    const player = state.players[playerId];
    const owned = getPlayerTerritories(state.territories, playerId);

    let prodTotal = 0, resTotal = 0, monTotal = 0;

    for (const t of owned) {
        let prod = t.baseResources.production;
        let res = t.baseResources.research;
        let mon = t.baseResources.money;

        // Tech: betterBase (+1 each)
        if (player.techUnlocked.includes('eco_t2')) {
            prod += 1; res += 1; mon += 1;
        }

        // Structure bonuses
        for (const s of t.structures) {
            const def = STRUCTURES[s];
            if (!def || !def.bonus) continue;
            let bonusMult = 1;
            // Tech: betterStructures (+1 extra)
            if (player.techUnlocked.includes('eco_t1')) bonusMult = 1;
            if (def.bonus.production) prod += def.bonus.production + (player.techUnlocked.includes('eco_t1') ? 1 : 0);
            if (def.bonus.research) res += def.bonus.research + (player.techUnlocked.includes('eco_t1') ? 1 : 0);
            if (def.bonus.money) mon += def.bonus.money + (player.techUnlocked.includes('eco_t1') ? 1 : 0);
        }

        // Card effects: double factory / university / bank output
        if (hasEffect(state, playerId, 'doubleFactory')) {
            const factoryCount = t.structures.filter(s => s === 'factory').length;
            prod += factoryCount * STRUCTURES.factory.bonus.production;
        }
        if (hasEffect(state, playerId, 'doubleUniversity')) {
            const uniCount = t.structures.filter(s => s === 'university').length;
            res += uniCount * STRUCTURES.university.bonus.research;
        }
        if (hasEffect(state, playerId, 'doubleBank')) {
            const bankCount = t.structures.filter(s => s === 'bank').length;
            mon += bankCount * STRUCTURES.bank.bonus.money;
        }

        // Embargo: banks produce nothing
        if (hasEffect(state, playerId, 'embargo')) {
            const bankBonus = t.structures.filter(s => s === 'bank').length * (STRUCTURES.bank.bonus.money + (player.techUnlocked.includes('eco_t1') ? 1 : 0));
            mon -= bankBonus;
        }

        prodTotal += prod;
        resTotal += res;
        monTotal += mon;
    }

    // Research halted card
    if (hasEffect(state, playerId, 'researchHalted')) {
        resTotal = 0;
    }

    // Continent bonuses
    const controlled = getControlledContinents(state.territories, playerId);
    for (const c of controlled) {
        const bonus = state.continentData?.[c]?.bonus;
        if (bonus) {
            let mult = 1;
            if (player.techUnlocked.includes('eco_t4')) mult = 2; // Trade Routes
            prodTotal += bonus.production * mult;
            resTotal += bonus.research * mult;
            monTotal += bonus.money * mult;
        }
    }

    player.resources.production = prodTotal; // Does not roll over
    player.resources.research += resTotal;
    player.resources.money += monTotal;

    addLog(state, `${player.name} collected +${prodTotal} ⚙️, +${resTotal} 🔬, +${monTotal} 💰`);
}

/** Deduct troop upkeep; desertion if negative money */
function payUpkeep(state, playerId) {
    const player = state.players[playerId];
    const owned = getPlayerTerritories(state.territories, playerId);
    const totalTroops = owned.reduce((sum, t) => sum + t.troops, 0);
    const cost = Math.ceil(totalTroops * TROOP_UPKEEP_COST);

    player.resources.money -= cost;
    addLog(state, `${player.name} paid ${cost} 💰 troop upkeep (${totalTroops} troops × ${TROOP_UPKEEP_COST})`);

    // Desertion: if money is negative, lose troops until money >= 0
    if (player.resources.money < 0) {
        let deficit = Math.abs(player.resources.money);
        addLog(state, `${player.name} cannot pay upkeep! Troops deserting...`);
        // Remove troops from territories with most troops first
        const sorted = [...owned].sort((a, b) => b.troops - a.troops);
        for (const t of sorted) {
            while (t.troops > 1 && deficit > 0) {
                t.troops--;
                deficit -= TROOP_UPKEEP_COST;
            }
            if (deficit <= 0) break;
        }
        player.resources.money = Math.max(0, player.resources.money);
    }
}

module.exports = { collectResources, payUpkeep };
