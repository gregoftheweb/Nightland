// nightland/src/components/DeathDialog.js
import React, { useEffect } from "react";
import {
  combatDeathPlayerComment,
  combatDeathEnemyComment,
} from "../../src/assets/copy/textcontent";
import "../styles/styles.css";

const DeathDialog = ({ deathAction, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [deathAction, onClose]);

  const getDeathText = () => {
    switch (deathAction.type) {
      case "PLAYER_DEATH":
        return combatDeathPlayerComment;
      case "ENEMY_DEATH":
        return combatDeathEnemyComment;
      default:
        return "";
    }
  };

  const deathText = getDeathText();

  return (
    <div className="death-dialog fade-out">
      <p>{deathText}</p>
    </div>
  );
};

export default DeathDialog;
