// src/modules/gameState.js
import { level1State } from "./level1State";

export const getInitialState = (levelId = 1) => {
  const levelConfig = levelId === 1 ? level1State : level1State; // Default to level1State for now
  return {
    gridWidth: 400,
    gridHeight: 400,
    tileSize: 40,
    viewHeight: 800,
    map: Array(400)
      .fill()
      .map(() => Array(400).fill(".")),
    level: levelConfig.id,
    levels: [levelConfig],
    player: {
      name: "Christos",
      shortName: "christos",
      hp: 100,
      maxHP: 100,
      position: { row: 395, col: 200 },
      description: "One of the humans from the Last Redoubt.",
      initiative: 10,
      lastComment: "",
      attack: 10,
      inventory: [], // New: Inventory array for Christos
      maxInventorySize: 10, // Limit for general items (we’ll add weapons limit later)
      isHidden: false, // Ensure this is initialized
     hideTurns: 0,   // Ensure this is initialized
    },
    monsters: levelConfig.monsters,
    greatPowers: levelConfig.greatPowers,
    objects: levelConfig.objects,
    items: levelConfig.items, // New: Add items to state
    pools: levelConfig.pools,
    poolsTemplate: levelConfig.poolsTemplate,
    footsteps: levelConfig.footsteps,
    footstepsTemplate: levelConfig.footstepsTemplate,
    activeMonsters: [],
    attackSlots: [],
    waitingMonsters: [],
    inCombat: false,
    turnOrder: [],
    combatTurn: null,
    dialogData: {
      player: { name: "Christos", hp: 100, comment: "" },
      enemies: [],
    },
    moveCount: 0,
    spawnThreshold: Math.floor(Math.random() * 7) + 4,
    maxAttackers: 4,
    audioStarted: false,
  };
};

