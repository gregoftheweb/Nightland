// nightland/src/modules/gameLoop.js
// nightland/src/modules/gameLoop.js (partial update for handleMovePlayer)
export const handleMovePlayer = (state, dispatch, key, showDialog) => {
    const moveDistance = 40; // Match tileSize or element size (40px as in your styles)
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

    // Update DOM element position for player
    const player = document.querySelector('#player');
    if (player) {
        console.log('Updating player DOM position to:', newPosition);
        player.style.left = `${newPosition.x}px`;
        player.style.top = `${newPosition.y}px`;
        player.style.transform = 'none'; // Remove transform for absolute positioning
        player.style.visibility = 'visible'; // Ensure visible
        player.style.opacity = '1'; // Ensure fully opaque

        // No direct transform here; rely on App.js useEffect to handle scrolling
    }

    showDialog(`Player moved ${key.toLowerCase().replace('arrow', '')}`);
};

export const handleMoveMonster = (state, dispatch, monsterName, key, showDialog) => {
    const moveDistance = 40; // Match tileSize or element size
    const monster = state.monsters.find(m => m.name === monsterName);
    if (!monster) return;

    const newPosition = { ...monster.position };

    switch (key) {
        case 'ArrowUp':
            newPosition.y = Math.max(0, newPosition.y - moveDistance);
            break;
        case 'ArrowDown':
            newPosition.y = Math.min(15960, newPosition.y + moveDistance);
            break;
        case 'ArrowLeft':
            newPosition.x = Math.max(0, newPosition.x - moveDistance);
            break;
        case 'ArrowRight':
            newPosition.x = Math.min(15960, newPosition.x + moveDistance);
            break;
        default:
            return;
    }

    dispatch({ type: 'MOVE_MONSTER', payload: { name: monsterName, position: newPosition } });

    // Update DOM element position for the monster (class .monster)
    const monsterElement = document.querySelector(`.monster[data-name="${monsterName}"]`);
    if (monsterElement) {
        monsterElement.style.left = `${newPosition.x}px`;
        monsterElement.style.top = `${newPosition.y}px`;
        monsterElement.style.transform = 'none';
    }

    showDialog(`Monster ${monsterName} moved ${key.toLowerCase().replace('arrow', '')}`);
};

export const handleMoveGreatPower = (state, dispatch, powerName, key, showDialog) => {
    const moveDistance = 40; // Match tileSize or element size
    const power = state.greatPowers.find(p => p.name === powerName);
    if (!power) return;

    const newPosition = { ...power.position };

    switch (key) {
        case 'ArrowUp':
            newPosition.y = Math.max(0, newPosition.y - moveDistance);
            break;
        case 'ArrowDown':
            newPosition.y = Math.min(15960, newPosition.y + moveDistance);
            break;
        case 'ArrowLeft':
            newPosition.x = Math.max(0, newPosition.x - moveDistance);
            break;
        case 'ArrowRight':
            newPosition.x = Math.min(15960, newPosition.x + moveDistance);
            break;
        default:
            return;
    }

    dispatch({ type: 'MOVE_GREAT_POWER', payload: { name: powerName, position: newPosition } });

    // Update DOM element position for the great power (e.g., #watcher)
    const powerElement = document.querySelector(`#watcher`); // Adjust selector based on your HTML
    if (powerElement) {
        powerElement.style.left = `${newPosition.x}px`;
        powerElement.style.top = `${newPosition.y}px`;
        powerElement.style.transform = 'none';
    }

    showDialog(`Great Power ${powerName} moved ${key.toLowerCase().replace('arrow', '')}`);
};

export const handleMoveRedoubt = (state, dispatch, key, showDialog) => {
    const moveDistance = 40; // Match tileSize or element size
    const newPosition = { ...state.redoubt.position };

    switch (key) {
        case 'ArrowUp':
            newPosition.y = Math.max(0, newPosition.y - moveDistance);
            break;
        case 'ArrowDown':
            newPosition.y = Math.min(15960, newPosition.y + moveDistance);
            break;
        case 'ArrowLeft':
            newPosition.x = Math.max(0, newPosition.x - moveDistance);
            break;
        case 'ArrowRight':
            newPosition.x = Math.min(15960, newPosition.x + moveDistance);
            break;
        default:
            return;
    }

    dispatch({ type: 'MOVE_REDOUBT', payload: { position: newPosition } });

    // Update DOM element position for redoubt
    const redoubt = document.querySelector('#redoubt');
    if (redoubt) {
        console.log('Updating redoubt DOM position to:', newPosition);
        redoubt.style.left = `${newPosition.x}px`;
        redoubt.style.top = `${newPosition.y}px`;
        redoubt.style.transform = 'none';
        redoubt.style.visibility = 'visible';
        redoubt.style.opacity = '1';
    }

    showDialog(`Redoubt moved ${key.toLowerCase().replace('arrow', '')}`);
};

export const handleCombatStep = (state, dispatch, showDialog) => {
    console.log('Combat step executed');
    // Add combat logic here if needed (e.g., update HP, turn order, etc.)
    showDialog('Combat step taken');
};