// nightland/src/modules/combat.js
import { moveMonsters, checkMonsterSpawn } from "./gameLoop";
import * as textContent from "../assets/copy/textcontent";
import { initialState } from "./gameState";



export const combatStep = (state, dispatch, setLastAction = () => {}) => {
  let newTurnOrder = [state.player, ...state.attackSlots];
  let newCombatTurn = state.combatTurn;
  let newAttackSlots = [...state.attackSlots];
  let newWaitingMonsters = [...state.waitingMonsters];

  // If Christos is hidden, enemies skip their turns, and combat may end
  if (state.player.isHidden) {
    // If it's the player's turn, allow it to proceed (e.g., to end combat manually)
    if (state.combatTurn && state.combatTurn.name === state.player.name) {
      const target = newAttackSlots[0];
      if (target) {
        const damage = Math.floor(Math.random() * 20) + 5;
        const newHP = Math.max(0, target.hp - damage);

        if (damage > 1) {
          setLastAction({ type: "PLAYER_HIT", damage });
          if (newHP <= 0) {
            setLastAction({ type: "ENEMY_DEATH" });
          }
        } else {
          setLastAction({ type: "PLAYER_MISS" });
        }

        newAttackSlots = newAttackSlots.map((slot) =>
          slot.id === target.id ? { ...slot, hp: newHP } : slot
        );
        dispatch({
          type: "UPDATE_MONSTER_HP",
          payload: { id: target.id, hp: newHP },
        });
      }
      newCombatTurn = newAttackSlots.length > 0 ? newAttackSlots[0] : null;
    } else {
      // If it's an enemy's turn, skip it and move to the next turn (player's turn)
      setLastAction({ type: "ENEMY_SKIP", message: "The enemy cannot find you!" });
      newCombatTurn = state.player; // Reset to player’s turn
    }
  } else {
    // Normal combat flow when not hidden
    if (
      state.combatTurn === null ||
      (state.combatTurn && state.combatTurn.name === state.player.name)
    ) {
      const target = newAttackSlots[0];
      if (target) {
        const damage = Math.floor(Math.random() * 20) + 5;
        const newHP = Math.max(0, target.hp - damage);

        if (damage > 1) {
          setLastAction({ type: "PLAYER_HIT", damage });
          if (newHP <= 0) {
            setLastAction({ type: "ENEMY_DEATH" });
          }
        } else {
          setLastAction({ type: "PLAYER_MISS" });
        }

        newAttackSlots = newAttackSlots.map((slot) =>
          slot.id === target.id ? { ...slot, hp: newHP } : slot
        );
        dispatch({
          type: "UPDATE_MONSTER_HP",
          payload: { id: target.id, hp: newHP },
        });
      }
      newCombatTurn = newAttackSlots.length > 0 ? newAttackSlots[0] : null;
    } else {
      const enemy = newAttackSlots.find((e) => e === state.combatTurn);
      if (enemy && enemy.hp > 0) {
        const damage = Math.floor(Math.random() * enemy.attack) + 1;
        const newPlayerHP = Math.max(0, state.player.hp - damage);

        if (damage > 1) {
          setLastAction({ type: "ENEMY_HIT", damage });
          if (newPlayerHP <= 0) {
            const deathMessageKey = `combatChristosDeath${enemy.shortName}`;
            const deathMessage = textContent[deathMessageKey] || textContent.combatChristosDeathDefault;
            setLastAction({ type: "PLAYER_DEATH", message: deathMessage });
          }
        } else {
          setLastAction({ type: "ENEMY_MISS" });
        }

        dispatch({ type: "UPDATE_PLAYER_HP", payload: { hp: newPlayerHP } });

        if (newPlayerHP <= 0) {
          resetChristos(state, dispatch);
          return;
        }
      } else if (enemy && enemy.hp <= 0) {
        // No action needed here
      }

      const currentIndex = newAttackSlots.indexOf(state.combatTurn);
      const nextIndex = currentIndex + 1;
      if (nextIndex < newAttackSlots.length) {
        newCombatTurn = newAttackSlots[nextIndex];
      } else {
        newCombatTurn = state.player;
      }
    }
  }

  // Clean up dead monsters
  const deadMonsterIds = newAttackSlots
    .filter((slot) => slot.hp <= 0)
    .map((slot) => slot.id);
  newAttackSlots = newAttackSlots.filter((slot) => slot.hp > 0);
  const updatedActiveMonsters = state.activeMonsters.filter(
    (m) => !deadMonsterIds.includes(m.id)
  );
  dispatch({
    type: "UPDATE_ACTIVE_MONSTERS",
    payload: { activeMonsters: updatedActiveMonsters },
  });

  if (newAttackSlots.length !== state.attackSlots.length) {
    newTurnOrder = [state.player, ...newAttackSlots];
  }

  const combatContinues = newAttackSlots.length > 0;

  const { updatedAttackSlots, updatedWaitingMonsters } = moveWaitingMonsters(
    state,
    dispatch,
    newAttackSlots,
    newWaitingMonsters
  );
  newAttackSlots = updatedAttackSlots;
  newWaitingMonsters = updatedWaitingMonsters;

  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: combatContinues,
      attackSlots: newAttackSlots,
      waitingMonsters: newWaitingMonsters,
      turnOrder: newTurnOrder,
      combatTurn: newCombatTurn,
    },
  });

  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  checkMonsterSpawn(
    { ...state, moveCount: newMoveCount },
    dispatch,
    (msg) => {}
  );

  const isFullTurnComplete = newCombatTurn === state.player;
  if (isFullTurnComplete && combatContinues) {
    const showDialog = (msg) => {};
    moveMonsters(
      {
        ...state,
        attackSlots: newAttackSlots,
        waitingMonsters: newWaitingMonsters,
        inCombat: false,
      },
      dispatch,
      showDialog
    );
  }
};


