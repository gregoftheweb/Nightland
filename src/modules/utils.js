// nightland/src/modules/utils.js
export function moveToward(entity, targetX, targetY, speed = 1) {
    let dx = targetX - entity.x;
    let dy = targetY - entity.y;
    let stepsX = Math.min(Math.abs(dx), speed) * (dx > 0 ? 1 : dx < 0 ? -1 : 0);
    let stepsY = Math.min(Math.abs(dy), speed) * (dy > 0 ? 1 : dy < 0 ? -1 : 0);

    entity.x = Math.max(0, Math.min(20 - 1, entity.x + stepsX));
    entity.y = Math.max(0, Math.min(40 - 1, entity.y + stepsY));
}


export function updateCombatDialogs(playerComment = "", enemyComments = [], player, monsters) {
    const result = {
        player: { name: player.name, hp: player.hp, comment: playerComment },
        enemies: monsters.map((m, i) => m ? { name: m.name, hp: Math.max(0, m.hp), comment: enemyComments[i] || "", dead: m.hp <= 0 } : null)
    };
    console.log('updateCombatDialogs - Player Comment:', playerComment, 'Result:', result);
    return result;
}



export function updateStatusBar(player) {
    return { hp: player.hp };
}