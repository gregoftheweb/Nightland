// nightland/src/modules/combat.js
import { updateCombatDialogs } from './utils';

export let roundNumber = 1;

export function calculateTurnOrder(state, dispatch) {
    const combatants = [state.player, ...state.attackSlots.filter(m => m && m.hp > 0)];
    const newTurnOrder = combatants.filter(c => c.hp > 0);
    console.log('Calculating turn order:', newTurnOrder.map(t => t.name));
    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: state.inCombat,
            attackSlots: state.attackSlots,
            turnOrder: newTurnOrder,
            combatTurn: newTurnOrder[0] || state.player,
            player: state.player,
            dialogData: state.dialogData
        }
    });
}

export function resolveRound(state, dispatch) {
    const deadMonsters = state.attackSlots.filter(slot => slot.hp <= 0);
    if (deadMonsters.length > 0) {
        deadMonsters.forEach(slot => {
            slot.active = false;
            if (state.waitingMonsters.length > 0) {
                const nextMonster = state.waitingMonsters.shift();
                nextMonster.slotPosition = slot.slotPosition;
                Object.assign(slot, nextMonster);
            } else {
                slot.active = false;
            }
        });
        const newAttackSlots = state.attackSlots.filter(s => s.hp > 0);
        dispatch({
            type: 'SET_COMBAT',
            payload: {
                inCombat: true,
                attackSlots: newAttackSlots,
                dialogData: state.dialogData
            }
        });
    }
}

export function moveWaitingMonsters(state, dispatch) {
    console.log('Waiting monsters before move:', state.waitingMonsters.map(m => `${m.id} at ${m.position.x}, ${m.position.y}`));
    const activeMonsters = state.activeMonsters.filter(m => m.active && m.hp > 0);
    console.log('Active monsters:', activeMonsters.map(m => `${m.id} at ${m.position.x}, ${m.position.y}`));
    const allAttackSlotsFull = state.attackSlots.length >= state.maxAttackers;
    console.log('All attack slots full:', allAttackSlotsFull, 'Max attackers:', state.maxAttackers);
    activeMonsters.forEach(monster => {
        if (monster.hp > 0 && !state.attackSlots.some(slot => slot.id === monster.id)) {
            const dx = Math.abs(monster.position.x - state.player.position.x);
            const dy = Math.abs(monster.position.y - state.player.position.y);
            console.log(`Monster ${monster.id} distance - dx: ${dx}, dy: ${dy}`);
            if (allAttackSlotsFull && (dx <= 240 || dy <= 240)) { // Increased to 240px (6 tiles)
                if (!state.waitingMonsters.some(m => m.id === monster.id)) {
                    dispatch({
                        type: 'UPDATE_WAITING_MONSTERS',
                        payload: { waitingMonsters: [...state.waitingMonsters, monster] }
                    });
                    console.log(`Added ${monster.id} to waiting monsters at ${monster.position.x}, ${monster.position.y}`);
                }
            } else if (state.waitingMonsters.some(m => m.id === monster.id)) {
                const moveDistance = (monster.moveRate || 1) * 40; // 1 tile per turn
                let newPos = { ...monster.position };
                if (monster.position.x < state.player.position.x) newPos.x += moveDistance;
                else if (monster.position.x > state.player.position.x) newPos.x -= moveDistance;
                if (monster.position.y < state.player.position.y) newPos.y += moveDistance;
                else if (monster.position.y > state.player.position.y) newPos.y -= moveDistance;

                newPos.x = Math.max(0, Math.min(1960, newPos.x));
                newPos.y = Math.max(0, Math.min(1960, newPos.y));

                dispatch({ type: 'MOVE_MONSTER', payload: { id: monster.id, position: newPos } });
                console.log(`Moved waiting ${monster.id} to ${newPos.x}, ${newPos.y}`);
            }
        }
    });
}

export function endCombat(state, dispatch) {
    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: false,
            attackSlots: [],
            waitingMonsters: [],
            turnOrder: [],
            combatTurn: null,
            player: { ...state.player, lastComment: "" },
            dialogData: updateCombatDialogs("", [], state.player, [])
        }
    });
    roundNumber = 1;
}

export function combatStep(state, dispatch) {
    if (!state.inCombat || !state.turnOrder.length) {
        console.log('Combat step aborted: not in combat or no turn order');
        return;
    }

    const current = state.combatTurn;
    const currentIndex = state.turnOrder.findIndex(t => t.id === current.id);
    if (currentIndex === -1) {
        console.error('Current turn not found in turnOrder:', current);
        return;
    }

    const activeMonsters = state.attackSlots.filter(m => m && m.hp > 0);
    let allMonsters = state.attackSlots;

    console.log('Combat Step - Current:', current?.name, 'Turn Order:', state.turnOrder.map(t => t.name), 'Active Monsters:', activeMonsters.map(m => `${m.name} HP:${m.hp}`));

    let playerComment = "";
    let enemyComments = allMonsters.map(() => "");
    let updatedPlayer = { ...state.player };
    let updatedAttackSlots = [...state.attackSlots];

    if (current.name === state.player.name) {
        const target = activeMonsters[0];
        console.log('Player Turn - Target:', target ? `${target.name} HP:${target.hp}` : 'None');
        if (target) {
            if (Math.random() < 0.8) {
                target.hp -= 6;
                playerComment = "You hit for 6 points!";
                enemyComments[0] = target.hp <= 0 ? "Monster is dead!" : "";
                console.log('Player Hit - New Monster HP:', target.hp);
            } else {
                playerComment = "You miss!";
                console.log('Player Missed');
            }
        } else {
            playerComment = "No target available!";
            console.log('No Target Available');
        }
    } else if (activeMonsters.some(m => m.id === current.id)) {
        const monsterIndex = allMonsters.findIndex(m => m.id === current.id);
        if (Math.random() < 0.5) {
            updatedPlayer.hp -= 4;
            enemyComments[monsterIndex] = "He hit you for 4 points!";
            allMonsters[monsterIndex].lastComment = "He hit you for 4 points!";
        } else {
            enemyComments[monsterIndex] = "He missed you!";
            allMonsters[monsterIndex].lastComment = "He missed you!";
        }
    }

    const dialogData = updateCombatDialogs(playerComment, enemyComments, updatedPlayer, allMonsters);
    console.log('Combat Step - Player Comment Before Update:', playerComment);
    console.log('Combat Step - Setting Dialog Data:', dialogData);

    const nextTurnIndex = (currentIndex + 1) % state.turnOrder.length;
    const nextTurn = state.turnOrder[nextTurnIndex];

    if (updatedPlayer.hp <= 0) {
        endCombat(state, dispatch);
    } else if (activeMonsters.length === 0 && state.waitingMonsters.length === 0) {
        endCombat(state, dispatch);
    } else {
        if (currentIndex === state.turnOrder.length - 1) {
            resolveRound(state, dispatch);
            updatedAttackSlots = state.attackSlots.filter(s => s.hp > 0);
            calculateTurnOrder(state, dispatch);
            roundNumber++;
            moveWaitingMonsters(state, dispatch);
            console.log('End of round, waiting monsters moved:', state.waitingMonsters.map(m => m.id));
        }

        dispatch({
            type: 'SET_COMBAT',
            payload: {
                inCombat: true,
                attackSlots: updatedAttackSlots,
                turnOrder: state.turnOrder,
                combatTurn: nextTurn,
                player: { ...updatedPlayer, lastComment: playerComment },
                dialogData: dialogData
            }
        });
        console.log('After Dispatch - inCombat:', state.inCombat, 'Next Turn:', nextTurn?.name);
    }
}