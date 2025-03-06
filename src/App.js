// nightland/src/App.js
import React, { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import { initialState, reducer } from './modules/gameState';
import SplashScreen from './components/SplashScreen';
import PrincessScreen from './components/PrincessScreen';
import StatusBar from './components/StatusBar';
import CombatUI from './components/CombatUI';
import GameDialog from './components/GameDialog';
import { handleMovePlayer, handleCombatStep } from './modules/gameLoop';
import './styles/styles.css';

const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [phase, setPhase] = useState('splash');
    const [showSettings, setShowSettings] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const gameContainerRef = useRef(null);
    const lastTranslateYRef = useRef(null);
    const isScrollingRef = useRef(false); // Track if we're in scrolling mode

    console.log('App State:', state); // Log state to check positions

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
                    console.log('Moving player with key:', event.key); // Log movement
                    handleMovePlayer(state, dispatch, event.key, showDialog);
                } else if (event.key === ' ' && state.inCombat) {
                    console.log('Combat step triggered'); // Log combat
                    handleCombatStep(state, dispatch, showDialog);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [state, phase, showDialog]);


    
    
    useEffect(() => {
        if (phase === 'gameplay') {
          console.log('Gameplay phase mounted, updating player, redoubt, and game board position');
          const player = document.querySelector('#player');
          const redoubt = document.querySelector('#redoubt');
          const gameBoard = document.querySelector('.game-board');
          if (player && state.player.position && gameBoard) {
            console.log('Setting player position:', state.player.position);
            player.style.left = `${state.player.position.x}px`;
            player.style.top = `${state.player.position.y}px`;
            player.style.transform = 'none';
            player.style.visibility = 'visible';
            player.style.opacity = '1';
    
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const statusBarHeight = 42; // Height of status bar, adjusted to match total rendered height
            const playerX = state.player.position.x;
            const playerY = state.player.position.y;
            const edgeDistance = 100; // Distance from edges (top, bottom, left, right) to trigger scrolling
            const maxX = 1960; // Maximum x position on 2000x2000 game board (2000 - 40 for player width)
            const maxY = 1960; // Maximum y position on 2000x2000 game board (2000 - 40 for player height)
            const middleY = viewportHeight / 2; // Middle of the viewport
    
            let translateX, translateY;
    
            // Initial positioning: align redoubt's bottom with top of status bar (shift up by statusBarHeight)
            translateX = -playerX + (viewportWidth / 2) - (40 / 2); // Center player horizontally
            translateY = -(state.redoubt.position.y + 160 - viewportHeight + statusBarHeight); // Align redoubt bottom with top of status bar (1840 + 160 - viewportHeight + 42)
    
            // Calculate player's position in the viewport after initial translation
            let playerViewportY = playerY + translateY; // Player's y position in viewport after initial translation
    
            // Check if player has reached the middle of the viewport vertically
            if (playerViewportY <= middleY) {
              // Player is at or above middle: scroll to keep player centered vertically
              translateY = -playerY + middleY; // Center player exactly at middleY (no 40/2 offset)
              isScrollingRef.current = true;
            } else {
              // Not in scrolling mode: reset flag
              isScrollingRef.current = false;
            }
    
            // Prevent scrolling past top or bottom of game board
            if (playerY < edgeDistance) {
              // Player is near top edge: adjust translation to keep player at edgeDistance from top
              translateY = -playerY + edgeDistance;
            } else if (playerY > maxY - edgeDistance) {
              // Player is near bottom edge: adjust translation to keep player at edgeDistance from bottom
              translateY = -(playerY - (viewportHeight - statusBarHeight - edgeDistance));
            }
    
            // Horizontal scrolling if player is within edgeDistance of left or right edges
            if (playerX < edgeDistance) {
              // Player is near left edge: adjust translation to keep player at edgeDistance from left
              translateX = -playerX + edgeDistance;
            } else if (playerX > maxX - edgeDistance) {
              // Player is near right edge: adjust translation to keep player at edgeDistance from right
              translateX = -(playerX - (viewportWidth - edgeDistance));
            }
    
            // Apply transform to game board
            gameBoard.style.transform = `translate(${translateX}px, ${translateY}px)`;
            gameBoard.style.transition = 'transform 0.2s ease'; // Smooth transition for movement
    
            // Position redoubt (fixed or scrolling with game board)
            if (redoubt && state.redoubt.position) {
              redoubt.style.left = `${state.redoubt.position.x}px`;
              redoubt.style.top = `${state.redoubt.position.y}px`;
              redoubt.style.transform = 'none';
              redoubt.style.visibility = 'visible';
              redoubt.style.opacity = '1';
            }
          }
        }
      }, [phase, state.player.position, state.redoubt.position]); // Re-run when positions change

    


    return (
        <div className="app">
            {phase === 'splash' && <SplashScreen onStart={handleStartGame} />}
            {phase === 'princess' && <PrincessScreen onNext={handlePrincessNext} />}
            {phase === 'gameplay' && (
                <div id="gameplay-screen" ref={gameContainerRef}>
                    <div className="game-board">
                        <div id="player" />
                        <div id="redoubt" />
                    </div>
                    <StatusBar hp={state.player.hp} onSettingsToggle={toggleSettings} />
                    {state.inCombat && <CombatUI state={state} dispatch={dispatch} />}
                </div>
            )}
            <GameDialog message={dialogMessage} />
            <audio id="background-audio" loop autoPlay>
                <source src="/assets/sounds/ambient-background.wav" type="audio/wav" />
            </audio>
        </div>
    );
};

export default App;