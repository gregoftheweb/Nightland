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

    if (gameBoard) {
        updateViewport(state);
    }
};

export const handleMovePlayer = (state, dispatch, key, showDialog) => {
    const moveDistance = 40; // Match tileSize or element size (40px)
    const newPosition = { ...state.player.position };

    switch (key) {
        case 'ArrowUp':
            newPosition.y = Math.max(0, newPosition.y - moveDistance); // Prevent going off top (y >= 0)
            break;
        case 'ArrowDown':
            newPosition.y = Math.min(1960, newPosition.y + moveDistance); // Prevent going off bottom (y <= 1960)
            break;
        case 'ArrowLeft':
            newPosition.x = Math.max(0, newPosition.x - moveDistance); // Prevent going off left (x >= 0)
            break;
        case 'ArrowRight':
            newPosition.x = Math.min(1960, newPosition.x + moveDistance); // Prevent going off right (x <= 1960)
            break;
        default:
            return;
    }

    dispatch({ type: 'MOVE_PLAYER', payload: { position: newPosition } });
    showDialog(`Player moved ${key.toLowerCase().replace('arrow', '')}`);

    // Update DOM and viewport
    const player = document.querySelector('#player');
    if (player) {
        console.log('Updating player DOM position to:', newPosition);
        player.style.left = `${newPosition.x}px`;
        player.style.top = `${newPosition.y}px`;
        player.style.transform = 'none';
        player.style.visibility = 'visible';
        player.style.opacity = '1';
    }

    updateViewport(state);
};

export const updateViewport = (state) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const statusBarHeight = 42; // Height of status bar
    const playerX = state.player.position.x;
    const playerY = state.player.position.y;
    const edgeDistance = 100; // Distance from edges to trigger scrolling
    const maxX = 1960; // Maximum x position on 2000x2000 game board
    const maxY = 1960; // Maximum y position on 2000x2000 game board
    const middleY = viewportHeight / 2; // Middle of the viewport

    let translateX = -playerX + (viewportWidth / 2) - (40 / 2); // Center player horizontally
    let translateY = -(state.redoubt.position.y + 160 - viewportHeight + statusBarHeight); // Align redoubt bottom with top of status bar

    // Calculate player's position in the viewport after initial translation
    let playerViewportY = playerY + translateY;

    // Check if player has reached the middle of the viewport vertically
    if (playerViewportY <= middleY) {
        translateY = -playerY + middleY; // Center player exactly at middleY
    }

    // Prevent scrolling past top or bottom of game board
    if (playerY < edgeDistance) {
        translateY = -playerY + edgeDistance;
    } else if (playerY > maxY - edgeDistance) {
        translateY = -(playerY - (viewportHeight - statusBarHeight - edgeDistance));
    }

    // Horizontal scrolling if player is within edgeDistance of left or right edges
    if (playerX < edgeDistance) {
        translateX = -playerX + edgeDistance;
    } else if (playerX > maxX - edgeDistance) {
        translateX = -(playerX - (viewportWidth - edgeDistance));
    }

    // Apply transform to game board
    const gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        gameBoard.style.transform = `translate(${translateX}px, ${translateY}px)`;
        gameBoard.style.transition = 'transform 0.2s ease';
    }
};