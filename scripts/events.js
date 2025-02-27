// scripts/events.js (module)
import { gameState } from './gameState.js';

export function setupEventListeners(audio, statusBar, gameContainer, renderMap, movePlayer, combatStep, showPrincessScreen, startGame, showInfoBox, toggleSettings, toggleSFX) {
    document.addEventListener('DOMContentLoaded', () => {
        const splashButton = document.getElementById('splash-button');
        splashButton.addEventListener('click', () => {
            if (!gameState.audioStarted) {
                audio.play().then(() => {
                    gameState.audioStarted = true;
                }).catch(err => {});
            }
            showPrincessScreen(statusBar);
        });

        document.getElementById('princess-button').addEventListener('click', () => startGame(statusBar, gameContainer, renderMap));

        document.getElementById('player').addEventListener('click', () => showInfoBox(gameState.player, infoBox));
        document.getElementById('abhuman').addEventListener('click', () => gameState.abhuman?.active && showInfoBox(gameState.abhuman, infoBox));
        document.getElementById('watcher').addEventListener('click', () => showInfoBox(gameState.watcherSe, infoBox));
        document.getElementById('redoubt').addEventListener('click', () => showInfoBox(gameState.redoubt, infoBox));
        document.getElementById('gear-icon').addEventListener('click', (event) => {
            toggleSettings(event);
        });

        const sfxToggle = document.getElementById('sfx-toggle');
        if (sfxToggle) {
            sfxToggle.addEventListener('change', () => {
                toggleSFX();
            });
        }

        document.addEventListener('keydown', (event) => {
            console.log("Key pressed:", event.key);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                movePlayer(event.key);
            } else if (event.key === ' ') {
                event.preventDefault();
                if (gameState.inCombat) {
                    combatStep();
                } else {
                    document.getElementById('combat-player').style.display = 'none';
                    for (let i = 1; i <= 4; i++) {
                        const enemyDiv = document.getElementById(`combat-enemy${i}`);
                        if (enemyDiv) enemyDiv.style.display = 'none';
                    }
                }
            }
        });
    });
}