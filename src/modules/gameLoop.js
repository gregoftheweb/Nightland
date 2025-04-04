// nightland/src/modules/gameLoop.js (updated)
import { resetChristos } from "./combat";
import * as textContent from "../assets/copy/textcontent";
import { moveAway, disappearFarMonsters } from "./utils"; // Add this import

// nightland/src/modules/gameLoop.js

export const handleMovePlayer = (
  state,
  dispatch,
  key,
  showDialog,
  setDeathMessage
) => {
  if (state.inCombat) return;

  let isMove = true;

  const newPosition = { ...state.player.position };

  switch (key) {
    case "ArrowUp":
      newPosition.row = Math.max(0, newPosition.row - 1);
      break;
    case "ArrowDown":
      newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1);
      break;
    case "ArrowLeft":
      newPosition.col = Math.max(0, newPosition.col - 1);
      break;
    case "ArrowRight":
      newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1);
      break;
    case " ":
      isMove = false;
      break;
    default:
      console.log("handleMovePlayer - Unknown key, returning");
      return;
  }

  // Move the player
  if (isMove) {
    console.log("handleMovePlayer - Dispatching MOVE_PLAYER to:", newPosition);
    dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  }
  const updatedState = {
    ...state,
    player: { ...state.player, position: newPosition },
  };

  // Check for collectible items (NEW)
  const itemAtPosition = state.items.find((item) => {
    const itemRowStart = item.position.row;
    const itemColStart = item.position.col;
    const itemWidth = item.size?.width || 1;
    const itemHeight = item.size?.height || 1;
    const itemRowEnd = itemRowStart + itemHeight - 1;
    const itemColEnd = itemColStart + itemWidth - 1;

    return (
      item.active &&
      item.collectible &&
      newPosition.row >= itemRowStart &&
      newPosition.row <= itemRowEnd &&
      newPosition.col >= itemColStart &&
      newPosition.col <= itemColEnd
    );
  });

  if (itemAtPosition) {
    const item = {
      id: `${itemAtPosition.shortName}-${Date.now()}`,
      name: itemAtPosition.name,
      description: itemAtPosition.description,
    };
    dispatch({ type: "ADD_TO_INVENTORY", payload: { item } });
    showDialog(`Picked up ${item.name}!`, 3000);
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        shortName: itemAtPosition.shortName,
        updates: { active: false },
      },
    });
  }

  // Check for objects with effects at the new position, considering size
  const objectAtPosition = state.objects.find((obj) => {
    if (!obj.active) return false;

    // Use collisionMask if present, otherwise fall back to full size
    if (obj.collisionMask) {
      return obj.collisionMask.some((mask) => {
        const objRowStart = obj.position.row + mask.row;
        const objColStart = obj.position.col + mask.col;
        const objRowEnd = objRowStart + (mask.height || 1) - 1;
        const objColEnd = objColStart + (mask.width || 1) - 1;

        return (
          newPosition.row >= objRowStart &&
          newPosition.row <= objRowEnd &&
          newPosition.col >= objColStart &&
          newPosition.col <= objColEnd
        );
      });
    } else {
      const objRowStart = obj.position.row;
      const objColStart = obj.position.col;
      const objWidth = obj.size?.width || 1;
      const objHeight = obj.size?.height || 1;
      const objRowEnd = objRowStart + objHeight - 1;
      const objColEnd = objColStart + objWidth - 1;

      return (
        newPosition.row >= objRowStart &&
        newPosition.row <= objRowEnd &&
        newPosition.col >= objColStart &&
        newPosition.col <= objColEnd
      );
    }
  });

  if (objectAtPosition) {
    console.log("Collided with:", objectAtPosition.name, "at", newPosition);
  }

  if (objectAtPosition && objectAtPosition.effects) {
    const now = Date.now();
    const lastTrigger = objectAtPosition.lastTrigger || 0;
    if (now - lastTrigger > 50000) {
      // 5-second cooldown
      console.log("Collision with:", objectAtPosition, "at", newPosition);
      objectAtPosition.effects.forEach((effect) => {
        dispatch({
          type: "TRIGGER_EFFECT",
          payload: { effect, position: newPosition },
        });
        switch (effect.type) {
          case "swarm":
            showDialog(
              `A swarm of ${effect.monsterType}s emerges from the ${objectAtPosition.name}!`,
              3000
            );
            dispatch({
              type: "UPDATE_OBJECT",
              payload: {
                shortName: objectAtPosition.shortName,
                updates: { lastTrigger: now },
              },
            });
            break;
          case "hide":
            showDialog(
              `The ${objectAtPosition.name} cloaks you in silence.`,
              3000
            );
            break;
          case "heal":
            showDialog(
              `The ${objectAtPosition.name} restores your strength!`,
              3000
            );
            break;
          default:
            break;
        }
      });
    }
  }

  // Check for pools with effects (already handles size)
  const poolAtPosition = state.pools.find((pool) => {
    const poolRowStart = pool.position.row;
    const poolColStart = pool.position.col;
    const poolMiddleRowStart = poolRowStart + 1;
    const poolMiddleColStart = poolColStart + 1;
    const poolMiddleRowEnd = poolMiddleRowStart + 1;
    const poolMiddleColEnd = poolMiddleColStart + 1;

    return (
      newPosition.row >= poolMiddleRowStart &&
      newPosition.row <= poolMiddleRowEnd &&
      newPosition.col >= poolMiddleColStart &&
      newPosition.col <= poolMiddleColEnd
    );
  });
  if (poolAtPosition && state.poolsTemplate.effects) {
    console.log("handleMovePlayer - Pool at position:", poolAtPosition, "Effects:", state.poolsTemplate.effects);
    state.poolsTemplate.effects.forEach((effect) => {
      console.log("handleMovePlayer - Triggering effect:", effect);
      dispatch({
        type: "TRIGGER_EFFECT",
        payload: { effect, position: newPosition },
      });
      switch (effect.type) {
        case "heal":
          showDialog("The Pool of Peace restores your strength!", 3000);
          break;
        case "hide":
          showDialog(`The ${state.poolsTemplate.name} cloaks you in silence.`, 3000);
          break;
        default:
          console.log("handleMovePlayer - Unknown effect type:", effect.type);
          break;
      }
    });
  }

  // Watcher collision check (already handles size)
  const watcher = updatedState.greatPowers.find(
    (power) => power.shortName === "watcherse"
  );
  if (watcher) {
    const watcherLeft = watcher.position.col;
    const watcherTop = watcher.position.row;
    const watcherWidth = watcher.size?.width || 1;
    const watcherHeight = watcher.size?.height || 1;
    const watcherRight = watcherLeft + watcherWidth - 1;
    const watcherBottom = watcherTop + watcherHeight - 1;

    if (
      newPosition.row >= watcherTop &&
      newPosition.row <= watcherBottom &&
      newPosition.col >= watcherLeft &&
      newPosition.col <= watcherRight
    ) {
      const deathMessageKey = `combatChristosDeath${watcher.shortName}`;
      const deathMessage =
        textContent[deathMessageKey] || textContent.combatChristosDeathDefault;

      dispatch({ type: "UPDATE_PLAYER_HP", payload: { hp: 0 } });
      resetChristos(updatedState, dispatch);
      setDeathMessage(deathMessage);
      return;
    }
  }

  // Decrement hide turns if Christos is hidden
  if (state.player.isHidden) {
    dispatch({ type: "DECREMENT_HIDE_TURNS" });
  }

  // Update move count and finalize state
  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  const finalState = { ...updatedState, moveCount: newMoveCount };

  // Monster spawning and movement (skip combat initiation if hidden)
  checkMonsterSpawn(finalState, dispatch, showDialog);

  moveMonsters(finalState, dispatch, showDialog, newPosition);
};

