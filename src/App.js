// nightland/src/App.js
import React, { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import { initialState, reducer } from './modules/gameState';
import SplashScreen from './components/SplashScreen';
import PrincessScreen from './components/PrincessScreen';
import StatusBar from './components/StatusBar';
import CombatUI from './components/CombatUI';
import GameDialog from './components/GameDialog';
import { handleMovePlayer } from './modules/gameLoop';
import { combatStep } from './modules/combat';
import { initializeEntityStyles, updateViewport } from './modules/utils';
import './styles/styles.css';

const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [phase, setPhase] = useState('splash');
    const [showSettings, setShowSettings] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const gameContainerRef = useRef(null);

    // Debug: Log state changes to catch undefined state
    useEffect(() => {
        if (!state) {
            console.error("App.js: State is undefined after update");
        }
        console.log("App.js: State updated:", state);
    }, [state]);

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
                    updateViewport(state);
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
            initializeEntityStyles(state);
            updateViewport(state);
        }
    }, [phase, state]);

    return (
        <div className="app">
            {phase === 'splash' && <SplashScreen onStart={handleStartGame} />}
            {phase === 'princess' && <PrincessScreen onNext={handlePrincessNext} />}
            {phase === 'gameplay' && (
                <>
                    <div id="gameplay-screen" ref={gameContainerRef}>
                        <div className="game-board">
                            {/* Player */}
                            <div
                                id="player"
                                style={{
                                    left: `${state.player.position.col * state.tileSize}px`,
                                    top: `${state.player.position.row * state.tileSize}px`,
                                    position: 'absolute',
                                    width: '40px',
                                    height: '40px'
                                }}
                            />
                            {/* Redoubt */}
                            <div
                                id="redoubt"
                                style={{
                                    left: `${state.redoubt.position.col * state.tileSize}px`,
                                    top: `${state.redoubt.position.row * state.tileSize}px`,
                                    position: 'absolute'
                                }}
                            />
                            {/* Active Monsters */}
                            {state.activeMonsters && state.activeMonsters.map(monster => {
                                const renderPos = {
                                    x: monster.position.col * state.tileSize,
                                    y: monster.position.row * state.tileSize
                                };
                                console.log(`Rendering ${monster.id} at row ${monster.position.row}, col ${monster.position.col} (pixels: ${renderPos.x}, ${renderPos.y})`);
                                return (
                                    <div
                                        key={monster.id}
                                        id={monster.id}
                                        className="abhuman"
                                        style={{
                                            left: `${renderPos.x}px`,
                                            top: `${renderPos.y}px`,
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