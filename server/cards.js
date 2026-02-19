const { MAX_HAND_SIZE, CARDS_DRAWN_PER_TURN, EVENT_CARDS } = require('./config');
const { addLog, setEffect } = require('./state');
const { getPlayerTerritories, getTerritory, getNeutralTerritories } = require('./territories');
const { shuffle, randomPick } = require('./utils');
// ── Risky Civ — Card System ─────────────────────────────────────────

// ── Event chance: ~20% per draw, an event fires instead of a bonus card ──
const EVENT_CHANCE = 0.2;

/** Draw cards for a player. Returns an event card if one triggered. */
function drawCards(state, playerId, count = null) {
    const player = state.players[playerId];
    const drawCount = count || CARDS_DRAWN_PER_TURN;
    // Extra draw from tech
    const extraDraw = player.techUnlocked.includes('sci_t1') ? 1 : 0;
    const totalDraw = drawCount + (count ? 0 : extraDraw);

    let triggeredEvent = null;

    for (let i = 0; i < totalDraw; i++) {
        // Check for random event trigger
        if (!count && state.eventDeck.length > 0 && Math.random() < EVENT_CHANCE) {
            const event = state.eventDeck.pop();
            addLog(state, `⚡ GLOBAL EVENT: ${event.icon} ${event.name} — ${event.description}`);
            executeEventEffect(state, event);
            state.discard.push(event);
            triggeredEvent = event;
            state.lastEvent = event;
            continue; // event replaces this draw
        }

        // If hand is full, discard the cheapest card to make room
        if (player.hand.length >= MAX_HAND_SIZE) {
            const randomIdx = Math.floor(Math.random() * player.hand.length);
            const discarded = player.hand.splice(randomIdx, 1)[0];
            state.discard.push(discarded);
            addLog(state, `${player.name} discarded ${discarded.icon} ${discarded.name} (hand full)`);
        }

        // Reshuffle discard if deck empty (only bonus cards go back)
        if (state.deck.length === 0) {
            const bonusDiscard = state.discard.filter(c => c.type !== 'event');
            if (bonusDiscard.length === 0) break;
            state.deck = shuffle([...bonusDiscard]);
            state.discard = state.discard.filter(c => c.type === 'event');
            addLog(state, 'Deck reshuffled from discard pile');
        }
        const card = state.deck.pop();
        player.hand.push(card);
    }
    if (!triggeredEvent) {
        addLog(state, `${player.name} drew ${totalDraw} card(s)`);
    }
    return triggeredEvent;
}

/** Must play a card if at max hand size */
function mustPlayCard(state, playerId) {
    return state.players[playerId].hand.length >= MAX_HAND_SIZE;
}

/** Check if a player can afford to play a card */
function canAffordCard(state, playerId, cardIndex) {
    const player = state.players[playerId];
    if (cardIndex < 0 || cardIndex >= player.hand.length) return false;
    const card = player.hand[cardIndex];
    const cost = card.cost || 0;
    return player.resources.money >= cost;
}

/** Play a card from hand (returns true if successful) */
function playCard(state, playerId, cardIndex, targetTerritoryId = null) {
    const player = state.players[playerId];
    if (cardIndex < 0 || cardIndex >= player.hand.length) return false;

    const card = player.hand[cardIndex];
    const cost = card.cost || 0;

    // Check if player can afford it
    if (player.resources.money < cost) {
        addLog(state, `${player.name} can't afford ${card.name} (costs ${cost} 💰)`);
        return false;
    }

    // Pay the cost
    player.resources.money -= cost;
    player.hand.splice(cardIndex, 1);
    state.discard.push(card);

    const costStr = cost > 0 ? ` (paid ${cost} 💰)` : '';
    addLog(state, `${player.name} played ${card.icon} ${card.name}${costStr}: ${card.description}`);

    // Execute card effect
    executeBonusEffect(state, playerId, card, targetTerritoryId);
    return true;
}

