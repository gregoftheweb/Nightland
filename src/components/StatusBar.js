// nightland/src/components/StatusBar.js
import React from 'react';

const StatusBar = ({ hp, onSettingsToggle }) => (
    <div id="status-bar">
        <span id="hp-display">HP: {hp}</span>
        <img
            id="gear-icon"
            src="/assets/images/gear.svg" // Use local path
            alt="Settings"
            onClick={onSettingsToggle}
        />
    </div>
);

export default StatusBar;