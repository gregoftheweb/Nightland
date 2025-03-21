// nightland/src/modules/gameState.js (updated)
export const initialState = {
  gridWidth: 400,
  gridHeight: 400,
  tileSize: 40,
  viewHeight: 800,
  map: Array(400)
    .fill()
    .map(() => Array(400).fill(".")),
  level: 1, // Current level (starts at 1)
  levels: [
    {
      id: 1,
      name: "The Outer Wastes",
      description:
        "A barren plain beyond the Last Redoubt, haunted by whispers and unseen eyes.",
    },
  ],
  player: {
    name: "Christos",
    shortName: "christos", // Lowercase for consistency
    hp: 100,
    position: { row: 395, col: 200 },
    description: "One of the humans from the Last Redoubt.",
    initiative: 10,
    lastComment: "",
    attack: 10,
  },
  redoubt: {
    name: "The Last Redoubt",
    shortName: "redoubt",
    position: { row: 395, col: 198 },
    description:
      "The last haven of mankind save one. It protects millions of souls from the horrors of the Nightland.",
  },
  monsters: [
    {
      name: "Abhuman",
      shortName: "abhuman",
      hp: 20,
      position: { row: 0, col: 0 },
      description:
        "Abhuman. Created from corrupted human stock forgotten eaons ago. Their hatred of humans is bone deep and drives them to kill.",
      active: false,
      type: "regular",
      initiative: 5,
      maxInstances: 6,
      moveRate: 2,
      spawnRate: 8,
      spawnChance: 0.2,
      attack: 5,
    },
    {
      name: "Night Hound",
      shortName: "nighthound",
      hp: 20,
      position: { row: 0, col: 0 },
      description:
        "Night Hound. Voracious hunters of the Night Land.  They savor the taste of human flesh.",
      active: false,
      type: "regular",
      initiative: 5,
      maxInstances: 3,
      moveRate: 2,
      spawnRate: 15,
      spawnChance: 0.2,
      attack: 8,
    },
  ],
  greatPowers: [
    {
      name: "Watcher of the Southeast",
      shortName: "watcherse",
      hp: 200,
      position: { row: 350, col: 198 }, // Upper-left corner
      size: { width: 4, height: 4 }, // 4x4 tile area
      description:
        "One of the great powers and a source of great evil. It watches the Last Redoubt, silent, for Aeons.",
      active: true,
      type: "greatPower",
      initiative: 5,
      maxInstances: 1,
      moveRate: 0,
      spawnRate: 0,
      spawnChance: 0,
      attack: 5,
    },
  ],
  objects: [
    {
      name: "Footsteps of Persius",
      shortName: "footstepsPersius",
      position: { row: 250, col: 198 },
      size: { width: 2, height: 2 }, // 2x2 tile area
      description:
        "You discover the faint tracks of your friend Persius in the dry dust of the Nightland.  Your hope is forlorn, but meager as it is, there is some left that he might live..",
      active: true,
      type: "object",
      maxInstances: 1,
    },
{
      name: "River of Shadows",
      shortName: "river",
      position: { row: 370, col: 175 }, // Still near Redoubt
      size: { width: 20, height: 20 }, // 50 tiles wide (2000px), 3 tiles tall (120px)
      description: "A vast, dark river snakes through the Outer Wastes, its shimmering waters whispering of ancient secrets.",
      active: true,
      type: "object",
      maxInstances: 1,
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

// [Reducer unchanged]
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
    case "SET_LEVEL": // New action for changing levels (future-proofing)
      return {
        ...state,
        level: action.payload.level,
        // Add logic here later to reset monsters, objects, etc., per level
      };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state || initialState;
  }
};
