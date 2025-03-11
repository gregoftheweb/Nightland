// nightland/src/modules/events.js
export function setupEventListeners(audio, statusBar, gameContainer, renderMap, movePlayer, combatStep, showPrincessScreen, startGame, showInfoBox, toggleSettings, toggleSFX, state, dispatch, infoBox) {
    document.addEventListener('DOMContentLoaded', () => {
        const splashButton = document.getElementById('splash-button');
        if (splashButton) {
            splashButton.addEventListener('click', () => {
                if (!state.audioStarted) {
                    audio.play().then(() => {
                        dispatch({ type: 'SET_AUDIO_STARTED', payload: true });
                    }).catch(err => console.error('Audio play failed:', err));
                }
                showPrincessScreen(statusBar);
            });
        }

        const princessButton = document.getElementById('princess-button');
        if (princessButton) {
            princessButton.addEventListener('click', () => startGame(statusBar, gameContainer, renderMap));
        }

        // Dynamic event listeners for player, redoubt, and entities
        const playerElement = document.getElementById('player');
        if (playerElement) {
            playerElement.addEventListener('click', () => showInfoBox(state.player, infoBox));
        }

        const redoubtElement = document.getElementById('redoubt');
        if (redoubtElement) {
            redoubtElement.addEventListener('click', () => showInfoBox(state.redoubt, infoBox));
        }

        // Handle clicks on active monsters
        state.activeMonsters.forEach(monster => {
            const monsterElement = document.getElementById(monster.id);
            if (monsterElement) {
                monsterElement.addEventListener('click', () => showInfoBox(monster, infoBox));
            }
        });

        // Handle clicks on great powers
        state.greatPowers.forEach(greatPower => {
            const greatPowerElement = document.getElementById(`great-power-${greatPower.name}`);
            if (greatPowerElement) {
                greatPowerElement.addEventListener('click', () => showInfoBox(greatPower, infoBox));
            }
        });

        const gearIcon = document.getElementById('gear-icon');
        if (gearIcon) {
            gearIcon.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleSettings(event);
            });
        }

        const sfxToggle = document.getElementById('sfx-toggle');
        if (sfxToggle) {
            sfxToggle.addEventListener('change', () => toggleSFX());
        }

        document.addEventListener('keydown', (event) => {
            console.log("Key pressed:", event.key);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                movePlayer(state, dispatch, event.key, () => {}); // Placeholder for showDialog
            } else if (event.key === ' ') {
                event.preventDefault();
                if (state.inCombat) {
                    combatStep(state, dispatch);
                }
            }
        });
    });
}

// Optional: Add a function to update event listeners when state changes (e.g., new monsters spawn)
export function updateDynamicEventListeners(state, dispatch, showInfoBox, infoBox) {
    state.activeMonsters.forEach(monster => {
        const monsterElement = document.getElementById(monster.id);
        if (monsterElement && !monsterElement.dataset.listener) {
            monsterElement.dataset.listener = 'true';
            monsterElement.addEventListener('click', () => showInfoBox(monster, infoBox));
        }
    });

    state.greatPowers.forEach(greatPower => {
        const greatPowerElement = document.getElementById(`great-power-${greatPower.name}`);
        if (greatPowerElement && !greatPowerElement.dataset.listener) {
            greatPowerElement.dataset.listener = 'true';
            greatPowerElement.addEventListener('click', () => showInfoBox(greatPower, infoBox));
        }
    });
}