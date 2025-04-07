// nightland/src/modules/utils.js
export function moveToward(entity, targetRow, targetCol, speed = 1, gridWidth = 49, gridHeight = 49) {
    let dRow = targetRow - entity.position.row;
    let dCol = targetCol - entity.position.col;
    let stepsRow = Math.min(Math.abs(dRow), speed) * (dRow > 0 ? 1 : dRow < 0 ? -1 : 0);
    let stepsCol = Math.min(Math.abs(dCol), speed) * (dCol > 0 ? 1 : dCol < 0 ? -1 : 0);
  
    entity.position.row = Math.max(0, Math.min(gridHeight - 1, entity.position.row + stepsRow));
    entity.position.col = Math.max(0, Math.min(gridWidth - 1, entity.position.col + stepsCol));
  }
  
  export const moveAway = (monster, playerPosition, gridWidth, gridHeight) => {
    const dx = monster.position.col - playerPosition.col;
    const dy = monster.position.row - playerPosition.row;
    let newRow = monster.position.row + Math.sign(dy); // Move away vertically
    let newCol = monster.position.col + Math.sign(dx); // Move away horizontally
  
    // Ensure the new position is within bounds
    newRow = Math.max(0, Math.min(gridHeight - 1, newRow));
    newCol = Math.max(0, Math.min(gridWidth - 1, newCol));
  
    return { row: newRow, col: newCol };
  };


  export const disappearFarMonsters = (monsters, playerPosition, distanceThreshold = 20) => {
    return monsters.filter((monster) => {
      const dx = monster.position.col - playerPosition.col;
      const dy = monster.position.row - playerPosition.row;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= distanceThreshold;
    });
  };

  export function initializeEntityStyles(state) {
    const tileSize = state.tileSize;
  
    // Player
    const player = document.querySelector(`#${state.player?.shortName}`);
    if (player && state.player?.position) {
      player.style.left = `${state.player.position.col * tileSize}px`;
      player.style.top = `${state.player.position.row * tileSize}px`;
      player.style.transform = "none";
      player.style.visibility = "visible";
      player.style.opacity = "1";
    } else {
      console.warn("Player element or position missing:", state.player);
    }
  
    // Objects (including Redoubt)
    (state.objects || []).forEach((object) => {
      const element = document.querySelector(`#${object.shortName}`);
      if (element && object.position) {
        element.style.left = `${object.position.col * tileSize}px`;
        element.style.top = `${object.position.row * tileSize}px`;
        element.style.width = `${(object.size?.width || 1) * tileSize}px`;
        element.style.height = `${(object.size?.height || 1) * tileSize}px`;
        element.style.transform = `rotate(${object.direction || 0}deg)`;
        element.style.transformOrigin = "center center";
        element.style.visibility = "visible";
        element.style.opacity = "1";
      } else {
        console.warn("Object element or position missing:", object);
      }
    });
  
    // Great Powers
    (state.greatPowers || []).forEach((power) => {
      const element = document.querySelector(`#${power.shortName}`);
      if (element && power.position) {
        element.style.left = `${power.position.col * tileSize}px`;
        element.style.top = `${power.position.row * tileSize}px`;
        element.style.width = `${(power.size?.width || 1) * tileSize}px`;
        element.style.height = `${(power.size?.height || 1) * tileSize}px`;
        element.style.transform = "none";
        element.style.visibility = "visible";
        element.style.opacity = "1";
      } else {
        console.warn("Great Power element or position missing:", power);
      }
    });
  
    // Active Monsters
    (state.activeMonsters || []).forEach((monster) => {
      const element =
        document.querySelector(`#${monster.id}`) || // Normal state
        document.querySelector(`#combat-${monster.id}`); // Combat state
      if (element && monster.position) {
        element.style.left = `${monster.position.col * tileSize}px`;
        element.style.top = `${monster.position.row * tileSize}px`;
        element.style.transform = "none";
        element.style.visibility = "visible";
        element.style.opacity = "1";
      } else {
        console.warn("Monster element or position missing:", monster);
      }
    });
  
    // Pools
    (state.pools || []).forEach((pool) => {
      const element = document.querySelector(`#poolOfPeace-${pool.id}`);
      if (element && pool.position) {
        const template = state.poolsTemplate;
        element.style.left = `${pool.position.col * tileSize}px`;
        element.style.top = `${pool.position.row * tileSize}px`;
        element.style.width = `${(template.size?.width || 1) * tileSize}px`;
        element.style.height = `${(template.size?.height || 1) * tileSize}px`;
        element.style.transform = "none";
        element.style.visibility = "visible";
        element.style.opacity = "1";
      } else {
        console.warn("Pool element or position missing:", pool);
      }
    });
  
    // Footsteps
    (state.footsteps || []).forEach((step) => {
      const element = document.querySelector(`#footstepsPersius-${step.id}`);
      if (element && step.position) {
        const template = state.footstepsTemplate;
        element.style.left = `${step.position.col * tileSize}px`;
        element.style.top = `${step.position.row * tileSize}px`;
        element.style.width = `${(template.size?.width || 1) * tileSize}px`;
        element.style.height = `${(template.size?.height || 1) * tileSize}px`;
        element.style.transform = `rotate(${step.direction || 0}deg)`;
        element.style.transformOrigin = "center center";
        element.style.visibility = "visible";
        element.style.opacity = "1";
      } else {
        console.warn("Footstep element or position missing:", step);
      }
    });
  }
  
  export function updateViewport(state) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const statusBarHeight = 42;
    const playerRow = state.player.position.row;
    const playerCol = state.player.position.col;
    const tileSize = state.tileSize;
    const edgeDistance = 2.5; // Approximately 100px / 40px = 2.5 tiles
    const maxRow = state.gridHeight - 1; // 399 (updated from 48)
    const maxCol = state.gridWidth - 1; // 399 (updated from 48)
    const middleY = Math.floor(viewportHeight / (2 * tileSize));
  
    // Update Redoubt reference to use state.objects
    const redoubt = (state.objects || []).find(obj => obj.shortName === "redoubt");
    if (!redoubt) {
      console.warn("Redoubt not found in state.objects");
      return;
    }
  
    let translateX = -(playerCol * tileSize) + (viewportWidth / 2) - (tileSize / 2);
    let translateY = -((redoubt.position.row + 4) * tileSize - viewportHeight + statusBarHeight); // Redoubt offset (4 tiles down)
  
    let playerViewportRow = playerRow + (translateY / tileSize);
    if (playerViewportRow <= middleY) {
      translateY = -(playerRow * tileSize) + (middleY * tileSize);
    }
  
    if (playerRow < edgeDistance) {
      translateY = -(playerRow * tileSize) + (edgeDistance * tileSize);
    } else if (playerRow > maxRow - edgeDistance) {
      translateY = -((playerRow - (viewportHeight / tileSize - statusBarHeight / tileSize - edgeDistance)) * tileSize);
    }
  
    if (playerCol < edgeDistance) {
      translateX = -(playerCol * tileSize) + (edgeDistance * tileSize);
    } else if (playerCol > maxCol - edgeDistance) {
      translateX = -((playerCol - (viewportWidth / tileSize - edgeDistance)) * tileSize);
    }
  
    const gameBoard = document.querySelector(".game-board");
    if (gameBoard) {
      gameBoard.style.transform = `translate(${translateX}px, ${translateY}px)`;
      gameBoard.style.transition = "transform 0.2s ease";
    }
  }
  
  export function updateCombatDialogs(playerComment = "", enemyComments = [], player, monsters) {
    const result = {
      player: { name: player.name, hp: player.hp, comment: playerComment },
      enemies: monsters.map((m, i) => m ? { name: m.name, hp: Math.max(0, m.hp), comment: enemyComments[i] || "", dead: m.hp <= 0 } : null)
    };
    console.log("updateCombatDialogs - Player Comment:", playerComment, "Result:", result);
    return result;
  }
  
  export function updateStatusBar(player) {
    return { hp: player.hp };
  }

  // nightland/src/modules/utils.js
