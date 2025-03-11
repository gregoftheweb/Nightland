// nightland/src/modules/utils.js
export function moveToward(entity, targetRow, targetCol, speed = 1, gridWidth = 49, gridHeight = 49) {
    let dRow = targetRow - entity.position.row;
    let dCol = targetCol - entity.position.col;
    let stepsRow = Math.min(Math.abs(dRow), speed) * (dRow > 0 ? 1 : dRow < 0 ? -1 : 0);
    let stepsCol = Math.min(Math.abs(dCol), speed) * (dCol > 0 ? 1 : dCol < 0 ? -1 : 0);

    entity.position.row = Math.max(0, Math.min(gridHeight - 1, entity.position.row + stepsRow));
    entity.position.col = Math.max(0, Math.min(gridWidth - 1, entity.position.col + stepsCol));
}

export function initializeEntityStyles(state) {
    const player = document.querySelector('#player');
    const redoubt = document.querySelector('#redoubt');
    const tileSize = state.tileSize;

    if (player && state.player.position) {
        player.style.left = `${state.player.position.col * tileSize}px`;
        player.style.top = `${state.player.position.row * tileSize}px`;
        player.style.transform = 'none';
        player.style.visibility = 'visible';
        player.style.opacity = '1';
    }

    if (redoubt && state.redoubt.position) {
        redoubt.style.left = `${state.redoubt.position.col * tileSize}px`;
        redoubt.style.top = `${state.redoubt.position.row * tileSize}px`;
        redoubt.style.transform = 'none';
        redoubt.style.visibility = 'visible';
        redoubt.style.opacity = '1';
    }

    state.activeMonsters.forEach(monster => {
        const monsterElement = document.querySelector(`#${monster.id}`);
        if (monsterElement) {
            monsterElement.style.left = `${monster.position.col * tileSize}px`;
            monsterElement.style.top = `${monster.position.row * tileSize}px`;
            monsterElement.style.transform = 'none';
            monsterElement.style.visibility = 'visible';
            monsterElement.style.opacity = '1';
        }
    });
}

export function updateViewport(state) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const statusBarHeight = 42;
    const playerRow = state.player.position.row;
    const playerCol = state.player.position.col;
    const tileSize = state.tileSize;
    const edgeDistance = 2.5; // Approximately 100px / 40px = 2.5 tiles
    const maxRow = state.gridHeight - 1; // 48
    const maxCol = state.gridWidth - 1; // 48
    const middleY = Math.floor(viewportHeight / (2 * tileSize)); // Middle in tile units

    let translateX = -(playerCol * tileSize) + (viewportWidth / 2) - (tileSize / 2);
    let translateY = -((state.redoubt.position.row + 4) * tileSize - viewportHeight + statusBarHeight); // Redoubt offset (4 tiles down)

    let playerViewportRow = playerRow + (translateY / tileSize);
    if (playerViewportRow <= middleY) {
        translateY = -(playerRow * tileSize) + (middleY * tileSize);
    }

    if (playerRow < edgeDistance) {
        translateY = -(playerRow * tileSize) + (edgeDistance * tileSize);
    } else if (playerRow > maxRow - edgeDistance) {
        translateY = -((playerRow - (viewportHeight / tileSize - statusBarHeight / tileSize - edgeDistance)) * tileSize);
    }

    if (playerCol < edgeDistance) {
        translateX = -(playerCol * tileSize) + (edgeDistance * tileSize);
    } else if (playerCol > maxCol - edgeDistance) {
        translateX = -((playerCol - (viewportWidth / tileSize - edgeDistance)) * tileSize);
    }

    const gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        gameBoard.style.transform = `translate(${translateX}px, ${translateY}px)`;
        gameBoard.style.transition = 'transform 0.2s ease';
    }
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