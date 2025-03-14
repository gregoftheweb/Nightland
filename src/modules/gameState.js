// nightland/src/modules/gameState.js
export const initialState = {
  gridWidth: 400,
  gridHeight: 400,
  tileSize: 40,
  viewHeight: 800,
  map: Array(400)
    .fill()
    .map(() => Array(400).fill(".")),
  player: {
    name: "Christos",
    hp: 25,
    position: { row: 395, col: 200 },
    description: "One of the humans from the Last Redoubt.",
    initiative: 10,
    lastComment: "",
    attack: 10,
  },
  redoubt: {
    name: "The Last Redoubt",
    position: { row: 395, col: 198 },
    description:
      "The last haven of mankind save one. It protects millions of souls from the horrors of the Nightland.",
  },
  monsters: [
    {
      name: "Abhuman",
      hp: 20,
      position: { row: 0, col: 0 },
      description:
        "Created from corrupted human stock ages ago, their hatred of humans is bone deep and drives them to kill.",
      active: false,
      type: "regular",
      initiative: 5,
      maxInstances: 6,
      moveRate: 2,
      spawnRate: 2,
      spawnChance: 1,
      attack: 5,
    },
  ],
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

export const reducer = (state = initialState, action) => {
  switch (action.type) {
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
    case "MOVE_REDOUBT":
      return {
        ...state,
        redoubt: { ...state.redoubt, position: action.payload.position },
      };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state || initialState; // Safeguard: return initialState if state is undefined
  }
};
