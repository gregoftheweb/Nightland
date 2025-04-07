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
        return (
          <>
            {combatPlayerHitComment.replace("6", lastAction.damage)}
            {lastAction.message && (
              <span className="critical-hit"><br/>{lastAction.message}</span>
            )}
          </>
        );
      case "PLAYER_MISS":
        return combatPlayerMissComment;
      case "ENEMY_HIT": {
        const attackingMonster =
          state.attackSlots.find((slot) => slot.id === state.combatTurn?.id) ||
          state.attackSlots[0];
        const monsterName = attackingMonster?.name || "Unknown Creature";
        return (
          <>
            {`${monsterName} hit you for ${lastAction.damage} points!`}
            {lastAction.message && (
              <span className="critical-hit"><br />{lastAction.message}</span>
            )}
          </>
        );
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
      <div>{actionText}</div> {/* Use div to handle JSX with multiple children */}
    </div>
  );
};

export default CombatDialog;