const moveWaitingMonsters = (state, dispatch, attackSlots, waitingMonsters) => {
  if (!waitingMonsters || !Array.isArray(waitingMonsters)) {
    return {
      updatedAttackSlots: attackSlots,
      updatedWaitingMonsters: waitingMonsters,
    };
  }

  const availableSlots = state.maxAttackers - attackSlots.length;
  if (availableSlots <= 0 || waitingMonsters.length === 0) {
    return {
      updatedAttackSlots: attackSlots,
      updatedWaitingMonsters: waitingMonsters,
    };
  }

  const playerPos = state.player.position;
  const slotPositions = [
    { row: playerPos.row - 1, col: playerPos.col - 1 },
    { row: playerPos.row - 1, col: playerPos.col + 1 },
    { row: playerPos.row + 1, col: playerPos.col - 1 },
    { row: playerPos.row + 1, col: playerPos.col + 1 },
  ];

  let newAttackSlots = [...attackSlots];
  let newWaitingMonsters = [...waitingMonsters];

  waitingMonsters.slice(0, availableSlots).forEach((monster, index) => {
    const newPosition = slotPositions[(attackSlots.length + index) % 4];
    newAttackSlots.push({ ...monster, position: newPosition });
    newWaitingMonsters = newWaitingMonsters.filter((m) => m.id !== monster.id);

    const updatedActiveMonsters = state.activeMonsters.map((m) =>
      m.id === monster.id ? { ...m, position: newPosition } : m
    );
    dispatch({
      type: "UPDATE_ACTIVE_MONSTERS",
      payload: { activeMonsters: updatedActiveMonsters },
    });
  });

  return {
    updatedAttackSlots: newAttackSlots,
    updatedWaitingMonsters: newWaitingMonsters,
  };
};

export const resetChristos = (state, dispatch) => {
  dispatch({
    type: "UPDATE_PLAYER_HP",
    payload: { hp: initialState.player.hp },
  });
  dispatch({
    type: "MOVE_PLAYER",
    payload: { position: { row: 395, col: 200 } },
  });
  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: false,
      attackSlots: [],
      waitingMonsters: [],
      turnOrder: [],
      combatTurn: null,
    },
  });
  dispatch({
    type: "UPDATE_ACTIVE_MONSTERS",
    payload: { activeMonsters: [] },
  });
  dispatch({
    type: "UPDATE_MOVE_COUNT",
    payload: { moveCount: 0 },
  });
};