export const moveMonsters = (
  state,
  dispatch,
  showDialog,
  playerPosOverride
) => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;
  console.log(
    "moveMonsters - isHidden:",
    state.player.isHidden,
    "playerPos:",
    playerPos
  );

  // First, handle movement for each monster
  state.activeMonsters.forEach((monster) => {
    if (
      state.attackSlots.some((slot) => slot.id === monster.id) ||
      state.waitingMonsters.some((m) => m.id === monster.id)
    ) {
      console.log(
        `Monster ${monster.id} skipped (in attackSlots or waitingMonsters)`
      );
      return;
    }

    let newPos;
    if (state.player.isHidden) {
      console.log(
        `Monster ${monster.id} - Moving away from player. Current position:`,
        monster.position
      );
      newPos = moveAway(monster, playerPos, state.gridWidth, state.gridHeight);
      console.log(
        `Monster ${monster.id} - New position after moveAway:`,
        newPos
      );
    } else {
      console.log(
        `Monster ${monster.id} - Moving toward player. Current position:`,
        monster.position
      );
      const moveDistance = monster.moveRate;
      newPos = { ...monster.position };

      if (monster.position.row < playerPos.row) {
        newPos.row = Math.min(
          monster.position.row + moveDistance,
          playerPos.row
        );
      } else if (monster.position.row > playerPos.row) {
        newPos.row = Math.max(
          monster.position.row - moveDistance,
          playerPos.row
        );
      }
      if (monster.position.col < playerPos.col) {
        newPos.col = Math.min(
          monster.position.col + moveDistance,
          playerPos.col
        );
      } else if (monster.position.col > playerPos.col) {
        newPos.col = Math.max(
          monster.position.col - moveDistance,
          playerPos.col
        );
      }

      newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
      newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));

      if (checkCollision(newPos, playerPos)) {
        if (!state.player.isHidden) {
          console.log(
            `Monster ${monster.id} - Collision detected, setting up combat`
          );
          setupCombat(state, dispatch, monster, showDialog, playerPos);
        } else {
          console.log(
            `Monster ${monster.id} - Collision detected, but player is hidden, no combat`
          );
        }
        return;
      } else {
        if (state.attackSlots.length >= state.maxAttackers) {
          const distance = Math.sqrt(
            Math.pow(newPos.row - playerPos.row, 2) + // Fixed from new Pos.row to newPos.row
              Math.pow(newPos.col - playerPos.col, 2)
          );
          if (distance <= 2) {
            if (!state.waitingMonsters.some((m) => m.id === monster.id)) {
              console.log(
                `Monster ${monster.id} - Added to waitingMonsters at position:`,
                newPos
              );
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
      }
      console.log(
        `Monster ${monster.id} - New position after moving toward player:`,
        newPos
      );
    }

    dispatch({
      type: "MOVE_MONSTER",
      payload: { id: monster.id, position: newPos },
    });
  });

  // After moving all monsters, remove those that are too far away
  console.log(
    "Before disappearFarMonsters - activeMonsters:",
    state.activeMonsters
  );
  const filteredMonsters = disappearFarMonsters(
    state.activeMonsters,
    playerPos
  );
  console.log(
    "After disappearFarMonsters - filteredMonsters:",
    filteredMonsters
  );
  if (filteredMonsters.length !== state.activeMonsters.length) {
    console.log("Monster(s) disappeared due to distance.");
    dispatch({
      type: "UPDATE_ACTIVE_MONSTERS",
      payload: { activeMonsters: filteredMonsters },
    });
  }
};

export const checkMonsterSpawn = (state, dispatch, showDialog) => {
  const currentLevel = state.levels.find((lvl) => lvl.id === state.level);
  if (!currentLevel) return; // Safety check

  // For Level 1, use existing monsters; this can be adjusted per level later
  state.monsters.forEach((monsterTemplate) => {
    const activeCount = state.activeMonsters.filter(
      (m) => m.name === monsterTemplate.name
    ).length;

    if (activeCount >= monsterTemplate.maxInstances) return;

    if (
      (state.moveCount + 1) % monsterTemplate.spawnRate === 0 &&
      Math.random() < monsterTemplate.spawnChance
    ) {
      const spawnPosition = getSpawnPosition(state.player.position);
      const newMonster = {
        ...monsterTemplate,
        position: spawnPosition,
        id: `${monsterTemplate.shortName}-${Date.now()}`,
        active: true,
        hp: monsterTemplate.hp || 20,
      };
      dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
    }
  });
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
