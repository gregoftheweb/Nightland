// nightland/src/components/CombatUI.js (updated)
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
          onPlayerDeath(action.message); // Trigger death message in App.js
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