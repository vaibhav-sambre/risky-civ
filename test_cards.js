const { createGame, playCardAction } = require('./server/game');
const { BONUS_CARDS } = require('./server/config');

const state = createGame();
const player = state.players[0];

// find a card that doesn't add money
const testCard = BONUS_CARDS.find(c => c.id === 'prod_01'); // cost 5

player.hand = [{ ...testCard }];
const initialMoney = player.resources.money; // 15
console.log(`Initial money: ${initialMoney}`);
console.log(`Card cost: ${testCard.cost}`);

const res = playCardAction(state, 0);

if (res.error) console.log('Error:', res.error);
else {
    console.log(`Final money: ${player.resources.money}`);
    console.log(`Expected: ${initialMoney - testCard.cost}`);
}
