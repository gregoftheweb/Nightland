// nightland/src/modules/combat.js
import { moveMonsters, checkMonsterSpawn } from './gameLoop';

export const combatStep = (state, dispatch) => {
    console.log("Combat Step - Current:", state.combatTurn.name, "Turn Order:", state.turnOrder, "Active Monsters:", state.activeMonsters.map(m => `${m.name} HP:${m.hp}`));
    let newTurnOrder = [...state.turnOrder];
    let newCombatTurn = state.combatTurn;
    let newAttackSlots = [...state.attackSlots];
    let newWaitingMonsters = [...state.waitingMonsters];

    // Move waiting monsters into combat if slots are available
    const moveWaitingMonsters = (state, dispatch) => {
        console.log("Moving waiting monsters - Waiting Monsters:", state.waitingMonsters);
        if (!state.waitingMonsters || !Array.isArray(state.waitingMonsters)) {
            console.warn("waitingMonsters is undefined or not an array, skipping move.");
            return;
        }

        const availableSlots = state.maxAttackers - state.attackSlots.length;
        if (availableSlots > 0 && state.waitingMonsters.length > 0) {
            const playerPos = state.player.position;
            const slotPositions = [
                { row: playerPos.row - 1, col: playerPos.col - 1 },
                { row: playerPos.row - 1, col: playerPos.col + 1 },
                { row: playerPos.row + 1, col: playerPos.col - 1 },
                { row: playerPos.row + 1, col: playerPos.col + 1 }
            ];

            state.waitingMonsters.slice(0, availableSlots).forEach((monster, index) => {
                const newPosition = slotPositions[(state.attackSlots.length + index) % 4];
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

            dispatch({
                type: 'SET_COMBAT',
                payload: {
                    inCombat: true,
                    attackSlots: newAttackSlots,
                    waitingMonsters: newWaitingMonsters,
                    turnOrder: [...state.turnOrder, ...newAttackSlots],
                    combatTurn: state.combatTurn
                }
            });
        }
    };

    // Handle combat logic
    if (state.combatTurn === state.player) {
        const target = state.attackSlots[0];
        if (target) {
            const damage = Math.floor(Math.random() * state.player.attack) + 1;
            const newHP = Math.max(0, target.hp - damage);
            dispatch({ type: 'UPDATE_MONSTER_HP', payload: { id: target.id, hp: newHP } });

            if (newHP <= 0) {
                newAttackSlots = newAttackSlots.filter(slot => slot.id !== target.id);
                const updatedActiveMonsters = state.activeMonsters.filter(m => m.id !== target.id);
                dispatch({
                    type: 'UPDATE_ACTIVE_MONSTERS',
                    payload: { activeMonsters: updatedActiveMonsters }
                });
            }
        }
    } else {
        const enemy = state.attackSlots.find(e => e === state.combatTurn);
        if (enemy) {
            const damage = Math.floor(Math.random() * enemy.attack) + 1;
            dispatch({ type: 'UPDATE_PLAYER_HP', payload: { hp: Math.max(0, state.player.hp - damage) } });
        }
    }

    const currentIndex = state.turnOrder.indexOf(state.combatTurn);
    const nextIndex = (currentIndex + 1) % state.turnOrder.length;
    newCombatTurn = state.turnOrder[nextIndex];

    const isFullTurnComplete = nextIndex === 0;

    newTurnOrder = [state.player, ...newAttackSlots];
    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: newAttackSlots.length > 0,
            attackSlots: newAttackSlots,
            waitingMonsters: newWaitingMonsters,
            turnOrder: newTurnOrder,
            combatTurn: newCombatTurn
        }
    });

    moveWaitingMonsters({ ...state, attackSlots: newAttackSlots, waitingMonsters: newWaitingMonsters }, dispatch);

    // Increment moveCount and check for spawns after each combat turn
    const newMoveCount = state.moveCount + 1;
    dispatch({ type: 'UPDATE_MOVE_COUNT', payload: { moveCount: newMoveCount } });
    checkMonsterSpawn({ ...state, moveCount: newMoveCount }, dispatch, (msg) => console.log(msg));

    if (isFullTurnComplete) {
        const showDialog = (msg) => console.log(msg);
        moveMonsters({ ...state, attackSlots: newAttackSlots, waitingMonsters: newWaitingMonsters, inCombat: false }, dispatch, showDialog);
    }
};