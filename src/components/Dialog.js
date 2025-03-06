// nightland/src/components/Dialog.js
import React from 'react';

const Dialog = (props) => {
    const { data, index } = props;
    const className = index === 'player' ? 'combat-player' : `combat-enemy-${index + 1} ${data.dead ? 'dead' : ''}`;
    console.log(`Dialog ${index} - Props:`, props);
    console.log(`Dialog ${index} - Data:`, data);
    return (
        <div className={className}>
            {data.name}<br />
            HP: {data.hp}<br />
            {data.comment}
        </div>
    );
};

export default Dialog;