// nightland/src/modules/combat.js
import { moveMonsters } from './gameLoop';

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

                // Update activeMonsters with new position
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
        // Christos attacks the first monster in attackSlots
        const target = state.attackSlots[0];
        if (target) {
            const damage = Math.floor(Math.random() * state.player.attack) + 1;
            const newHP = Math.max(0, target.hp - damage);
            dispatch({ type: 'UPDATE_MONSTER_HP', payload: { id: target.id, hp: newHP } });

            // Remove dead monsters
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
        // Monster attacks Christos
        const enemy = state.attackSlots.find(e => e === state.combatTurn);
        if (enemy) {
            const damage = Math.floor(Math.random() * enemy.attack) + 1;
            dispatch({ type: 'UPDATE_PLAYER_HP', payload: { hp: Math.max(0, state.player.hp - damage) } });
        }
    }

    // Update turn
    const currentIndex = state.turnOrder.indexOf(state.combatTurn);
    const nextIndex = (currentIndex + 1) % state.turnOrder.length;
    newCombatTurn = state.turnOrder[nextIndex];

    // Check if a full combat turn has completed (back to Christos)
    const isFullTurnComplete = nextIndex === 0;

    // Update turn state
    newTurnOrder = [state.player, ...newAttackSlots];
    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: newAttackSlots.length > 0, // End combat if no more attackers
            attackSlots: newAttackSlots,
            waitingMonsters: newWaitingMonsters,
            turnOrder: newTurnOrder,
            combatTurn: newCombatTurn
        }
    });

    // Move waiting monsters after combat turn
    moveWaitingMonsters({ ...state, attackSlots: newAttackSlots, waitingMonsters: newWaitingMonsters }, dispatch);

    // Trigger a single move turn for non-attacking monsters after a full combat turn
    if (isFullTurnComplete) {
        const showDialog = (msg) => console.log(msg); // Temporary for testing
        moveMonsters({ ...state, attackSlots: newAttackSlots, waitingMonsters: newWaitingMonsters, inCombat: false }, dispatch, showDialog);
    }
};