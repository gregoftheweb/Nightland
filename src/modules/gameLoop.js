// nightland/src/modules/gameLoop.js (updated)
import { resetChristos } from "./combat";
import * as textContent from "../assets/copy/textcontent";

export const handleMovePlayer = (state, dispatch, key, showDialog, setDeathMessage) => {
  if (state.inCombat) return;

  const newPosition = { ...state.player.position };
  switch (key) {
    case "ArrowUp": newPosition.row = Math.max(0, newPosition.row - 1); break;
    case "ArrowDown": newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1); break;
    case "ArrowLeft": newPosition.col = Math.max(0, newPosition.col - 1); break;
    case "ArrowRight": newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1); break;
    default: return;
  }

  const watcher = state.greatPowers.find((power) => power.shortName === "watcherse");
  if (watcher && newPosition.row === watcher.position.row && newPosition.col === watcher.position.col) {
    const deathMessageKey = `combatChristosDeath${watcher.shortName}`;
    const deathMessage = textContent[deathMessageKey];
    dispatch({ type: "UPDATE_PLAYER_HP", payload: { hp: 0 } });
    resetChristos(state, dispatch);
    setDeathMessage(deathMessage);
    return;
  }

  dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });

  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  // Pass updated state with new moveCount
  const updatedState = {
    ...state,
    player: { ...state.player, position: newPosition },
    moveCount: newMoveCount,
  };
  checkMonsterSpawn(updatedState, dispatch, showDialog);
  moveMonsters(updatedState, dispatch, showDialog, newPosition);
};

// nightland/src/modules/gameLoop.js (excerpt)
export const checkMonsterSpawn = (state, dispatch, showDialog) => {
  const abhumanTemplate = state.monsters.find((m) => m.name === "Abhuman");
  if (!abhumanTemplate) return;

  if (state.activeMonsters.length >= abhumanTemplate.maxInstances) return;

  if (
    (state.moveCount + 1) % abhumanTemplate.spawnRate === 0 &&
    Math.random() < abhumanTemplate.spawnChance
  ) {
    const spawnPosition = getSpawnPosition(state.player.position);
    const newMonster = {
      ...abhumanTemplate,
      position: spawnPosition,
      id: `${abhumanTemplate.shortName}-${Date.now()}`, // Kept shortName in ID for consistency
      active: true,
      hp: 20,
    };
    dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
  }
};

const getSpawnPosition = (playerPosition) => {
  let spawnRow, spawnCol, distance;
  const gridHeight = 400;
  const gridWidth = 400;
  do {
    spawnRow = playerPosition.row + Math.floor(Math.random() * 11) - 5; // ±5 tiles
    spawnCol = playerPosition.col + Math.floor(Math.random() * 11) - 5;
    spawnRow = Math.max(0, Math.min(gridHeight - 1, spawnRow));
    spawnCol = Math.max(0, Math.min(gridWidth - 1, spawnCol));
    distance = Math.sqrt(
      Math.pow(spawnRow - playerPosition.row, 2) +
      Math.pow(spawnCol - playerPosition.col, 2)
    );
  } while (distance < 5 || distance > 10); // 5-10 tiles away
  return { row: spawnRow, col: spawnCol };
};

export const moveMonsters = (
  state,
  dispatch,
  showDialog,
  playerPosOverride
) => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;

  state.activeMonsters.forEach((monster) => {
    if (
      state.attackSlots.some((slot) => slot.id === monster.id) ||
      state.waitingMonsters.some((m) => m.id === monster.id)
    ) {
      return;
    }

    const moveDistance = monster.moveRate;
    let newPos = { ...monster.position };

    if (monster.position.row < playerPos.row)
      newPos.row = Math.min(monster.position.row + moveDistance, playerPos.row);
    else if (monster.position.row > playerPos.row)
      newPos.row = Math.max(monster.position.row - moveDistance, playerPos.row);
    if (monster.position.col < playerPos.col)
      newPos.col = Math.min(monster.position.col + moveDistance, playerPos.col);
    else if (monster.position.col > playerPos.col)
      newPos.col = Math.max(monster.position.col - moveDistance, playerPos.col);

    newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
    newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));

    if (checkCollision(newPos, playerPos)) {
      setupCombat(state, dispatch, monster, showDialog, playerPos);
    } else {
      if (state.attackSlots.length >= state.maxAttackers) {
        const distance = Math.sqrt(
          Math.pow(newPos.row - playerPos.row, 2) +
            Math.pow(newPos.col - playerPos.col, 2)
        );
        if (distance <= 2) {
          if (!state.waitingMonsters.some((m) => m.id === monster.id)) {
            dispatch({
              type: "UPDATE_WAITING_MONSTERS",
              payload: {
                waitingMonsters: [
                  ...state.waitingMonsters,
                  { ...monster, position: newPos },
                ],
              },
            });
          }
          return;
        }
      }
      dispatch({
        type: "MOVE_MONSTER",
        payload: { id: monster.id, position: newPos },
      });
    }
  });
};

