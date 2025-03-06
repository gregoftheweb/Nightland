// nightland/src/components/Player.js
import React from 'react';

const Player = ({ position, hp }) => {
    return (
        <div
            className="player"
            style={{
                position: 'absolute',
                left: `${position.x * 40}px`,
                top: `${position.y * 40}px`,
                width: '40px',
                height: '40px',
                backgroundImage: "url('/assets/images/player.png')",
                backgroundSize: 'cover',
            }}
        >
            {/* Player sprite */}
        </div>
    );
};

export default Player;