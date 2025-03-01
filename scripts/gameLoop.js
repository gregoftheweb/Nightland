// scripts/gameLoop.js (module)
import * as text from '../assets/copy/textcontent.js';
import { gameState } from './gameState.js';
import { moveToward, updateCombatDialogs, updateStatusBar } from './utils.js';
import { showPrincessScreen, startGame, showDialog, showInfoBox, toggleSettings } from './ui.js';
import { setupEventListeners } from './events.js';

// Set text strings and initial UI state
const splashButton = document.getElementById('splash-button');
const princessButton = document.getElementById('princess-button');
const princessDialog = document.querySelector('#princess-screen .princess-dialog');
const sfxLabel = document.getElementById('sfx-label');
const statusBar = document.getElementById('status-bar');

splashButton.textContent = text.splashScreenButtonText;
princessButton.textContent = text.princessScreenButtonText;
princessDialog.textContent = text.princessScreenText;
sfxLabel.textContent = text.settingsSFXLabel;
statusBar.style.display = 'none';

const audio = document.getElementById('background-audio');
const gameContainer = document.getElementById('game-container');
const infoBox = document.getElementById('info-box');

function resetMonsterPosition(monster) {
    monster.x = Math.floor(Math.random() * gameState.mapWidth);
    monster.y = Math.floor(Math.random() * 10);
    monster.hp = 20;
}

function resetMonster(monster) {
    resetMonsterPosition(monster);
    monster.active = false;
}

function resetPlayer() {
    gameState.player.x = 8;
    gameState.player.y = 35;
    gameState.player.hp = 100;
    gameContainer.scrollTop = gameState.player.y * gameState.tileSize - gameState.viewHeight / 2;
    renderMap();
}

function renderMap() {
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = '';
    updatePlayerPosition();
    updateMonsterPositions();
    updateStatusBar(gameState.player);
    scrollGame();
}

function updatePlayerPosition() {
    const playerDiv = document.getElementById('player');
    playerDiv.style.left = `${gameState.player.x * gameState.tileSize}px`;
    playerDiv.style.top = `${gameState.player.y * gameState.tileSize}px`;
}

function updateMonsterPositions() {
    gameState.activeMonsters.forEach((monster, index) => {
        const divId = `abhuman${index + 1}`;
        let monsterDiv = document.getElementById(divId);
        if (!monsterDiv) {
            monsterDiv = document.createElement('div');
            monsterDiv.id = divId;
            map.appendChild(monsterDiv);
        }
        const inCombatSlot = gameState.inCombat && gameState.attackSlots.some(slot => slot.monster === monster && slot.monster.hp > 0);
        const shouldBeVisible = monster.active && (monster.hp > 0 || inCombatSlot);
        if (shouldBeVisible) {
            monsterDiv.style.display = 'block';
            monsterDiv.style.left = `${monster.x * gameState.tileSize}px`;
            monsterDiv.style.top = `${monster.y * gameState.tileSize}px`;
            monsterDiv.style.width = `${gameState.tileSize}px`;
            monsterDiv.style.height = `${gameState.tileSize}px`;
            monsterDiv.style.background = "url('/assets/images/abhuman.png')";
            monsterDiv.style.backgroundSize = 'cover';
            monsterDiv.style.position = 'absolute';
            monsterDiv.style.zIndex = '3';
        } else {
            monsterDiv.style.display = 'none';
            if (monster.hp <= 0 && !inCombatSlot) {
                gameState.activeMonsters.splice(index, 1);
            }
        }
    });
}

function scrollGame() {
    const playerTop = gameState.player.y * gameState.tileSize;
    const centerPoint = gameState.viewHeight / 2;
    const scrollOffset = playerTop - centerPoint;

    if (scrollOffset > 0) {
        gameContainer.scrollTop = scrollOffset;
    } else {
        gameContainer.scrollTop = 0;
    }
}

function toggleSFX() {
    const sfxToggle = document.getElementById('sfx-toggle');
    if (sfxToggle) {
        if (sfxToggle.checked) {
            audio.play().then(() => {
                gameState.audioStarted = true;
            }).catch(err => {});
        } else {
            audio.pause();
            gameState.audioStarted = false;
        }
    }
}

