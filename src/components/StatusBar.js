// nightland/src/components/StatusBar.js
import React from "react";
import "../styles/styles.css";

const StatusBar = ({ hp, onSettingsToggle }) => {
  return (
    <div id="status-bar">
      <span>HP: {hp}</span>
      <img
        id="gear-icon"
            src="/assets/images/gear.svg" // Use local path
        alt="Settings"
        onClick={onSettingsToggle}
      />
    </div>
  );
};

export default StatusBar;