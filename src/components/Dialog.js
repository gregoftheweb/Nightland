// nightland/src/components/CombatUI.js
import React from 'react';
// import Dialog from './Dialog';

const CombatUI = ({ state, dispatch }) => {
    console.log("CombatUI Component - inCombat:", state.inCombat, "Dialog Data:", state.dialogData);

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
            <button id="test-damage" onClick={() => {
                const damage = Math.floor(Math.random() * 10) + 1;
                dispatch({ type: 'UPDATE_PLAYER_HP', payload: { hp: Math.max(0, state.player.hp - damage) } });
            }}>
                Test Damage
            </button>
            <button id="start-combat" onClick={() => dispatch({ type: 'SET_COMBAT', payload: { inCombat: false } })}>
                End Combat
            </button>
        </div>
    );
};

export default CombatUI;