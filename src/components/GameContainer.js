// nightland/src/components/GameContainer.js
import React from 'react';
import Player from './Player';

const GameContainer = ({ state, dispatch, onStartCombat, showDialog, showInfoBox }) => (
    <div id="game-container">
        <div id="gameplay">
            <div id="map"></div>
            <div id="redoubt"></div>
            <div id="watcher"></div>
            <Player position={state.player} hp={state.player.hp} />
            <div id="abhuman" onClick={() => showInfoBox(state.activeMonsters[0] || null)}></div>
        </div>
        <button onClick={onStartCombat}>Start Combat</button>
    </div>
);

export default GameContainer;