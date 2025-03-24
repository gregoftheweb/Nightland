// nightland/src/components/StatusBar.js
import React from "react";
import "../styles/styles.css"; // Ensure styles are imported

const StatusBar = ({ hp, onSettingsToggle, level, onLevelClick }) => {
  return (
    <div id="status-bar">
      <span>hp: {hp}</span>
      <span
        style={{ cursor: "pointer" }}
        onClick={onLevelClick}
      >
        lvl: {level}
      </span>
      <img
        id="gear-icon"
        src="/assets/images/gear.svg" // Adjust path as needed
        alt="Settings"
        onClick={onSettingsToggle}
      />
    </div>
  );
};

export default StatusBar;