// scripts/gameState.js (module)
export const gameState = {
    player: {
        x: 8,
        y: 35,
        hp: 100,
        name: "Christos",
        description: "One of the humans from the Last Redoubt.",
        initiative: 10
    },
    monsters: [
        {
            x: 0,
            y: 0,
            hp: 20, // Changed from 10
            name: "Abhuman",
            description: "Created from corrupted human stock ages ago, their hatred of humans is bone deep and drives them to kill.",
            active: false,
            type: "regular",
            initiative: 5,
            maxInstances: 4
        }
    ],
    greatPowers: [
        {
            x: 16,
            y: 0,
            width: 4,
            height: 4,
            name: "The Watcher of the South East",
            description: "One of the great powers and a source of great evil. It watches, silent, for Aeons.",
            type: "greatPower",
            initiative: 8,
            maxInstances: 1
        }
    ],
    redoubt: {
        name: "The Last Redoubt",
        description: "The last haven of mankind save one. It protects millions of souls from the horrors of the Nightland."
    },
    mapWidth: 20,
    mapHeight: 40,
    tileSize: 40,
    viewHeight: 800,
    map: Array(40).fill().map(() => Array(20).fill('.')),
    audioStarted: false,
    moveCount: 0,
    spawnThreshold: Math.floor(Math.random() * 7) + 4,
    inCombat: false,
    combatTurn: null,
    turnOrder: [],
    maxAttackers: 4,
    attackSlots: [],
    waitingMonsters: [],
    activeMonsters: []
};