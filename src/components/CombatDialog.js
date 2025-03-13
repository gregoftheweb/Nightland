// nightland/src/components/CombatDialog.js
import React from "react";
import {
  combatVictoryPlayerComment,
  combatVictoryEnemyComment,
  combatPlayerHitComment,
  combatPlayerMissComment,
  combatEnemyHitComment,
  combatEnemyMissComment,
  combatStartPlayerComment,
} from "../../src/assets/copy/textcontent";

const CombatDialog = ({ state, lastAction }) => {
  if (!state?.player || (!state.inCombat && !lastAction)) {
    return null;
  }

  const getActionText = () => {
    if (!lastAction) return combatStartPlayerComment;

    switch (lastAction.type) {
      case "PLAYER_HIT":
        return `${combatPlayerHitComment.replace("6", lastAction.damage)}`;
      case "PLAYER_MISS":
        return combatPlayerMissComment;
      case "ENEMY_HIT":
        return `${combatEnemyHitComment.replace("4", lastAction.damage)}`;
      case "ENEMY_MISS":
        return combatEnemyMissComment;
      case "PLAYER_VICTORY":
        return combatVictoryPlayerComment;
      case "ENEMY_VICTORY":
        return combatVictoryEnemyComment;
      default:
        return lastAction.message || "";
    }
  };

  const actionText = getActionText();

  return (
    <div className="combat-dialog">
      <p>Christos</p>
      <p>HP: {state.player.hp}</p>
      <p>{actionText}</p>
    </div>
  );
};

export default CombatDialog;
