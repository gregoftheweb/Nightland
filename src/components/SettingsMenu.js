// nightland/src/components/SettingsMenu.js
import React from "react";
import "../styles/styles.css";

const SettingsMenu = ({ sfxEnabled, onSfxToggle }) => {
  return (
    <div id="settings-menu">
      <div className="sfx-container">
        <label id="sfx-label">SFX:</label>
        <input
          type="checkbox"
          id="sfx-toggle"
          checked={sfxEnabled}
          onChange={onSfxToggle}
        />
      </div>
    </div>
  );
};

export default SettingsMenu;