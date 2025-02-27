// scripts/utils.js (module)
export function moveToward(entity, targetX, targetY, speed = 1) {
    let dx = targetX - entity.x;
    let dy = targetY - entity.y;
    let stepsX = Math.min(Math.abs(dx), speed) * (dx > 0 ? 1 : dx < 0 ? -1 : 0);
    let stepsY = Math.min(Math.abs(dy), speed) * (dy > 0 ? 1 : dy < 0 ? -1 : 0);

    entity.x = Math.max(0, Math.min(20 - 1, entity.x + stepsX));
    entity.y = Math.max(0, Math.min(40 - 1, entity.y + stepsY));
}

export function updateCombatDialogs(playerComment = "", enemyComments = [], player, monsters) {
    const playerDiv = document.getElementById('combat-player');
    if (playerDiv) {
        playerDiv.innerHTML = `${player.name}<br>HP: ${player.hp}<br>${playerComment}`;
        playerDiv.style.display = 'block';
    }

    for (let i = 1; i <= 4; i++) {
        const enemyDiv = document.getElementById(`combat-enemy${i}`);
        const monster = monsters[i - 1];
        if (enemyDiv) {
            if (monster) {
                const displayHP = Math.max(0, monster.hp); // Cap HP at 0
                enemyDiv.innerHTML = `${monster.name}<br>HP: ${displayHP}<br>${enemyComments[i - 1] || ""}`;
                enemyDiv.style.display = 'block';
            } else {
                enemyDiv.style.display = 'none';
            }
        }
    }
}

export function updateStatusBar(player) {
    document.getElementById('hp-display').textContent = `HP: ${player.hp}`;
    document.getElementById('gear-icon').style.filter = 'invert(15%) sepia(99%) saturate(3000%) hue-rotate(0deg) brightness(70%) contrast(110%)';
}