export const initialState = getInitialState(1);

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_LEVEL":
      const newLevelConfig =
        action.payload.level === 1 ? level1State : level1State; // Fixed: use action.payload.level
      return {
        ...state,
        level: newLevelConfig.id,
        levels: [newLevelConfig],
        monsters: newLevelConfig.monsters,
        greatPowers: newLevelConfig.greatPowers,
        objects: newLevelConfig.objects,
        pools: newLevelConfig.pools,
        poolsTemplate: newLevelConfig.poolsTemplate,
        footsteps: newLevelConfig.footsteps,
        footstepsTemplate: newLevelConfig.footstepsTemplate,
        activeMonsters: [],
        attackSlots: [],
        waitingMonsters: [],
        inCombat: false,
        turnOrder: [],
        combatTurn: null,
        moveCount: 0,
        player: {
          ...state.player,
          hp: state.player.maxHP,
          position: { row: 395, col: 200 },
        },
      };

    case "ADD_TO_INVENTORY":
      const { item } = action.payload;
      if (state.player.inventory.length >= state.player.maxInventorySize) {
        return state;
      }
      return {
        ...state,
        player: {
          ...state.player,
          inventory: [...state.player.inventory, item],
        },
      };

    case "UPDATE_ITEM":
      console.log(
        "Updating item:",
        action.payload.shortName,
        "to",
        action.payload.updates
      );
      return {
        ...state,
        items: state.items.map((item) =>
          item.shortName === action.payload.shortName
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };

      case "DROP_ITEM":
        const { itemId } = action.payload;
        const droppedItem = state.player.inventory.find(
          (item) => item.id === itemId
        );
        if (!droppedItem) return state;
        const newItem = {
          ...droppedItem,
          shortName: droppedItem.shortName || "maguffinRock", // Ensure shortName is set
          position: { ...state.player.position },
          active: true,
          collectible: true,
        };
        console.log("Dropping item:", newItem);
        return {
          ...state,
          player: {
            ...state.player,
            inventory: state.player.inventory.filter(
              (item) => item.id !== itemId
            ),
          },
          items: [...state.items, newItem],
        };

    case "MOVE_PLAYER":
      return {
        ...state,
        player: { ...state.player, position: action.payload.position },
      };
    case "MOVE_MONSTER":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id
            ? { ...monster, position: action.payload.position }
            : monster
        ),
      };
    case "UPDATE_MONSTER_HP":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id
            ? { ...monster, hp: action.payload.hp }
            : monster
        ),
        attackSlots: state.attackSlots.map((slot) =>
          slot.id === action.payload.id
            ? { ...slot, hp: action.payload.hp }
            : slot
        ),
      };
    case "UPDATE_PLAYER_HP":
      return { ...state, player: { ...state.player, hp: action.payload.hp } };
    case "SPAWN_MONSTER":
      return {
        ...state,
        activeMonsters: [...state.activeMonsters, action.payload.monster],
      };
    case "SET_COMBAT":
      return {
        ...state,
        inCombat: action.payload.inCombat,
        attackSlots: action.payload.attackSlots,
        waitingMonsters: action.payload.waitingMonsters || [],
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      };
    case "UPDATE_TURN":
      return {
        ...state,
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      };
    case "UPDATE_DIALOG":
      return { ...state, dialogData: action.payload.dialogData };
    case "UPDATE_MOVE_COUNT":
      return { ...state, moveCount: action.payload.moveCount };
    case "UPDATE_WAITING_MONSTERS":
      return { ...state, waitingMonsters: action.payload.waitingMonsters };
    case "UPDATE_ACTIVE_MONSTERS":
      return { ...state, activeMonsters: action.payload.activeMonsters };
    case "SET_AUDIO_STARTED":
      return { ...state, audioStarted: action.payload };
    case "ADD_FOOTSTEPS":
      const newFootsteps = {
        id: state.footsteps.length + 1,
        position: action.position,
        direction: action.direction,
      };
      return {
        ...state,
        footsteps: [...state.footsteps, newFootsteps].slice(
          0,
          state.footstepsTemplate.maxInstances
        ),
      };
    case "ADD_POOL":
      const newPool = {
        id: state.pools.length + 1,
        position: action.position,
      };
      return {
        ...state,
        pools: [...state.pools, newPool].slice(
          0,
          state.poolsTemplate.maxInstances
        ),
      };
    case "RESET_HP":
      console.log(
        "Reducer - Resetting HP to",
        state.player.maxHP,
        "from",
        state.player.hp
      );
      return {
        ...state,
        player: { ...state.player, hp: state.player.maxHP },
      };
    case "TRIGGER_EFFECT":
      const { effect, position } = action.payload;
      switch (effect.type) {
        case "swarm":
          const newMonsters = [];
          const monsterTemplate = state.monsters.find(
            (m) => m.name === effect.monsterType
          );
          for (let i = 0; i < effect.count; i++) {
            const spawnRow = Math.max(
              0,
              Math.min(
                state.gridHeight - 1,
                position.row +
                  Math.floor(Math.random() * effect.range * 2) -
                  effect.range
              )
            );
            const spawnCol = Math.max(
              0,
              Math.min(
                state.gridWidth - 1,
                position.col +
                  Math.floor(Math.random() * effect.range * 2) -
                  effect.range
              )
            );
            newMonsters.push({
              ...monsterTemplate,
              id: `${monsterTemplate.shortName}-${Date.now()}-${i}`,
              hp: monsterTemplate.hp,
              position: { row: spawnRow, col: spawnCol },
              active: true,
            });
          }
          return {
            ...state,
            activeMonsters: [...state.activeMonsters, ...newMonsters],
          };
        case "hide":
          return {
            ...state,
            player: {
              ...state.player,
              isHidden: true,
              hideTurns: effect.duration || 10,
            },
          };
        case "heal":
          return {
            ...state,
            player: {
              ...state.player,
              hp: Math.min(state.player.maxHP, state.player.hp + effect.amount),
            },
          };
        default:
          return state;
      }
    case "DECREMENT_HIDE_TURNS":
      const newHideTurns = Math.max(0, state.player.hideTurns - 1);
      return {
        ...state,
        player: {
          ...state.player,
          hideTurns: newHideTurns,
          isHidden: newHideTurns > 0,
        },
      };
    case "UPDATE_OBJECT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.shortName === action.payload.shortName
            ? { ...obj, ...action.payload.updates }
            : obj
        ),
      };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state || initialState;
  }
};
