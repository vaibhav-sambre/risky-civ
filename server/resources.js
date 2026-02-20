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
        if ((player.techUnlocked.includes('eco_t2') && !hasEffect(state, playerId, 'cyberattack'))) {
            prod += 1; res += 1; mon += 1;
        }

        // Structure bonuses
        for (const s of t.structures) {
            const def = STRUCTURES[s];
            if (!def || !def.bonus) continue;
            let bonusMult = 1;
            // Tech: betterStructures (+1 extra)
            if ((player.techUnlocked.includes('eco_t1') && !hasEffect(state, playerId, 'cyberattack'))) bonusMult = 1;
            if (def.bonus.production) prod += def.bonus.production + ((player.techUnlocked.includes('eco_t1') && !hasEffect(state, playerId, 'cyberattack')) ? 1 : 0);
            if (def.bonus.research) res += def.bonus.research + ((player.techUnlocked.includes('eco_t1') && !hasEffect(state, playerId, 'cyberattack')) ? 1 : 0);
            if (def.bonus.money) mon += def.bonus.money + ((player.techUnlocked.includes('eco_t1') && !hasEffect(state, playerId, 'cyberattack')) ? 1 : 0);
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
            const bankBase = player.techUnlocked.includes('eco_t5') && !hasEffect(state, playerId, 'cyberattack') ? 4 : STRUCTURES.bank.bonus.money;
            mon += bankCount * bankBase;
        }

        // Embargo: banks produce nothing
        if (hasEffect(state, playerId, 'embargo')) {
            const bankBonus = t.structures.filter(s => s === 'bank').length * (STRUCTURES.bank.bonus.money + ((player.techUnlocked.includes('eco_t1') && !hasEffect(state, playerId, 'cyberattack')) ? 1 : 0));
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
            if ((player.techUnlocked.includes('eco_t4') && !hasEffect(state, playerId, 'cyberattack'))) mult = 2; // Trade Routes
            prodTotal += bonus.production * mult;
            resTotal += bonus.research * mult;
            monTotal += bonus.money * mult;
        }
    }

    player.resources.production = prodTotal + (player.tempEffects['espProd'] || 0); // Does not roll over
    if (player.techUnlocked.includes('sci_t6') && !hasEffect(state, playerId, 'cyberattack')) resTotal *= 2;
    player.resources.research = resTotal + (player.tempEffects['espRes'] || 0); // Also does not roll over
    player.resources.money += monTotal + (player.tempEffects['espMon'] || 0);

    player.tempEffects['espProd'] = 0;
    player.tempEffects['espRes'] = 0;
    player.tempEffects['espMon'] = 0;

    addLog(state, `${player.name} collected +${prodTotal} ⚙️, +${resTotal} 🔬, +${monTotal} 💰`);

    const enemyId = playerId === 0 ? 1 : 0;
    const enemy = state.players[enemyId];
    if (enemy.techUnlocked.includes('eco_t7') && !hasEffect(state, enemyId, 'cyberattack')) {
        const espProd = Math.floor(prodTotal * 0.1);
        const espRes = Math.floor(resTotal * 0.1);
        const espMon = Math.floor(monTotal * 0.1);

        enemy.tempEffects['espProd'] = (enemy.tempEffects['espProd'] || 0) + espProd;
        enemy.tempEffects['espRes'] = (enemy.tempEffects['espRes'] || 0) + espRes;
        enemy.tempEffects['espMon'] = (enemy.tempEffects['espMon'] || 0) + espMon;

        if (espProd > 0 || espRes > 0 || espMon > 0) {
            addLog(state, `${enemy.name} passively gained resources from Industrial Espionage!`);
        }
    }
}

/** Deduct troop upkeep; desertion if negative money */
function payUpkeep(state, playerId) {
    const player = state.players[playerId];
    const owned = getPlayerTerritories(state.territories, playerId);
    const totalTroops = owned.reduce((sum, t) => sum + t.troops, 0);
    const upkeepMultiplier = (player.techUnlocked.includes('eco_t6') && !hasEffect(state, playerId, 'cyberattack')) ? 0.5 : TROOP_UPKEEP_COST;
    const cost = Math.ceil(totalTroops * upkeepMultiplier);

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
