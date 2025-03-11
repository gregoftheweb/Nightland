// nightland/src/components/CombatUI.js
import React from 'react';

const CombatUI = ({ state, dispatch }) => {
    // Add null check for state
    if (!state) {
        console.warn("CombatUI: state is undefined");
        return null; // Or render a fallback UI
    }

    console.log("CombatUI Component - inCombat:", state.inCombat ?? "undefined", "Dialog Data:", state.dialogData ?? "undefined");

    return (
        <div className="combat-ui">
            {/* Temporarily hide dialogs */}
            {/* <Dialog data={state.dialogData.player} index="player" /> */}
            {/* {state.attackSlots.map((enemy, index) => (
                <Dialog
                    key={enemy.id}
                    data={{
                        name: enemy.name,
                        hp: enemy.hp,
                        comment: state.combatTurn === enemy ? "Attacking!" : ""
                    }}
                    index={`enemy-${index}`}
                />
            ))} */}

            {/* Combat buttons for testing */}
            <button
                id="test-damage"
                onClick={() => {
                    // Add null check for state.player
                    if (!state.player) {
                        console.warn("CombatUI: state.player is undefined, cannot apply damage");
                        return;
                    }
                    const damage = Math.floor(Math.random() * 10) + 1;
                    dispatch({ type: 'UPDATE_PLAYER_HP', payload: { hp: Math.max(0, state.player.hp - damage) } });
                }}
            >
                Test Damage
            </button>
            <button
                id="start-combat"
                onClick={() => dispatch({ type: 'SET_COMBAT', payload: { inCombat: false } })}
            >
                End Combat
            </button>
        </div>
    );
};

export default CombatUI;