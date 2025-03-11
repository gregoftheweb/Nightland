// nightland/src/modules/gameLoop.js
export const handleMovePlayer = (state, dispatch, key, showDialog) => {
    if (state.inCombat) {
        showDialog("You are in combat! Press Spacebar to proceed.");
        return;
    }

    const newPosition = { ...state.player.position };
    switch (key) {
        case 'ArrowUp': newPosition.row = Math.max(0, newPosition.row - 1); break;
        case 'ArrowDown': newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1); break;
        case 'ArrowLeft': newPosition.col = Math.max(0, newPosition.col - 1); break;
        case 'ArrowRight': newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1); break;
        default: return;
    }

    dispatch({ type: 'MOVE_PLAYER', payload: { position: newPosition } });
    showDialog(`Player moved ${key.toLowerCase().replace('arrow', '')}`);

    const newMoveCount = state.moveCount + 1;
    dispatch({ type: 'UPDATE_MOVE_COUNT', payload: { moveCount: newMoveCount } });
    checkMonsterSpawn(state, dispatch, showDialog);
    moveMonsters(state, dispatch, showDialog);
};

const checkMonsterSpawn = (state, dispatch, showDialog) => {
    const abhumanTemplate = state.monsters.find(m => m.name === "Abhuman");
    if (!abhumanTemplate || state.activeMonsters.length >= abhumanTemplate.maxInstances) return;

    if ((state.moveCount + 1) % abhumanTemplate.spawnRate === 0 && Math.random() < abhumanTemplate.spawnChance) {
        const spawnPosition = getSpawnPosition(state.player.position);
        const newMonster = {
            ...abhumanTemplate,
            position: spawnPosition,
            id: `abhuman-${Date.now()}`,
            active: true,
            hp: 20
        };
        dispatch({ type: 'SPAWN_MONSTER', payload: { monster: newMonster } });
        showDialog(`An Abhuman has spawned at row ${spawnPosition.row}, col ${spawnPosition.col}!`);
    }
};

const getSpawnPosition = (playerPosition) => {
    let spawnRow, spawnCol, distance;
    const gridHeight = 400;
    const gridWidth = 400;
    do {
        spawnRow = Math.floor(Math.random() * gridHeight);
        spawnCol = Math.floor(Math.random() * gridWidth);
        distance = Math.sqrt(
            Math.pow(spawnRow - playerPosition.row, 2) +
            Math.pow(spawnCol - playerPosition.col, 2)
        );
    } while (distance < 10 || distance > 15);
    return { row: spawnRow, col: spawnCol };
};

export const moveMonsters = (state, dispatch, showDialog) => {
    if (state.inCombat) return;

    state.activeMonsters.forEach(monster => {
        if (state.attackSlots.some(slot => slot.id === monster.id) || state.waitingMonsters.some(m => m.id === monster.id)) {
            return;
        }

        const moveDistance = monster.moveRate;
        const playerPos = state.player.position;
        let newPos = { ...monster.position };

        if (monster.position.row < playerPos.row) newPos.row = Math.min(monster.position.row + moveDistance, playerPos.row);
        else if (monster.position.row > playerPos.row) newPos.row = Math.max(monster.position.row - moveDistance, playerPos.row);
        if (monster.position.col < playerPos.col) newPos.col = Math.min(monster.position.col + moveDistance, playerPos.col);
        else if (monster.position.col > playerPos.col) newPos.col = Math.max(monster.position.col - moveDistance, playerPos.col);

        newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
        newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));

        if (checkCollision(newPos, playerPos)) {
            setupCombat(state, dispatch, monster, showDialog);
        } else {
            if (state.attackSlots.length >= state.maxAttackers) {
                const distance = Math.sqrt(
                    Math.pow(newPos.row - playerPos.row, 2) +
                    Math.pow(newPos.col - playerPos.col, 2)
                );
                if (distance <= 2) {
                    if (!state.waitingMonsters.some(m => m.id === monster.id)) {
                        dispatch({
                            type: 'UPDATE_WAITING_MONSTERS',
                            payload: { waitingMonsters: [...state.waitingMonsters, { ...monster, position: newPos }] }
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
    return monsterPos.row === playerPos.row && monsterPos.col === playerPos.col;
};



const setupCombat = (state, dispatch, monster, showDialog) => {
    if (state.inCombat) return;

    const playerPos = state.player.position;
    let newAttackSlots = [...state.attackSlots];
    let newWaitingMonsters = [...state.waitingMonsters];

    const slotPositions = [
        { row: playerPos.row - 1, col: playerPos.col - 1 },
        { row: playerPos.row - 1, col: playerPos.col + 1 },
        { row: playerPos.row + 1, col: playerPos.col - 1 },
        { row: playerPos.row + 1, col: playerPos.col + 1 }
    ];

    if (!newAttackSlots.some(slot => slot.id === monster.id)) {
        if (newAttackSlots.length < state.maxAttackers) {
            const slotIndex = newAttackSlots.length;
            monster.position = slotPositions[slotIndex];
            newAttackSlots.push(monster);
        } else {
            if (!newWaitingMonsters.some(m => m.id === monster.id)) {
                newWaitingMonsters.push(monster);
            }
        }
    }

    const updatedActiveMonsters = state.activeMonsters.map(m => 
        m.id === monster.id ? { ...m, position: monster.position } : m
    );

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

    dispatch({
        type: 'UPDATE_ACTIVE_MONSTERS',
        payload: { activeMonsters: updatedActiveMonsters }
    });

    showDialog(`Combat initiated with ${monster.name}! Press Spacebar to proceed.`);
};


export const handleMoveMonster = (state, dispatch, monsterId, direction) => {
    const monster = state.activeMonsters.find(m => m.id === monsterId);
    if (!monster || state.inCombat) return;

    const newPosition = { ...monster.position };
    const moveDistance = monster.moveRate;
    switch (direction) {
        case 'up': newPosition.row = Math.max(0, newPosition.row - moveDistance); break;
        case 'down': newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + moveDistance); break;
        case 'left': newPosition.col = Math.max(0, newPosition.col - moveDistance); break;
        case 'right': newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + moveDistance); break;
        default: break;
    }
    dispatch({ type: 'MOVE_MONSTER', payload: { id: monsterId, position: newPosition } });
};

export const handleMoveRedoubt = (state, dispatch, direction) => {
    const newPosition = { ...state.redoubt.position };
    switch (direction) {
        case 'up': newPosition.row = Math.max(0, newPosition.row - 1); break;
        case 'down': newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1); break;
        case 'left': newPosition.col = Math.max(0, newPosition.col - 1); break;
        case 'right': newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1); break;
        default: break;
    }
    dispatch({ type: 'MOVE_REDOUBT', payload: { position: newPosition } });
};