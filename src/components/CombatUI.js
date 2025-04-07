import React, { useState, useEffect } from "react";
import CombatDialog from "./CombatDialog";
import DeathDialog from "./DeathDialog";
import { combatStep } from "../modules/combat";

const CombatUI = ({ state, dispatch, onCombatStep, onPlayerDeath }) => {
  const [lastAction, setLastAction] = useState(null);
  const [deathQueue, setDeathQueue] = useState([]);

  useEffect(() => {
    if (state && state.attackSlots) {
      // console.log("CombatUI attackSlots:", state.attackSlots.map(m => `${m.name} (HP: ${m.hp})`));
    }
  }, [state?.attackSlots]);

  useEffect(() => {
    onCombatStep(() => {
      const preUpdateSlotsLength = state.attackSlots.length;
      combatStep(state, dispatch, (action) => {
        setLastAction(action);

        // Update dialogData with critical hit message
        if (action.message) {
          if (action.type === "PLAYER_HIT") {
            dispatch({
              type: "UPDATE_DIALOG",
              payload: {
                dialogData: {
                  ...state.dialogData,
                  player: {
                    ...state.dialogData.player,
                    comment: action.message, // "Critical Hit!"
                  },
                },
              },
            });
          } else if (action.type === "ENEMY_HIT") {
            const enemyIndex = state.attackSlots.findIndex(
              (slot) => slot === state.combatTurn
            );
            if (enemyIndex !== -1) {
              dispatch({
                type: "UPDATE_DIALOG",
                payload: {
                  dialogData: {
                    ...state.dialogData,
                    enemies: state.dialogData.enemies.map((e, i) =>
                      i === enemyIndex ? { ...e, comment: action.message } : e
                    ),
                  },
                },
              });
            }
          }
        }

        if (action.type === "ENEMY_DEATH") {
          setDeathQueue((prev) => [...prev, action]);
          setTimeout(() => {
            setDeathQueue((prev) => prev.filter((d) => d !== action));
            if (state.inCombat && preUpdateSlotsLength > 1) {
              setLastAction(null);
            }
          }, 2000);
        } else if (action.type === "PLAYER_DEATH") {
          setDeathQueue((prev) => [...prev, action]);
          onPlayerDeath(action.message);
        }
      });
    });
  }, [state, dispatch, onCombatStep, onPlayerDeath]);

  if (!state) {
    return null;
  }

  const shouldShowCombatDialog = state.inCombat || lastAction;

  return (
    <div className="combat-ui">
      {shouldShowCombatDialog && (
        <CombatDialog state={state} lastAction={lastAction} />
      )}
      {deathQueue.map((deathAction, index) => (
        <DeathDialog
          key={`${deathAction.type}-${index}`}
          deathAction={deathAction}
          onClose={() => {
            setDeathQueue((prev) => prev.filter((_, i) => i !== index));
          }}
        />
      ))}
    </div>
  );
};

export default CombatUI;