// nightland/src/modules/events.js
export function setupEventListeners(audio, statusBar, gameContainer, renderMap, movePlayer, combatStep, showPrincessScreen, startGame, showInfoBox, toggleSettings, toggleSFX, state, infoBox) {
    document.addEventListener('DOMContentLoaded', () => {
        const splashButton = document.getElementById('splash-button');
        splashButton.addEventListener('click', () => {
            if (!state.audioStarted) {
                audio.play().then(() => {
                    state.audioStarted = true;
                }).catch(err => {});
            }
            showPrincessScreen(statusBar);
        });

        document.getElementById('princess-button').addEventListener('click', () => startGame(statusBar, gameContainer, renderMap));

        document.getElementById('player').addEventListener('click', () => showInfoBox(state.player, infoBox));
        document.getElementById('abhuman').addEventListener('click', () => state.abhuman?.active && showInfoBox(state.abhuman, infoBox));
        document.getElementById('watcher').addEventListener('click', () => showInfoBox(state.watcherSe, infoBox));
        document.getElementById('redoubt').addEventListener('click', () => showInfoBox(state.redoubt, infoBox));
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
                if (state.inCombat) {
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