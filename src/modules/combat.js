// nightland/src/modules/combat.js
import { moveMonsters, checkMonsterSpawn } from './gameLoop'; // Adjust path if needed

export const combatStep = (state, dispatch, setLastAction = () => {}) => {
    let newTurnOrder = [state.player, ...state.attackSlots];
    let newCombatTurn = state.combatTurn;
    let newAttackSlots = [...state.attackSlots];
    let newWaitingMonsters = [...state.waitingMonsters];

    console.log("Current combatTurn:", state.combatTurn ? state.combatTurn.name : "null");

    if (state.combatTurn === null || (state.combatTurn && state.combatTurn.name === state.player.name)) {
        console.log("Christos' turn triggered");
        const target = newAttackSlots[0];
        if (target) {
            const damage = Math.floor(Math.random() * 20) + 5; // Adjusted for testing (5-24)
            const newHP = Math.max(0, target.hp - damage);
            
            if (damage > 1) {
                setLastAction({ type: 'PLAYER_HIT', damage });
                console.log(`${state.player.name} hits ${target.name} in slot 1 for ${damage} points`);
                if (newHP <= 0) {
                    // Increase delay to 1500ms (1.5 seconds) for visibility
                    setTimeout(() => setLastAction({ type: 'ENEMY_DEATH' }), 1500);
                    console.log(`${target.name} dies`);
                }
            } else {
                setLastAction({ type: 'PLAYER_MISS' });
                console.log(`${state.player.name} misses ${target.name} in slot 1`);
            }
            console.log(`${target.name} hp: ${newHP}`);
            
            newAttackSlots = newAttackSlots.map(slot =>
                slot.id === target.id ? { ...slot, hp: newHP } : slot
            );
            dispatch({ type: 'UPDATE_MONSTER_HP', payload: { id: target.id, hp: newHP } });
        }
        newCombatTurn = newAttackSlots.length > 0 ? newAttackSlots[0] : null;
    } else {
        const enemy = newAttackSlots.find(e => e === state.combatTurn);
        if (enemy && enemy.hp > 0) {
            const damage = Math.floor(Math.random() * enemy.attack) + 1;
            const newPlayerHP = Math.max(0, state.player.hp - damage);
            
            if (damage > 1) {
                setLastAction({ type: 'ENEMY_HIT', damage });
                console.log(`${enemy.name} hits ${state.player.name} for ${damage} points`);
                if (newPlayerHP <= 0) {
                    setTimeout(() => setLastAction({ type: 'PLAYER_DEATH' }), 100);
                }
            } else {
                setLastAction({ type: 'ENEMY_MISS' });
                console.log(`${enemy.name} misses ${state.player.name}`);
            }
            console.log(`${state.player.name} at ${newPlayerHP} hp`);
            dispatch({ type: 'UPDATE_PLAYER_HP', payload: { hp: newPlayerHP } });

            if (newPlayerHP <= 0) {
                resetChristos(state, dispatch);
                console.log("Christos dies and resets");
                return;
            }
        } else if (enemy && enemy.hp <= 0) {
            console.log(`${enemy.name} is dead and cannot attack`);
        }

        const currentIndex = newAttackSlots.indexOf(state.combatTurn);
        const nextIndex = currentIndex + 1;
        if (nextIndex < newAttackSlots.length) {
            newCombatTurn = newAttackSlots[nextIndex];
        } else {
            newCombatTurn = state.player;
            console.log("-- END OF ROUND");
        }
    }

    const deadMonsterIds = newAttackSlots.filter(slot => slot.hp <= 0).map(slot => slot.id);
    newAttackSlots = newAttackSlots.filter(slot => slot.hp > 0);
    const updatedActiveMonsters = state.activeMonsters.filter(m => !deadMonsterIds.includes(m.id));
    dispatch({
        type: 'UPDATE_ACTIVE_MONSTERS',
        payload: { activeMonsters: updatedActiveMonsters }
    });

    if (newAttackSlots.length !== state.attackSlots.length) {
        newTurnOrder = [state.player, ...newAttackSlots];
    }

    const combatContinues = newAttackSlots.length > 0;

    const { updatedAttackSlots, updatedWaitingMonsters } = moveWaitingMonsters(state, dispatch, newAttackSlots, newWaitingMonsters);
    newAttackSlots = updatedAttackSlots;
    newWaitingMonsters = updatedWaitingMonsters;

    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: combatContinues,
            attackSlots: newAttackSlots,
            waitingMonsters: newWaitingMonsters,
            turnOrder: newTurnOrder,
            combatTurn: newCombatTurn
        }
    });

    const newMoveCount = state.moveCount + 1;
    dispatch({ type: 'UPDATE_MOVE_COUNT', payload: { moveCount: newMoveCount } });
    checkMonsterSpawn({ ...state, moveCount: newMoveCount }, dispatch, (msg) => {});

    const isFullTurnComplete = newCombatTurn === state.player;
    if (isFullTurnComplete && combatContinues) {
        const showDialog = (msg) => {};
        moveMonsters({ ...state, attackSlots: newAttackSlots, waitingMonsters: newWaitingMonsters, inCombat: false }, dispatch, showDialog);
    }
};