// ═══════════════════════════════════════════════════════════════════════
// ── Global Event Effects (affect ALL players) ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function executeEventEffect(state, card) {
    for (let pid = 0; pid < state.players.length; pid++) {
        const player = state.players[pid];
        const owned = getPlayerTerritories(state.territories, pid);

        switch (card.id) {
            case 'evt_01': // Plague — lose 2 troops in most populated territory
                if (owned.length > 0) {
                    const mostPop = [...owned].sort((a, b) => b.troops - a.troops)[0];
                    mostPop.troops = Math.max(1, mostPop.troops - 2);
                }
                break;

            case 'evt_02': // Earthquake — destroy a random structure
                const withStructures = owned.filter(t => t.structures.length > 0);
                if (withStructures.length > 0) {
                    const target = randomPick(withStructures);
                    target.structures.pop();
                    addLog(state, `  ↳ ${player.name}: structure destroyed in ${target.name}`);
                }
                break;

            case 'evt_03': // Recession — lose 30% Money
                const loss = Math.ceil(player.resources.money * 0.3);
                player.resources.money = Math.max(0, player.resources.money - loss);
                break;

            case 'evt_04': // Famine — lose 8 Production
                player.resources.production = Math.max(0, player.resources.production - 8);
                break;

            case 'evt_05': // Civil Unrest — lose 1 troop everywhere
                for (const t of owned) {
                    t.troops = Math.max(1, t.troops - 1);
                }
                break;

            case 'evt_06': // Desertion — lose 2 troops in weakest territory
                if (owned.length > 0) {
                    const weakest = [...owned].sort((a, b) => a.troops - b.troops)[0];
                    weakest.troops = Math.max(1, weakest.troops - 2);
                }
                break;

            case 'evt_07': // Corruption — lose 5 Money and 3 Production
                player.resources.money = Math.max(0, player.resources.money - 5);
                player.resources.production = Math.max(0, player.resources.production - 3);
                break;

            case 'evt_08': // Arms Race — +3 troops to capital but lose 10 Money
                if (owned.length > 0) {
                    owned[0].troops += 3; // first territory as "capital"
                    player.resources.money = Math.max(0, player.resources.money - 10);
                }
                break;

            case 'evt_09': // Meteor Shower — lose structure + 2 troops from strongest
                const withStruct = owned.filter(t => t.structures.length > 0);
                if (withStruct.length > 0) {
                    randomPick(withStruct).structures.pop();
                }
                if (owned.length > 0) {
                    const strongest = [...owned].sort((a, b) => b.troops - a.troops)[0];
                    strongest.troops = Math.max(1, strongest.troops - 2);
                }
                break;

            case 'evt_10': // Embargo — Banks produce nothing this turn
                setEffect(state, pid, 'embargo');
                break;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// ── Bonus Card Effects (affect the playing player only) ────────────────
// ═══════════════════════════════════════════════════════════════════════

function executeBonusEffect(state, playerId, card, targetTerritoryId) {
    const player = state.players[playerId];
    const owned = getPlayerTerritories(state.territories, playerId);
    const enemyId = playerId === 0 ? 1 : 0;
    const enemyOwned = getPlayerTerritories(state.territories, enemyId);

    switch (card.id) {
        // ── Production Cards ──
        case 'prod_01': // Industrial Revolution
            setEffect(state, playerId, 'doubleFactory');
            break;
        case 'prod_02': // Free Construction
            state.freeBuild = true;
            break;
        case 'prod_03': // Supply Surge
            player.resources.production += 15;
            break;
        case 'prod_04': // Overtime Workers
            player.resources.production += 8;
            break;
        case 'prod_05': // Mass Production
            state.halfCostDeploy = true;
            break;
        case 'prod_06': // Harvest Festival
            player.resources.production += 5;
            player.resources.research += 5;
            player.resources.money += 5;
            break;
        case 'prod_07': // Iron Mine
            player.resources.production += 6;
            break;
        case 'prod_08': // Assembly Line
            player.resources.production += 20;
            break;
        case 'prod_09': // Salvage Operation
            player.resources.production += 4;
            break;
        case 'prod_10': // Resource Convoy
            player.resources.production += 10;
            break;
        case 'prod_11': // Wartime Economy
            if (player.resources.money >= 10) {
                player.resources.money -= 10;
                player.resources.production += 15;
            } else {
                addLog(state, `Not enough Money for Wartime Economy`);
            }
            break;
        case 'prod_12': // Blueprint Cache
            player.resources.production += 5;
            player.resources.research += 5;
            break;

        // ── Research Cards ──
        case 'res_01': // Eureka Moment
            player.resources.research += 15;
            break;
        case 'res_02': // Stolen Blueprints
            const stolen = Math.min(10, state.players[enemyId].resources.research);
            state.players[enemyId].resources.research -= stolen;
            player.resources.research += stolen;
            break;
        case 'res_03': // Think Tank
            setEffect(state, playerId, 'doubleUniversity');
            break;
        case 'res_04': // Academic Exchange
            player.resources.research += 10;
            break;
        case 'res_05': // Innovation Grant
            player.resources.research += 8;
            drawCards(state, playerId, 1);
            break;
        case 'res_06': // Laboratory
            player.resources.research += 6;
            break;
        case 'res_07': // Breakthrough
            player.resources.research += 18;
            break;
        case 'res_08': // Knowledge Transfer
            if (player.resources.money >= 8) {
                player.resources.money -= 8;
                player.resources.research += 12;
            }
            break;
        case 'res_09': // Patent Office
            player.resources.research += 4;
            break;
        case 'res_10': // Research Expedition
            player.resources.research += 12;
            break;
        case 'res_11': { // Science Fair
            const uniCount = owned.reduce((sum, t) => sum + t.structures.filter(s => s === 'university').length, 0);
            player.resources.research += uniCount * 5;
            break;
        }
        case 'res_12': // Ancient Library
            player.resources.research += 8;
            player.resources.production += 4;
            break;

        // ── Money Cards ──
        case 'mon_01': // Tax Collection
            player.resources.money += owned.length * 3;
            break;
        case 'mon_02': // Economic Boom
            player.resources.money += 20;
            break;
        case 'mon_03': // Trade Agreement
            player.resources.money += 12;
            break;
        case 'mon_04': // Gold Rush
            setEffect(state, playerId, 'doubleBank');
            break;
        case 'mon_05': // Foreign Investment
            player.resources.money += 8;
            break;
        case 'mon_06': // War Chest
            player.resources.money += 10;
            player.resources.production += 5;
            break;
        case 'mon_07': // Treasure Map
            player.resources.money += 15;
            break;
        case 'mon_08': { // Market Manipulation
            const stolenMoney = Math.min(8, state.players[enemyId].resources.money);
            state.players[enemyId].resources.money -= stolenMoney;
            player.resources.money += stolenMoney;
            break;
        }
        case 'mon_09': // Trade Caravan
            player.resources.money += 5;
            break;
        case 'mon_10': // Royal Treasury
            player.resources.money += 25;
            break;
        case 'mon_11': { // Merchant Fleet
            const bankCount = owned.reduce((sum, t) => sum + t.structures.filter(s => s === 'bank').length, 0);
            player.resources.money += bankCount * 4;
            break;
        }
        case 'mon_12': // Loan Shark
            player.resources.money += 12;
            player.resources.production = Math.max(0, player.resources.production - 5);
            break;

        // ── Military Cards ──
        case 'mil_01': // Paradrop
            if (targetTerritoryId) {
                const t = getTerritory(state.territories, targetTerritoryId);
                if (t && t.owner === playerId) t.troops += 5;
            } else if (owned.length > 0) {
                const weakest = [...owned].sort((a, b) => a.troops - b.troops)[0];
                weakest.troops += 5;
            }
            break;
        case 'mil_02': // Mutiny
            if (enemyOwned.length > 0) {
                const weakest = [...enemyOwned].sort((a, b) => a.troops - b.troops)[0];
                weakest.troops = Math.max(1, Math.floor(weakest.troops / 2));
                addLog(state, `Mutiny! ${weakest.name} garrison halved`);
            }
            break;
        case 'mil_03': // Forced March
            if (owned.length >= 2) {
                const strongest = [...owned].sort((a, b) => b.troops - a.troops)[0];
                const adjOwned = strongest.adjacent
                    .map(id => getTerritory(state.territories, id))
                    .filter(t => t.owner === playerId);
                if (adjOwned.length > 0) {
                    const weakest = adjOwned.sort((a, b) => a.troops - b.troops)[0];
                    const moveCount = Math.min(5, strongest.troops - 1);
                    if (moveCount > 0) {
                        strongest.troops -= moveCount;
                        weakest.troops += moveCount;
                        addLog(state, `Forced march: ${moveCount} troops ${strongest.name} → ${weakest.name}`);
                    }
                }
            }
            break;
        case 'mil_04': // Veteran Troops
            setEffect(state, playerId, 'attackBonus');
            break;
        case 'mil_05': // Conscription
            if (owned.length > 0) {
                const target = targetTerritoryId ? getTerritory(state.territories, targetTerritoryId) : owned[0];
                if (target && target.owner === playerId) target.troops += 3;
            }
            break;
        case 'mil_06': // Fortify
            setEffect(state, playerId, 'defenseBonus');
            break;
        case 'mil_07': // Mercenaries
            if (targetTerritoryId) {
                const t = getTerritory(state.territories, targetTerritoryId);
                if (t && t.owner === playerId) t.troops += 4;
            } else if (owned.length > 0) {
                randomPick(owned).troops += 4;
            }
            break;
        case 'mil_08': // Alliance
            if (targetTerritoryId) {
                const t = getTerritory(state.territories, targetTerritoryId);
                if (t && t.owner === playerId) t.troops += 4;
            } else if (owned.length > 0) {
                const weakest = [...owned].sort((a, b) => a.troops - b.troops)[0];
                weakest.troops += 4;
            }
            break;
        case 'mil_09': // Spy Network
            if (state.players[enemyId].hand.length > 0) {
                const stolenCard = state.players[enemyId].hand.pop();
                if (player.hand.length < MAX_HAND_SIZE) {
                    player.hand.push(stolenCard);
                    addLog(state, `Stole ${stolenCard.name} from enemy!`);
                }
            }
            break;
        case 'mil_10': // Ambush
            setEffect(state, playerId, 'ambushBonus');
            break;
        case 'mil_11': // Garrison Reinforcement
            for (const t of owned) {
                if (t.troops === 1) t.troops += 2;
            }
            break;
        case 'mil_12': { // War Banner
            const weakThree = [...owned].sort((a, b) => a.troops - b.troops).slice(0, 3);
            for (const t of weakThree) {
                t.troops += 2;
            }
            break;
        }

        // ── Multi-Resource Cards ──
        case 'multi_01': // Golden Age
            player.resources.production += 8;
            player.resources.research += 8;
            player.resources.money += 8;
            break;
        case 'multi_02': // Bountiful Harvest
            player.resources.production += 5;
            player.resources.research += 5;
            player.resources.money += 5;
            break;
        case 'multi_03': // Diplomatic Victory
            const neutrals = getNeutralTerritories(state.territories);
            if (neutrals.length > 0) {
                const gained = randomPick(neutrals);
                gained.owner = playerId;
                gained.troops = 2;
                addLog(state, `${gained.name} joins through diplomacy!`);
            }
            break;
        case 'multi_04': // Refugees
            if (owned.length > 0) {
                const weakest = [...owned].sort((a, b) => a.troops - b.troops)[0];
                weakest.troops += 3;
                addLog(state, `Refugees bolster ${weakest.name}!`);
            }
            break;
        case 'multi_05': // Festival
            player.resources.production += 4;
            player.resources.research += 4;
            player.resources.money += 4;
            break;
        case 'multi_06': // Peace Treaty
            player.resources.money += 10;
            player.resources.research += 10;
            break;
        case 'multi_07': // Cultural Exchange
            player.resources.research += 6;
            player.resources.money += 6;
            break;
        case 'multi_08': { // Nationalization
            const factoryCount = owned.reduce((sum, t) => sum + t.structures.filter(s => s === 'factory').length, 0);
            player.resources.production += factoryCount * 3;
            player.resources.research += factoryCount * 3;
            player.resources.money += factoryCount * 3;
            break;
        }
        case 'multi_09': // War Bonds
            player.resources.production += 3;
            player.resources.money += 3;
            break;
        case 'multi_10': // Prosperity
            player.resources.production += 7;
            player.resources.money += 7;
            break;
        case 'multi_11': // Expeditionary Force
            if (owned.length > 0) {
                const weakest = [...owned].sort((a, b) => a.troops - b.troops)[0];
                weakest.troops += 3;
            }
            player.resources.production += 8;
            break;
        case 'multi_12': // Windfall
            player.resources.production += 3;
            player.resources.research += 3;
            player.resources.money += 3;
            break;
    }
}

module.exports = { drawCards, mustPlayCard, canAffordCard, playCard, executeEventEffect, executeBonusEffect };