export const isClickWithinBounds = (event, gameBoard, object, tileSize) => {
  // Get the click coordinates relative to the game board
  const clickX = event.clientX - gameBoard.left;
  const clickY = event.clientY - gameBoard.top;

  // Convert pixel coordinates to tile coordinates
  const clickCol = Math.floor(clickX / tileSize);
  const clickRow = Math.floor(clickY / tileSize);

  // Adjust for the object's position to get relative coordinates
  const relativeRow = clickRow - object.position.row;
  const relativeCol = clickCol - object.position.col;

  // If there's a collisionMask, check if the click is within it
  if (object.collisionMask) {
    return object.collisionMask.some((mask) => {
      const maskRowStart = mask.row;
      const maskColStart = mask.col;
      const maskRowEnd = maskRowStart + (mask.height || 1) - 1;
      const maskColEnd = maskColStart + (mask.width || 1) - 1;

      return (
        relativeRow >= maskRowStart &&
        relativeRow <= maskRowEnd &&
        relativeCol >= maskColStart &&
        relativeCol <= maskColEnd
      );
    });
  }

  // If no collisionMask, check the full bounding box
  const objWidth = object.size?.width || 1;
  const objHeight = object.size?.height || 1;
  return (
    relativeRow >= 0 &&
    relativeRow < objHeight &&
    relativeCol >= 0 &&
    relativeCol < objWidth
  );
};

// Add to utils.js
export function encodeSoulKey(attributes) {
  const { str, int, dex, wil, wis, cha } = attributes;
  const plainBytes = [str, int, dex, wil, wis, cha];
  const key = [110, 105, 103, 104, 116]; // "night" ASCII values (n, i, g, h, t)
  const obfuscatedBytes = plainBytes.map((byte, i) => byte ^ key[i % key.length]);
  return obfuscatedBytes
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function decodeSoulKey(soulKey) {
  const bytes = soulKey.match(/.{2}/g).map((hex) => parseInt(hex, 16));
  const key = [110, 105, 103, 104, 116];
  const plainBytes = bytes.map((byte, i) => byte ^ key[i % key.length]);
  return {
    str: plainBytes[0],
    int: plainBytes[1],
    dex: plainBytes[2],
    wil: plainBytes[3],
    wis: plainBytes[4],
    cha: plainBytes[5],
  };
}

export function getAttributeModifier(value) {
  return Math.floor((value - 10) / 2);
}