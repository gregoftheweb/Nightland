// nightland/src/modules/gameLoop.js
export const handleMovePlayer = (state, dispatch, key, showDialog) => {
    if (state.inCombat) {
        showDialog("You are in combat! Press Spacebar to proceed.");
        return;
    }

    const moveDistance = 40;
    const newPosition = { ...state.player.position };

    switch (key) {
        case 'ArrowUp':
            newPosition.y = Math.max(0, newPosition.y - moveDistance);
            break;
        case 'ArrowDown':
            newPosition.y = Math.min(1960, newPosition.y + moveDistance);
            break;
        case 'ArrowLeft':
            newPosition.x = Math.max(0, newPosition.x - moveDistance);
            break;
        case 'ArrowRight':
            newPosition.x = Math.min(1960, newPosition.x + moveDistance);
            break;
        default:
            return;
    }

    dispatch({ type: 'MOVE_PLAYER', payload: { position: newPosition } });
    showDialog(`Player moved ${key.toLowerCase().replace('arrow', '')}`);

    const newMoveCount = state.moveCount + 1;
    console.log(`Move count updated to: ${newMoveCount}`);
    dispatch({ type: 'UPDATE_MOVE_COUNT', payload: { moveCount: newMoveCount } });
    checkMonsterSpawn(state, dispatch, showDialog);
    moveMonsters(state, dispatch, showDialog);
};

const checkMonsterSpawn = (state, dispatch, showDialog) => {
    console.log('Checking monster spawn...');
    const abhuman = state.monsters.find(m => m.name === "Abhuman");
    if (!abhuman) {
        console.log('No Abhuman found in state.monsters');
        return;
    }

    console.log(`Abhuman details: spawnRate=${abhuman.spawnRate}, spawnChance=${abhuman.spawnChance}, maxInstances=${abhuman.maxInstances}`);
    console.log(`Current active monsters: ${state.activeMonsters.length}`);

    if (state.activeMonsters.length >= abhuman.maxInstances) {
        console.log('Max instances of Abhuman reached, no spawn possible');
        return;
    }

    console.log(`Move count: ${state.moveCount + 1}, spawn check: ${(state.moveCount + 1) % abhuman.spawnRate === 0}`);
    if ((state.moveCount + 1) % abhuman.spawnRate === 0) {
        const spawnRoll = Math.random();
        console.log(`Spawn roll: ${spawnRoll}, spawnChance: ${abhuman.spawnChance}`);
        if (spawnRoll < abhuman.spawnChance) {
            const spawnPosition = getSpawnPosition(state.player.position);
            const newMonster = {
                ...abhuman,
                position: spawnPosition,
                id: `abhuman-${Date.now()}`,
                active: true
            };
            console.log(`Spawning Abhuman at position: ${spawnPosition.x}, ${spawnPosition.y}`);
            dispatch({ type: 'SPAWN_MONSTER', payload: { monster: newMonster } });
            showDialog(`An Abhuman has spawned at ${spawnPosition.x}, ${spawnPosition.y}!`);
        } else {
            console.log('Spawn chance failed, no Abhuman spawned');
        }
    } else {
        console.log('Not time for spawn check yet');
    }
};

const getSpawnPosition = (playerPosition) => {
    const tileSize = 40;
    const maxX = 1960;
    const maxY = 1960;
    const minDistance = 10 * tileSize; // 400px
    const maxDistance = 15 * tileSize; // 600px

    let spawnX, spawnY, distance;
    do {
        spawnX = Math.floor(Math.random() * (maxX / tileSize)) * tileSize;
        spawnY = Math.floor(Math.random() * (maxY / tileSize)) * tileSize;
        distance = Math.sqrt(
            Math.pow(spawnX - playerPosition.x, 2) +
            Math.pow(spawnY - playerPosition.y, 2)
        );
    } while (distance < minDistance || distance > maxDistance);

    console.log(`Generated spawn position: ${spawnX}, ${spawnY}, distance from player: ${distance}px`);
    return { x: spawnX, y: spawnY };
};

