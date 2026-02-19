// ── Risky Civ — Card Helpers ────────────────────────────────────────

/** Check if a player can afford to play a card */
export function canAffordCard(state, playerId, cardIndex) {
    const player = state.players[playerId];
    if (cardIndex < 0 || cardIndex >= player.hand.length) return false;
    const card = player.hand[cardIndex];
    const cost = card.cost || 0;
    return player.resources.money >= cost;
}