function calculateTurnOrder() {
    const combatants = [gameState.player, ...gameState.attackSlots.map(slot => slot.monster).filter(m => m && m.hp > 0)];
    gameState.turnOrder = combatants.filter(c => c.hp > 0);
    gameState.combatTurn = gameState.turnOrder[0];
}

let roundNumber = 1;

function combatStep() {
    if (!gameState.inCombat || !gameState.turnOrder.length) return;

    const current = gameState.combatTurn;
    const currentIndex = gameState.turnOrder.indexOf(current);
    const roundLabel = `Round ${roundNumber}.${currentIndex + 1}${current === gameState.player ? " (Christos)" : ""}`;

    let activeMonsters = gameState.attackSlots.map(slot => slot.monster).filter(m => m && m.hp > 0);
    let allMonsters = gameState.attackSlots.map(slot => slot.monster);

    if (currentIndex > 1 || roundNumber > 1) {
        updateCombatDialogs("", allMonsters.map(() => ""), gameState.player, allMonsters);
    }

    let playerComment = "";
    let enemyComments = allMonsters.map(() => "");

    if (current === gameState.player) {
        const target = activeMonsters[0];
        if (target) {
            if (Math.random() < 0.8) {
                target.hp -= 6;
                playerComment = text.combatPlayerHitComment;
                enemyComments = allMonsters.map(slot => slot === target && slot.hp <= 0 ? "Monster is dead!" : "");
                if (target.hp <= 0) {
                    const deadDiv = document.getElementById(`combat-enemy${gameState.attackSlots.indexOf(gameState.attackSlots.find(s => s.monster === target)) + 1}`);
                    if (deadDiv) {
                        deadDiv.classList.add('dead');
                    }
                    calculateTurnOrder();
                }
            } else {
                playerComment = text.combatPlayerMissComment;
            }
        }
    } else if (activeMonsters.includes(current)) {
        const monsterIndex = allMonsters.indexOf(current);
        const isFirstLivingMonster = currentIndex === 1 && allMonsters.some(m => m && m.hp <= 0);
        if (isFirstLivingMonster) {
            gameState.attackSlots = gameState.attackSlots.filter(s => s.monster && s.monster.hp > 0);
            allMonsters = gameState.attackSlots.map(slot => slot.monster);
            updateMonsterPositions();
            updateCombatDialogs("", allMonsters.map(() => ""), gameState.player, allMonsters);

            for (let i = 1; i <= 4; i++) {
                const enemyDiv = document.getElementById(`combat-enemy${i}`);
                if (enemyDiv && enemyDiv.style.display !== 'none') {
                    enemyDiv.classList.remove('flicker');
                    enemyDiv.classList.add('flicker');
                    setTimeout(() => enemyDiv.classList.remove('flicker'), 500);
                }
            }
        }

        if (Math.random() < 0.5) {
            gameState.player.hp -= 4;
            enemyComments[monsterIndex] = text.combatEnemyHitComment;
            allMonsters[monsterIndex].lastComment = text.combatEnemyHitComment;
        } else {
            enemyComments[monsterIndex] = text.combatEnemyMissComment;
            allMonsters[monsterIndex].lastComment = text.combatEnemyMissComment;
        }
    }

    updateCombatDialogs(playerComment, enemyComments, gameState.player, allMonsters);
    updateMonsterPositions();

    if (gameState.player.hp <= 0) {
        updateCombatDialogs(
            text.combatDeathPlayerComment,
            activeMonsters.map(() => text.combatDeathEnemyComment),
            gameState.player,
            allMonsters
        );
        endCombat();
    } else if (activeMonsters.length === 0 && gameState.waitingMonsters.length === 0) {
        updateCombatDialogs(
            text.combatVictoryPlayerComment,
            allMonsters.map(() => text.combatVictoryEnemyComment),
            gameState.player,
            allMonsters
        );
        endCombat();
    } else {
        gameState.combatTurn = gameState.turnOrder[(currentIndex + 1) % gameState.turnOrder.length];
        moveWaitingMonsters();

        if (current === gameState.turnOrder[gameState.turnOrder.length - 1]) {
            resolveRound(allMonsters);
            calculateTurnOrder();
            gameState.combatTurn = gameState.turnOrder[0];
            roundNumber++;
        } else {
            renderMap();
        }
    }
}