const moveMonsters = (state, dispatch, showDialog) => {
    if (state.inCombat) {
        return;
    }

    state.activeMonsters.forEach(monster => {
        if (state.attackSlots.some(slot => slot.id === monster.id) || state.waitingMonsters.some(m => m.id === monster.id)) {
            return;
        }

        const moveDistance = monster.moveRate * 40; // 2 squares = 80px
        const playerPos = state.player.position;
        const monsterPos = { ...monster.position };
        let newPos = { ...monsterPos };

        console.log(`Moving ${monster.id} from ${monsterPos.x}, ${monsterPos.y} towards ${playerPos.x}, ${playerPos.y}`);

        if (monsterPos.x < playerPos.x) {
            newPos.x = Math.min(monsterPos.x + moveDistance, playerPos.x);
        } else if (monsterPos.x > playerPos.x) {
            newPos.x = Math.max(monsterPos.x - moveDistance, playerPos.x);
        }
        if (monsterPos.y < playerPos.y) {
            newPos.y = Math.min(monsterPos.y + moveDistance, playerPos.y);
        } else if (monsterPos.y > playerPos.y) {
            newPos.y = Math.max(monsterPos.y - moveDistance, playerPos.y);
        }

        newPos.x = Math.max(0, Math.min(1960, newPos.x));
        newPos.y = Math.max(0, Math.min(1960, newPos.y));

        if (checkCollision(newPos, playerPos)) {
            setupCombat(state, dispatch, monster, showDialog);
        } else {
            if (state.attackSlots.length >= 4) {
                const distance = Math.sqrt(
                    Math.pow(newPos.x - playerPos.x, 2) +
                    Math.pow(newPos.y - playerPos.y, 2)
                );
                const minDistance = 2 * 40; // 2 squares = 80px
                if (distance <= minDistance) {
                    if (!state.waitingMonsters.some(m => m.id === monster.id)) {
                        dispatch({
                            type: 'UPDATE_WAITING_MONSTERS',
                            payload: {
                                waitingMonsters: [...state.waitingMonsters, { ...monster, position: newPos }]
                            }
                        });
                    }
                    return;
                }
            }
            dispatch({ type: 'MOVE_MONSTER', payload: { id: monster.id, position: newPos } });
        }
    });
};

const checkCollision = (monsterPos, playerPos) => {
    const tileSize = 40;
    return (
        Math.abs(monsterPos.x - playerPos.x) < tileSize &&
        Math.abs(monsterPos.y - playerPos.y) < tileSize
    );
};

const setupCombat = (state, dispatch, monster, showDialog) => {
    if (state.inCombat) {
        return;
    }

    console.log('Collision detected - Christos position:', state.player.position);
    let newAttackSlots = [...state.attackSlots];
    let newWaitingMonsters = [...state.waitingMonsters];

    if (!newAttackSlots.some(slot => slot.id === monster.id) && !newWaitingMonsters.some(m => m.id === monster.id)) {
        if (newAttackSlots.length < 4) {
            newAttackSlots.push(monster);
        } else {
            newWaitingMonsters.push(monster);
        }
    }

    const slotPositions = [
        { x: -40, y: -40 }, // Slot 1: Christos X - 40px, Christos Y - 40px
        { x: 40, y: -40 },  // Slot 2: Christos X + 40px, Christos Y - 40px
        { x: -40, y: 0 },   // Slot 3: Christos X - 40px, Christos Y
        { x: 40, y: 0 }     // Slot 4: Christos X + 40px, Christos Y
    ];

    console.log('Assigning attack slots:', newAttackSlots.map(slot => slot.id));
    newAttackSlots = newAttackSlots.map((slotMonster, index) => {
        const playerPos = state.player.position;
        const slotPos = slotPositions[index];
        console.log(`Assigning ${slotMonster.id} to slot ${index + 1} at offset ${slotPos.x}, ${slotPos.y} relative to ${playerPos.x}, ${playerPos.y}`);
        return {
            ...slotMonster,
            slotPosition: slotPos
        };
    });

    const newTurnOrder = [state.player, ...newAttackSlots];

    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: true,
            attackSlots: newAttackSlots,
            waitingMonsters: newWaitingMonsters,
            turnOrder: newTurnOrder,
            combatTurn: newTurnOrder[0]
        }
    });

    showDialog(`Combat initiated with ${monster.name}! Press Spacebar to proceed.`);
};








// Existing exports unchanged
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

    const powerElement = document.querySelector(`#watcher`);
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