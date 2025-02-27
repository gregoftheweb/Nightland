// scripts/ui.js (module)

export function showPrincessScreen(statusBar) {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('princess-screen').style.display = 'flex';
    document.querySelector('#princess-screen .princess-dialog').style.display = 'block';
    statusBar.style.display = 'none';
}

export function startGame(statusBar, gameContainer, renderMap) {
    document.getElementById('princess-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    statusBar.style.display = 'flex';
    document.body.style.alignItems = 'flex-end';
    gameContainer.scrollTop = gameContainer.scrollHeight;
    renderMap(); // Explicit render call
}

export function showDialog(message) {
    const dialog = document.querySelector('.game-dialog');
    dialog.textContent = message;
    dialog.style.display = 'block';
    setTimeout(() => dialog.style.display = 'none', 3600);
}

export function showInfoBox(obj, infoBox) {
    if (obj) {
        infoBox.innerHTML = `${obj.name}<br>${obj.description}`;
        infoBox.style.display = 'block';
        setTimeout(() => infoBox.style.display = 'none', 3600);
    } else {
        infoBox.style.display = 'none';
    }
}

export function toggleSettings(event) {
    event.stopPropagation();
    const settingsMenu = document.getElementById('settings-menu');
    const currentDisplay = window.getComputedStyle(settingsMenu).display;
    settingsMenu.style.display = currentDisplay === 'block' ? 'none' : 'block';
}