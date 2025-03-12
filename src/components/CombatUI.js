// nightland/src/components/CombatUI.js
import React, { useEffect } from 'react';
import { combatStep } from '../modules/combat';

const CombatUI = ({ state, dispatch }) => {
    useEffect(() => {
        if (state && state.attackSlots) {
            console.log("CombatUI attackSlots:", state.attackSlots.map(m => `${m.name} (HP: ${m.hp})`));
        }
    }, [state?.attackSlots]);

    if (!state) {
        console.warn("CombatUI: state is undefined");
        return null;
    }

    const handleNextTurn = () => {
        if (state.inCombat) {
            combatStep(state, dispatch);
        }
    };

    return (
        <div className="combat-ui">
            <h2>Combat</h2>
            <div className="combatants">
                {state.attackSlots.map((monster, index) => (
                    monster.hp > 0 ? (
                        <div
                            key={monster.id}
                            className={`combatant-slot slot-${index + 1}`}
                        >
                            <span>{monster.name} (HP: {monster.hp}) - Slot {index + 1}</span>
                        </div>
                    ) : null
                ))}
            </div>

            <button id="test-damage" onClick={() => {
                if (!state.player) {
                    console.warn("CombatUI: state.player is undefined, cannot apply damage");
                    return;
                }
                const damage = Math.floor(Math.random() * 10) + 1;
                dispatch({ type: 'UPDATE_PLAYER_HP', payload: { hp: Math.max(0, state.player.hp - damage) } });
            }}>
                Test Damage
            </button>
            <button id="start-combat" onClick={() => dispatch({ type: 'SET_COMBAT', payload: { inCombat: false } })}>
                End Combat
            </button>
            <button id="next-turn" onClick={handleNextTurn}>
                Next Turn (Spacebar)
            </button>
        </div>
    );
};

export default CombatUI;