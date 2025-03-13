// nightland/src/components/CombatUI.js
import React, { useState, useEffect } from 'react';
import CombatDialog from './CombatDialog';
import { combatStep } from '../modules/combat';

const CombatUI = ({ state, dispatch, onCombatStep }) => {
  const [lastAction, setLastAction] = useState(null);
  const [victoryDelayActive, setVictoryDelayActive] = useState(false);

  useEffect(() => {
    if (state && state.attackSlots) {
      console.log("CombatUI attackSlots:", state.attackSlots.map(m => `${m.name} (HP: ${m.hp})`));
    }
  }, [state?.attackSlots]);

  useEffect(() => {
    onCombatStep(() => {
      // Run combatStep unless we're in a victory delay for the last monster
      if (!victoryDelayActive || state.inCombat) {
        const remainingMonstersBefore = state.attackSlots.length;
        combatStep(state, dispatch, (action) => {
          setLastAction(action);
          console.log("CombatUI: Last Action set to:", action);

          if (action.type === 'ENEMY_DEATH') {
            setVictoryDelayActive(true);
            if (remainingMonstersBefore > 1) {
              // Multi-monster: show for 1.5s, then proceed naturally
              setTimeout(() => {
                setVictoryDelayActive(false);
                console.log("CombatUI: ENEMY_DEATH display timeout complete (multi-monster)");
              }, 1500);
            } else {
              // Single monster: show for 2s, then clear
              setTimeout(() => {
                setLastAction(null);
                setVictoryDelayActive(false);
                console.log("CombatUI: Dialog hidden after 2-second ENEMY_DEATH delay");
              }, 2000);
            }
          }
        });
      }
    });
  }, [state, dispatch, onCombatStep]);

  if (!state) {
    console.warn("CombatUI: state is undefined");
    return null;
  }

  const shouldShowDialog = state.inCombat || victoryDelayActive;
  console.log("CombatUI: shouldShowDialog:", shouldShowDialog, "inCombat:", state.inCombat, "victoryDelayActive:", victoryDelayActive, "lastAction:", lastAction);

  return (
    <div className="combat-ui">
      {shouldShowDialog && (
        <CombatDialog state={state} lastAction={lastAction} />
      )}
    </div>
  );
};

export default CombatUI;