function resolveRound(allMonsters) {
    let activeMonsters = gameState.attackSlots.map(slot => slot.monster).filter(m => m && m.hp > 0);
    let deadMonsters = gameState.attackSlots.filter(slot => slot.monster && slot.monster.hp <= 0);

    if (deadMonsters.length > 0) {
        deadMonsters.forEach(slot => {
            const slotIndex = gameState.attackSlots.indexOf(slot);
            const deadDiv = document.getElementById(`combat-enemy${slotIndex + 1}`);
            if (deadDiv) {
                deadDiv.style.display = 'none';
                slot.monster.active = false;
                if (gameState.waitingMonsters.length > 0) {
                    const nextMonster = gameState.waitingMonsters.shift();
                    nextMonster.x = slot.position.x;
                    nextMonster.y = slot.position.y;
                    slot.monster = nextMonster;
                } else {
                    slot.monster = null;
                }
            }
        });
        gameState.attackSlots = gameState.attackSlots.filter(s => s.monster && s.monster.hp > 0);
    }

    calculateTurnOrder();
    moveWaitingMonsters();
    updateMonsterPositions();
}

function moveWaitingMonsters() {
    const activeMonsters = gameState.activeMonsters.filter(m => m.active && m.hp > 0);
    const allAttackSlotsFull = gameState.attackSlots.length >= gameState.maxAttackers;
    activeMonsters.forEach(monster => {
        if (monster.hp > 0 && !gameState.attackSlots.some(slot => slot.monster === monster)) {
            const dx = Math.abs(monster.x - gameState.player.x);
            const dy = Math.abs(monster.y - gameState.player.y);
            if (allAttackSlotsFull && (dx <= 2 || dy <= 2)) {
                if (!gameState.waitingMonsters.includes(monster)) gameState.waitingMonsters.push(monster);
            } else {
                moveToward(monster, gameState.player.x, gameState.player.y, 2);
                if (monster.x === gameState.player.x && monster.y === gameState.player.y && !allAttackSlotsFull) {
                    const positions = [
                        { x: gameState.player.x - 1, y: gameState.player.y - 1 },
                        { x: gameState.player.x + 1, y: gameState.player.y - 1 },
                        { x: gameState.player.x - 1, y: gameState.player.y + 1 },
                        { x: gameState.player.x + 1, y: gameState.player.y + 1 }
                    ];
                    const freeSlot = positions[gameState.attackSlots.length];
                    monster.x = freeSlot.x;
                    monster.y = freeSlot.y;
                    gameState.attackSlots.push({ monster, position: freeSlot });
                    calculateTurnOrder();
                    updateCombatDialogs("", gameState.attackSlots.map(() => "Ready to fight!"), gameState.player, gameState.attackSlots.map(slot => slot.monster));
                }
            }
        }
    });
}

function endCombat() {
    gameState.inCombat = false;
    gameState.attackSlots = [];
    gameState.waitingMonsters = [];
    gameState.turnOrder = [];
    gameState.combatTurn = null;

    if (gameState.player.hp <= 0) {
        resetPlayer();
        gameState.activeMonsters = [];
        spawnMonster(gameState.monsters[0]);
    } else {
        gameState.activeMonsters = gameState.activeMonsters.filter(m => m.hp > 0);
    }

    gameState.moveCount = 0;
    gameState.spawnThreshold = Math.floor(Math.random() * 7) + 4;
    roundNumber = 1;

    for (let i = 1; i <= 4; i++) {
        const enemyDiv = document.getElementById(`combat-enemy${i}`);
        if (enemyDiv) {
            enemyDiv.classList.remove('dead');
            enemyDiv.style.color = '#8B0000';
            enemyDiv.style.borderColor = '#8B0000';
            enemyDiv.style.display = 'none';
        }
    }

    renderMap();
}

