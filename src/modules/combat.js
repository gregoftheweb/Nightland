// nightland/src/modules/combat.js
import { updateCombatDialogs } from './utils';

export let roundNumber = 1;

export function calculateTurnOrder(state, dispatch) {
    const combatants = [state.player, ...state.attackSlots.map(slot => slot.monster).filter(m => m && m.hp > 0)];
    const newTurnOrder = combatants.filter(c => c.hp > 0);
    dispatch({
        type: 'SET_COMBAT',
        payload: {
            inCombat: state.inCombat,
            attackSlots: state.attackSlots,
            turnOrder: newTurnOrder,
            combatTurn: newTurnOrder[0],
            player: state.player,
            dialogData: state.dialogData
        }
    });
}

export function resolveRound(state, dispatch) {
    const deadMonsters = state.attackSlots.filter(slot => slot.monster && slot.monster.hp <= 0);
    if (deadMonsters.length > 0) {
        deadMonsters.forEach(slot => {
            slot.monster.active = false;
            if (state.waitingMonsters.length > 0) {
                const nextMonster = state.waitingMonsters.shift();
                nextMonster.x = slot.position.x;
                nextMonster.y = slot.position.y;
                slot.monster = nextMonster;
            } else {
                slot.monster = null;
            }
        });
        const newAttackSlots = state.attackSlots.filter(s => s.monster && s.monster.hp > 0);
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
    const activeMonsters = state.activeMonsters.filter(m => m.active && m.hp > 0);
    const allAttackSlotsFull = state.attackSlots.length >= state.maxAttackers;
    activeMonsters.forEach(monster => {
        if (monster.hp > 0 && !state.attackSlots.some(slot => slot.monster === monster)) {
            const dx = Math.abs(monster.x - state.player.x);
            const dy = Math.abs(monster.y - state.player.y);
            if (allAttackSlotsFull && (dx <= 2 || dy <= 2)) {
                if (!state.waitingMonsters.includes(monster)) {
                    dispatch({
                        type: 'UPDATE_WAITING_MONSTERS',
                        payload: { waitingMonsters: [...state.waitingMonsters, monster] }
                    });
                }
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
    if (!state.inCombat || !state.turnOrder.length) return;

    const current = state.combatTurn;
    const currentIndex = state.turnOrder.indexOf(current);
    const activeMonsters = state.attackSlots.map(slot => slot.monster).filter(m => m && m.hp > 0);
    let allMonsters = state.attackSlots.map(slot => slot.monster);

    console.log('Combat Step - Current:', current?.name, 'Turn Order:', state.turnOrder.map(t => t.name), 'Active Monsters:', activeMonsters.map(m => `${m.name} HP:${m.hp}`));

    let playerComment = "";
    let enemyComments = allMonsters.map(() => "");
    let updatedPlayer = { ...state.player };
    let updatedAttackSlots = [...state.attackSlots];

    console.log('Player Check - Current.name === state.player.name:', current.name === state.player.name, 'Current:', current, 'State.Player:', state.player);

    if (current.name === state.player.name) {
        const target = activeMonsters[0];
        console.log('Player Turn - Target:', target ? `${target.name} HP:${target.hp}` : 'None');
        console.log('Active Monsters:', activeMonsters.map(m => `${m.name} HP:${m.hp}`));
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
    } else if (activeMonsters.includes(current)) {
        const monsterIndex = allMonsters.indexOf(current);
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
        if (current === state.turnOrder[state.turnOrder.length - 1]) {
            resolveRound(state, dispatch);
            updatedAttackSlots = state.attackSlots.filter(s => s.monster && s.monster.hp > 0);
            calculateTurnOrder(state, dispatch);
            roundNumber++;
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
        moveWaitingMonsters(state, dispatch);
    }
}