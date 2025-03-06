// nightland/src/components/SettingsMenu.js
import React, { useState } from 'react';

const SettingsMenu = () => {
    const [sfxEnabled, setSfxEnabled] = useState(true);
    return (
        <div id="settings-menu">
            <label id="sfx-label">SFX: </label>
            <input
                type="checkbox"
                id="sfx-toggle"
                checked={sfxEnabled}
                onChange={() => setSfxEnabled(!sfxEnabled)}
            />
        </div>
    );
};

export default SettingsMenu;