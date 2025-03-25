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
      case "ENEMY_HIT": {
        // Find the attacking monster
        const attackingMonster =
          state.attackSlots.find((slot) => slot.id === state.combatTurn?.id) ||
          state.attackSlots[0]; // Fallback to first attacker if combatTurn is unclear
        const monsterName = attackingMonster?.name || "Unknown Creature";
        return `${monsterName} hit you for ${lastAction.damage} points!`;
      }
      case "ENEMY_MISS":
        return combatEnemyMissComment;
      case "ENEMY_SKIP":
        return "The enemy cannot find you!";
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