function moveEntity(entity, direction) {
    let newX = entity.x;
    let newY = entity.y;

    if (direction === 'ArrowUp' && entity.y > 0) newY--;
    if (direction === 'ArrowDown' && entity.y < gameState.mapHeight - 1) newY++;
    if (direction === 'ArrowLeft' && entity.x > 0) newX--;
    if (direction === 'ArrowRight' && entity.x < gameState.mapWidth - 1) newX++;

    return { newX, newY };
}

function spawnMonster(template) {
    const activeCount = gameState.activeMonsters.filter(m => m.name === template.name && m.active && m.hp > 0).length;
    if (activeCount < template.maxInstances) {
        const newMonster = { ...template, active: true };
        resetMonsterPosition(newMonster);
        gameState.activeMonsters.push(newMonster);
        return newMonster;
    }
    return null;
}

function movePlayer(direction) {
    if (gameState.inCombat) return;

    const { newX, newY } = moveEntity(gameState.player, direction);

    if (newX !== gameState.player.x || newY !== gameState.player.y) {
        gameState.player.x = newX;
        gameState.player.y = newY;
        gameState.moveCount++;

        if (infoBox) showInfoBox(null, infoBox);

        if (gameState.moveCount >= gameState.spawnThreshold) {
            const spawned = spawnMonster(gameState.monsters[0]);
            if (spawned) gameState.spawnThreshold = gameState.moveCount + Math.floor(Math.random() * 7) + 4;
        }

        const activeMonsters = gameState.activeMonsters.filter(m => m.active && m.hp > 0);
        const allAttackSlotsFull = gameState.attackSlots.length >= gameState.maxAttackers;
        activeMonsters.forEach(monster => {
            if (monster.hp > 0 && !gameState.attackSlots.some(slot => slot.monster === monster)) {
                const dx = Math.abs(monster.x - gameState.player.x);
                const dy = Math.abs(monster.y - gameState.player.y);
                if (allAttackSlotsFull && (dx <= 2 || dy <= 2)) {
                    if (!gameState.waitingMonsters.includes(monster)) gameState.waitingMonsters.push(monster);
                } else {
                    moveToward(monster, gameState.player.x, gameState.player.y, 2);
                }
            }
        });

        const attackers = activeMonsters.filter(m => m.x === gameState.player.x && m.y === gameState.player.y);
        if (attackers.length > 0) {
            gameState.inCombat = true;
            gameState.attackSlots = [];
            const positions = [
                { x: gameState.player.x - 1, y: gameState.player.y - 1 },
                { x: gameState.player.x + 1, y: gameState.player.y - 1 },
                { x: gameState.player.x - 1, y: gameState.player.y + 1 },
                { x: gameState.player.x + 1, y: gameState.player.y + 1 }
            ];
            attackers.slice(0, gameState.maxAttackers).forEach((monster, i) => {
                monster.x = positions[i].x;
                monster.y = positions[i].y;
                gameState.attackSlots.push({ monster, position: positions[i] });
            });
            calculateTurnOrder();
            updateCombatDialogs(text.combatStartPlayerComment, gameState.attackSlots.map(() => text.combatStartEnemyComment), gameState.player, gameState.attackSlots.map(slot => slot.monster));
        }

        gameState.greatPowers.forEach(power => {
            if (
                gameState.player.x >= power.x && gameState.player.x < power.x + power.width &&
                gameState.player.y >= power.y && gameState.player.y < power.y + power.height
            ) {
                showDialog(text.watcherDeathMessage);
                resetPlayer();
                gameState.activeMonsters.forEach(m => resetMonster(m));
                gameState.moveCount = 0;
                gameState.spawnThreshold = Math.floor(Math.random() * 7) + 4;
            }
        });

        if (gameState.player.y === 35 && gameState.player.x === 9 && activeMonsters.length > 0) {
            gameState.activeMonsters.forEach(m => resetMonster(m));
            gameState.moveCount = 0;
            gameState.spawnThreshold = Math.floor(Math.random() * 7) + 4;
        }

        renderMap();
    }
}

// Setup event listeners before any rendering
setupEventListeners(audio, statusBar, gameContainer, renderMap, movePlayer, combatStep, showPrincessScreen, startGame, showInfoBox, toggleSettings, toggleSFX);

// Initial game setup (single spawn, no test setup)
spawnMonster(gameState.monsters[0]);
renderMap();