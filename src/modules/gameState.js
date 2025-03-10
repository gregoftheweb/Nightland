const initialState = {
    player: {
      position: { x: 1000, y: 1840 }, // On top of redoubt (1800 + 40px gap above redoubt)
      hp: 100,
      name: "Christos",
      description: "One of the humans from the Last Redoubt.",
      initiative: 10,
      lastComment: "",
    },
    monsters: [
      {
        position: { x: 0, y: 0 }, // Will be dynamically set on spawn
        hp: 20,
        name: "Abhuman",
        description:
          "Created from corrupted human stock ages ago, their hatred of humans is bone deep and drives them to kill.",
        active: false,
        type: "regular",
        initiative: 5,
        maxInstances: 4,
        moveRate: 2, // Moves 2 squares (80px) per turn
        spawnRate: 3, // Check every 3 turns (updated per your change)
        spawnChance: 0.95, // 95% chance to spawn after spawnRate turns (updated per your change)
      },
    ],
    greatPowers: [
      {
        position: { x: 12000, y: 2000 }, // Far up, off-screen initially (adjust as needed for 16000x16000)
        width: 4,
        height: 4,
        name: "The Watcher of the South East",
        description:
          "One of the great powers and a source of great evil. It watches, silent, for Aeons.",
        type: "greatPower",
        initiative: 8,
        maxInstances: 1,
      },
    ],
    redoubt: {
      position: { x: 920, y: 1840 }, // Bottom of redoubt at 2000 (2000 - 160px height = 1840)
      name: "The Last Redoubt",
      description:
        "The last haven of mankind save one. It protects millions of souls from the horrors of the Nightland.",
    },
    mapWidth: 400, // 400 tiles wide (16000px / 40px per tile)
    mapHeight: 400, // 400 tiles tall (16000px / 40px per tile)
    tileSize: 40, // Each tile is 40px × 40px
    viewHeight: 800, // Viewport height (can adjust based on screen size)
    map: Array(400)
      .fill()
      .map(() => Array(400).fill(".")), // 400x400 grid of empty tiles
    audioStarted: false,
    moveCount: 0,
    spawnThreshold: Math.floor(Math.random() * 7) + 4,
    inCombat: false,
    combatTurn: null,
    turnOrder: [],
    maxAttackers: 4,
    attackSlots: [],
    waitingMonsters: [],
    dialogData: {
      player: { name: "Christos", hp: 100, comment: "" },
      enemies: [],
    },
    activeMonsters: [],
  };
  
  const reducer = (state, action) => {
    switch (action.type) {
      case "MOVE_PLAYER":
        return {
          ...state,
          player: {
            ...state.player,
            position: action.payload.position,
          },
        };
      case "MOVE_MONSTER":
        return {
          ...state,
          activeMonsters: state.activeMonsters.map(monster =>
            monster.id === action.payload.id
              ? { ...monster, position: action.payload.position }
              : monster
          ),
        };
      case "MOVE_GREAT_POWER":
        return {
          ...state,
          greatPowers: state.greatPowers.map((power) =>
            power.name === action.payload.name
              ? { ...power, position: action.payload.position }
              : power
          ),
        };
      case "MOVE_REDOUBT":
        return {
          ...state,
          redoubt: {
            ...state.redoubt,
            position: action.payload.position,
          },
        };
      case "UPDATE_PLAYER_HP":
        return {
          ...state,
          player: { ...state.player, hp: action.payload.hp },
        };
      case "SET_COMBAT":
        return {
          ...state,
          inCombat: action.payload.inCombat,
          attackSlots: action.payload.attackSlots || state.attackSlots,
          turnOrder: action.payload.turnOrder || state.turnOrder,
          combatTurn: action.payload.combatTurn || state.combatTurn,
          player: action.payload.player || state.player,
          dialogData: action.payload.dialogData || state.dialogData,
        };
      case "ADD_ACTIVE_MONSTER":
        return {
          ...state,
          activeMonsters: [...state.activeMonsters, action.payload.monster],
        };
      case "UPDATE_WAITING_MONSTERS":
        return {
          ...state,
          waitingMonsters: action.payload.waitingMonsters,
        };
      case "UPDATE_MOVE_COUNT":
        return {
          ...state,
          moveCount: action.payload.moveCount,
        };
      case "UPDATE_SPAWN_THRESHOLD":
        return {
          ...state,
          spawnThreshold: action.payload.spawnThreshold,
        };
      case "SPAWN_MONSTER":
        return {
          ...state,
          activeMonsters: [...state.activeMonsters, action.payload.monster],
          monsters: state.monsters.map((m) =>
            m.name === action.payload.monster.name ? { ...m, active: true } : m
          ),
        };
      default:
        return state;
    }
  };
  
  export { initialState, reducer };