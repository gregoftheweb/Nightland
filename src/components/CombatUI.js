// nightland/src/components/CombatUI.js
import React, { useState, useEffect } from 'react';
import CombatDialog from './CombatDialog';
import { combatStep } from '../modules/combat';

const CombatUI = ({ state, dispatch, onCombatStep }) => {
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    if (state && state.attackSlots) {
      console.log("CombatUI attackSlots:", state.attackSlots.map(m => `${m.name} (HP: ${m.hp})`));
    }
  }, [state?.attackSlots]);

  useEffect(() => {
    // Expose the combat step function to the parent (App.js)
    onCombatStep(() => {
      if (state.inCombat) {
        combatStep(state, dispatch, setLastAction);
      }
    });
  }, [state, dispatch, onCombatStep]);

  if (!state) {
    console.warn("CombatUI: state is undefined");
    return null;
  }

  return (
    <div className="combat-ui">
      <CombatDialog state={state} lastAction={lastAction} />
    </div>
  );
};

export default CombatUI;