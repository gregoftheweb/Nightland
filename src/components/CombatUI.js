// nightland/src/components/CombatUI.js
import React, { useState, useEffect } from "react";
import CombatDialog from "./CombatDialog";
import DeathDialog from "./DeathDialog";
import { combatStep } from "../modules/combat";

const CombatUI = ({ state, dispatch, onCombatStep }) => {
  const [lastAction, setLastAction] = useState(null);
  const [deathAction, setDeathAction] = useState(null);

  useEffect(() => {
    if (state && state.attackSlots) {
      //console.log("CombatUI attackSlots:", state.attackSlots.map(m => `${m.name} (HP: ${m.hp})`));
    }
  }, [state?.attackSlots]);

  useEffect(() => {
    onCombatStep(() => {
      const preUpdateSlotsLength = state.attackSlots.length;
      combatStep(state, dispatch, (action) => {
        setLastAction(action);

        if (action.type === "ENEMY_DEATH" && preUpdateSlotsLength > 1) {
          setDeathAction(action);

          // Auto-advance turn after multi-monster death
          if (state.inCombat) {
            setTimeout(() => {
              setLastAction(null); // Clear lastAction to allow next step
            }, 2000); // Match DeathDialog duration
          }
        } else if (action.type === "PLAYER_DEATH") {
          setDeathAction(action);
        }
      });
    });
  }, [state, dispatch, onCombatStep]);

  if (!state) {
    return null;
  }

  const shouldShowCombatDialog = state.inCombat || lastAction;

  return (
    <div className="combat-ui">
      {shouldShowCombatDialog && (
        <CombatDialog state={state} lastAction={lastAction} />
      )}
      {deathAction && (
        <DeathDialog
          deathAction={deathAction}
          onClose={() => {
            setDeathAction(null);
          }}
        />
      )}
    </div>
  );
};

export default CombatUI;
