// nightland/src/App.js
import React, { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import { initialState, reducer } from './modules/gameState';
import SplashScreen from './components/SplashScreen';
import PrincessScreen from './components/PrincessScreen';
import StatusBar from './components/StatusBar';
import CombatUI from './components/CombatUI';
import GameDialog from './components/GameDialog';
import { handleMovePlayer } from './modules/gameLoop';
import { initializePositions } from './modules/movement';
import { combatStep } from './modules/combat';
import './styles/styles.css';

const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [phase, setPhase] = useState('splash');
    const [showSettings, setShowSettings] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const gameContainerRef = useRef(null);

    const handleStartGame = () => setPhase('princess');
    const handlePrincessNext = () => setPhase('gameplay');
    const toggleSettings = (e) => {
        e.stopPropagation();
        setShowSettings(!showSettings);
    };

    const showDialog = useCallback((message, duration = 3600) => {
        setDialogMessage(message);
        setTimeout(() => setDialogMessage(''), duration);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (phase === 'gameplay') {
                event.preventDefault();
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                    handleMovePlayer(state, dispatch, event.key, showDialog);
                } else if (event.key === ' ' && state.inCombat) {
                    combatStep(state, dispatch);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [state, phase, showDialog]);

    useEffect(() => {
        if (phase === 'gameplay') {
            initializePositions(state);
        }
    }, [phase, state.player.position, state.redoubt.position, state.activeMonsters]);

    return (
        <div className="app">
            {phase === 'splash' && <SplashScreen onStart={handleStartGame} />}
            {phase === 'princess' && <PrincessScreen onNext={handlePrincessNext} />}
            {phase === 'gameplay' && (
                <>
                    <div id="gameplay-screen" ref={gameContainerRef}>
                        <div className="game-board" key={state.attackSlots.map(slot => slot.id).join('-')}>
                            <div
                                id="player"
                                style={{
                                    left: `${state.player.position.x}px`,
                                    top: `${state.player.position.y}px`,
                                    position: 'absolute' // Ensure absolute positioning
                                }}
                            />
                            <div id="redoubt" />
                            {state.activeMonsters.map(monster => {
                                const inAttackSlot = state.attackSlots.find(slot => slot.id === monster.id);
                                if (inAttackSlot) {
                                    const playerPos = state.player.position;
                                    const slotPos = inAttackSlot.slotPosition || { x: 0, y: 0 };
                                    const renderPos = {
                                        x: playerPos.x + slotPos.x,
                                        y: playerPos.y + slotPos.y
                                    };
                                    console.log(`Rendering ${monster.id} in attack slot at ${renderPos.x}, ${renderPos.y} with slotPos ${slotPos.x}, ${slotPos.y} relative to player at ${playerPos.x}, ${playerPos.y}`);
                                    return (
                                        <div
                                            key={monster.id}
                                            id={monster.id}
                                            className="abhuman"
                                            style={{
                                                left: `${renderPos.x}px`,
                                                top: `${renderPos.y}px`,
                                                position: 'absolute', // Ensure absolute positioning
                                                width: '40px', // Set explicit size for clarity
                                                height: '40px'
                                            }}
                                        />
                                    );
                                }

                                const inWaiting = state.waitingMonsters.find(m => m.id === monster.id);
                                if (inWaiting) {
                                    console.log(`Rendering ${monster.id} in waiting at ${monster.position.x}, ${monster.position.y}`);
                                    return (
                                        <div
                                            key={monster.id}
                                            id={monster.id}
                                            className="abhuman"
                                            style={{
                                                left: `${monster.position.x}px`,
                                                top: `${monster.position.y}px`,
                                                position: 'absolute',
                                                width: '40px',
                                                height: '40px'
                                            }}
                                        />
                                    );
                                }

                                console.log(`Rendering ${monster.id} at ${monster.position.x}, ${monster.position.y}`);
                                return (
                                    <div
                                        key={monster.id}
                                        id={monster.id}
                                        className="abhuman"
                                        style={{
                                            left: `${monster.position.x}px`,
                                            top: `${monster.position.y}px`,
                                            position: 'absolute',
                                            width: '40px',
                                            height: '40px'
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <StatusBar hp={state.player.hp} onSettingsToggle={toggleSettings} />
                        {state.inCombat && <CombatUI state={state} dispatch={dispatch} />}
                    </div>
                    <GameDialog message={dialogMessage} />
                    <audio id="background-audio" loop autoPlay>
                        <source src="/assets/sounds/ambient-background.wav" type="audio/wav" />
                    </audio>
                </>
            )}
        </div>
    );
};

export default App;