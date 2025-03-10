// nightland/src/modules/movement.js
export const initializePositions = (state) => {
    const player = document.querySelector('#player');
    const redoubt = document.querySelector('#redoubt');
    const gameBoard = document.querySelector('.game-board');

    if (player && state.player.position) {
        player.style.left = `${state.player.position.x}px`;
        player.style.top = `${state.player.position.y}px`;
        player.style.transform = 'none';
        player.style.visibility = 'visible';
        player.style.opacity = '1';
    }

    if (redoubt && state.redoubt.position) {
        redoubt.style.left = `${state.redoubt.position.x}px`;
        redoubt.style.top = `${state.redoubt.position.y}px`;
        redoubt.style.transform = 'none';
        redoubt.style.visibility = 'visible';
        redoubt.style.opacity = '1';
    }

    state.activeMonsters.forEach(monster => {
        const monsterElement = document.querySelector(`#${monster.id}`);
        if (monsterElement) {
            monsterElement.style.left = `${monster.position.x}px`;
            monsterElement.style.top = `${monster.position.y}px`;
        }
    });

    if (gameBoard) {
        updateViewport(state);
    }
};

export const updateViewport = (state) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const statusBarHeight = 42;
    const playerX = state.player.position.x;
    const playerY = state.player.position.y;
    const edgeDistance = 100;
    const maxX = 1960;
    const maxY = 1960;
    const middleY = viewportHeight / 2;

    let translateX = -playerX + (viewportWidth / 2) - (40 / 2);
    let translateY = -(state.redoubt.position.y + 160 - viewportHeight + statusBarHeight);

    let playerViewportY = playerY + translateY;
    if (playerViewportY <= middleY) {
        translateY = -playerY + middleY;
    }

    if (playerY < edgeDistance) {
        translateY = -playerY + edgeDistance;
    } else if (playerY > maxY - edgeDistance) {
        translateY = -(playerY - (viewportHeight - statusBarHeight - edgeDistance));
    }

    if (playerX < edgeDistance) {
        translateX = -playerX + edgeDistance;
    } else if (playerX > maxX - edgeDistance) {
        translateX = -(playerX - (viewportWidth - edgeDistance));
    }

    const gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        gameBoard.style.transform = `translate(${translateX}px, ${translateY}px)`;
        gameBoard.style.transition = 'transform 0.2s ease';
    }
};