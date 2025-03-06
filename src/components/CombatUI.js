// nightland/src/components/CombatUI.js
import React, { useEffect, useState } from 'react';
import Dialog from './Dialog';
import { combatStep } from '../modules/combat';

const CombatUI = ({ state, dispatch }) => {
    const [combatActive, setCombatActive] = useState(false);

    useEffect(() => {
        if (state.inCombat && !combatActive) {
            console.log('Combat Started - Initial State:', { combatTurn: state.combatTurn?.name, attackSlots: state.attackSlots });
            setCombatActive(true);
        }
    }, [state.inCombat]);

    const handleNextTurn = () => {
        console.log('Next Turn Clicked');
        combatStep(state, dispatch);
    };

    console.log('CombatUI Component - inCombat:', state.inCombat, 'Dialog Data:', state.dialogData);

    return (
        <div className="combat">
            <Dialog
                key={`player-${state.dialogData?.player?.comment || 'default'}`}
                data={state.dialogData?.player || { name: state.player.name, hp: state.player.hp, comment: '' }}
                index="player"
            />
            {state.dialogData?.enemies?.map((enemy, i) => enemy && (
                <Dialog key={i} data={enemy} index={i} />
            ))}
            <button onClick={handleNextTurn}>Next Turn</button>
        </div>
    );
};

export default CombatUI;