const checkCollision = (monsterPos, playerPos) => {
  return monsterPos.row === playerPos.row && monsterPos.col === playerPos.col;
};

const setupCombat = (
  state,
  dispatch,
  monster,
  showDialog,
  playerPosOverride
) => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;
  let newAttackSlots = [...state.attackSlots];
  let newWaitingMonsters = [...state.waitingMonsters];

  const slotPositions = [
    { row: playerPos.row - 1, col: playerPos.col - 1 },
    { row: playerPos.row - 1, col: playerPos.col + 1 },
    { row: playerPos.row + 1, col: playerPos.col - 1 },
    { row: playerPos.row + 1, col: playerPos.col + 1 },
  ];

  if (!newAttackSlots.some((slot) => slot.id === monster.id)) {
    if (newAttackSlots.length < state.maxAttackers) {
      const usedUISlots = newAttackSlots.map((slot) => slot.uiSlot || 0);
      const nextUISlot = [0, 1, 2, 3].find(
        (slot) => !usedUISlots.includes(slot)
      );
      monster.position = { ...slotPositions[nextUISlot] };
      monster.uiSlot = nextUISlot;
      newAttackSlots.push(monster);
    } else {
      if (!newWaitingMonsters.some((m) => m.id === monster.id)) {
        newWaitingMonsters.push(monster);
      }
    }
  }

  const updatedActiveMonsters = state.activeMonsters.map((m) =>
    m.id === monster.id
      ? { ...m, position: monster.position, uiSlot: monster.uiSlot }
      : m
  );

  const newTurnOrder = [state.player, ...newAttackSlots];

  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: true,
      attackSlots: newAttackSlots,
      waitingMonsters: newWaitingMonsters,
      turnOrder: newTurnOrder,
      combatTurn: newTurnOrder[0],
    },
  });

  dispatch({
    type: "UPDATE_ACTIVE_MONSTERS",
    payload: { activeMonsters: updatedActiveMonsters },
  });
};

export const handleMoveMonster = (state, dispatch, monsterId, direction) => {
  const monster = state.activeMonsters.find((m) => m.id === monsterId);
  if (!monster || state.inCombat) return;

  const newPosition = { ...monster.position };
  const moveDistance = monster.moveRate;
  switch (direction) {
    case "up":
      newPosition.row = Math.max(0, newPosition.row - moveDistance);
      break;
    case "down":
      newPosition.row = Math.min(
        state.gridHeight - 1,
        newPosition.row + moveDistance
      );
      break;
    case "left":
      newPosition.col = Math.max(0, newPosition.col - moveDistance);
      break;
    case "right":
      newPosition.col = Math.min(
        state.gridWidth - 1,
        newPosition.col + moveDistance
      );
      break;
    default:
      break;
  }
  dispatch({
    type: "MOVE_MONSTER",
    payload: { id: monsterId, position: newPosition },
  });
};

export const handleMoveRedoubt = (state, dispatch, direction) => {
  const newPosition = { ...state.redoubt.position };
  switch (direction) {
    case "up":
      newPosition.row = Math.max(0, newPosition.row - 1);
      break;
    case "down":
      newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1);
      break;
    case "left":
      newPosition.col = Math.max(0, newPosition.col - 1);
      break;
    case "right":
      newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1);
      break;
    default:
      break;
  }
  dispatch({ type: "MOVE_REDOUBT", payload: { position: newPosition } });
};