// [Rest of the file - moveWaitingMonsters and resetChristos - remains unchanged]

const moveWaitingMonsters = (state, dispatch, attackSlots, waitingMonsters) => {
    if (!waitingMonsters || !Array.isArray(waitingMonsters)) {
        console.warn("waitingMonsters is undefined or not an array, skipping move.");
        return { updatedAttackSlots: attackSlots, updatedWaitingMonsters: waitingMonsters };
    }

    const availableSlots = state.maxAttackers - attackSlots.length;
    if (availableSlots <= 0 || waitingMonsters.length === 0) {
        return { updatedAttackSlots: attackSlots, updatedWaitingMonsters: waitingMonsters };
    }

    const playerPos = state.player.position;
    const slotPositions = [
        { row: playerPos.row - 1, col: playerPos.col - 1 },
        { row: playerPos.row - 1, col: playerPos.col + 1 },
        { row: playerPos.row + 1, col: playerPos.col - 1 },
        { row: playerPos.row + 1, col: playerPos.col + 1 }
    ];

    let newAttackSlots = [...attackSlots];
    let newWaitingMonsters = [...waitingMonsters];

    waitingMonsters.slice(0, availableSlots).forEach((monster, index) => {
        const newPosition = slotPositions[(attackSlots.length + index) % 4];
        newAttackSlots.push({ ...monster, position: newPosition });
        newWaitingMonsters = newWaitingMonsters.filter(m => m.id !== monster.id);

        const updatedActiveMonsters = state.activeMonsters.map(m =>
            m.id === monster.id ? { ...m, position: newPosition } : m
        );
        dispatch({
            type: 'UPDATE_ACTIVE_MONSTERS',
            payload: { activeMonsters: updatedActiveMonsters }
        });
    });

    return { updatedAttackSlots: newAttackSlots, updatedWaitingMonsters: newWaitingMonsters };
};

const resetChristos = (state, dispatch) => {
    dispatch({
        type: 'UPDATE_PLAYER_HP',
        payload: { hp: 100 }
    });
    dispatch({
        type: 'MOVE_PLAYER',
        payload: { position: { row: 395, col: 200 } }
    });
    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: false,
            attackSlots: [],
            waitingMonsters: [],
            turnOrder: [],
            combatTurn: null
        }
    });
    dispatch({
        type: 'UPDATE_ACTIVE_MONSTERS',
        payload: { activeMonsters: [] } // Clear all monsters
    });
    dispatch({
        type: 'UPDATE_MOVE_COUNT',
        payload: { moveCount: 0 } // Reset moveCount for a new game
    });
    console.log("Game fully reset: Christos back to redoubt, all monsters cleared.");
};
