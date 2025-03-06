// nightland/src/components/GameDialog.js
import React from 'react';

const GameDialog = ({ message }) => (
    <div className="game-dialog" style={{ display: message ? 'block' : 'none' }}>
        {message}
    </div>
);

export default GameDialog;