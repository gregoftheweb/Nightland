// nightland/src/App.js (updated)
import React, {
  useReducer,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { initialState, reducer } from "./modules/gameState";
import SplashScreen from "./components/SplashScreen";
import PrincessScreen from "./components/PrincessScreen";
import StatusBar from "./components/StatusBar";
import CombatUI from "./components/CombatUI";
import DeathDialog from "./components/DeathDialog";
import GameDialog from "./components/GameDialog";
import Dialog from "./components/Dialog";
import SettingsMenu from "./components/SettingsMenu"; // Import SettingsMenu
import { handleMovePlayer } from "./modules/gameLoop";
import { initializeEntityStyles, updateViewport } from "./modules/utils";
import "./styles/styles.css";

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [phase, setPhase] = useState("splash");
  const [showSettings, setShowSettings] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [soloDeathAction, setSoloDeathAction] = useState(null);
  const [deathMessage, setDeathMessage] = useState("");
  const [sfxEnabled, setSfxEnabled] = useState(true); // New state for SFX toggle
  const gameContainerRef = useRef(null);
  const combatStepRef = useRef(null);
  const audioRef = useRef(null); // Ref for audio element

  useEffect(() => {
    if (!state.inCombat && state.attackSlots.length === 0 && state.combatTurn) {
      const lastAction = { type: "ENEMY_DEATH" };
      setSoloDeathAction(lastAction);
      setTimeout(() => {
        setSoloDeathAction(null);
      }, 2000);
    }
  }, [state.inCombat, state.attackSlots.length, state.combatTurn]);

  // Control audio playback based on sfxEnabled
  useEffect(() => {
    if (audioRef.current) {
      if (sfxEnabled) {
        audioRef.current.play().catch((error) => console.log("Audio play error:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [sfxEnabled]);

  const handleStartGame = () => setPhase("princess");
  const handlePrincessNext = () => setPhase("gameplay");
  const toggleSettings = (e) => {
    e.stopPropagation();
    setShowSettings(!showSettings); // Toggle settings menu visibility
  };

  const showDialog = useCallback((message, duration = 3600) => {
    setDialogMessage(message);
    setTimeout(() => setDialogMessage(""), duration);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase === "gameplay") {
        event.preventDefault();
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key
          )
        ) {
          handleMovePlayer(state, dispatch, event.key, showDialog);
          updateViewport(state);
        } else if (event.key === " " && state.inCombat) {
          if (combatStepRef.current) {
            combatStepRef.current();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state, phase, showDialog]);

  useEffect(() => {
    if (phase === "gameplay") {
      initializeEntityStyles(state);
      updateViewport(state);
    }
  }, [phase, state]);

  const getCombatSlotPosition = (uiSlot) => {
    const tileSize = state.tileSize;
    const centerX = state.player.position.col * tileSize;
    const centerY = state.player.position.row * tileSize;
    switch (uiSlot) {
      case 0:
        return { left: centerX - tileSize, top: centerY - tileSize };
      case 1:
        return { left: centerX + tileSize, top: centerY - tileSize };
      case 2:
        return { left: centerX - tileSize, top: centerY + tileSize };
      case 3:
        return { left: centerX + tileSize, top: centerY + tileSize };
      default:
        return { left: centerX, top: centerY };
    }
  };

  return (
    <div className="app">
      {phase === "splash" && <SplashScreen onStart={handleStartGame} />}
      {phase === "princess" && <PrincessScreen onNext={handlePrincessNext} />}
      {phase === "gameplay" && (
        <>
          <div id="gameplay-screen" ref={gameContainerRef}>
            <div className="game-board">
              <div
                id="player"
                style={{
                  left: `${state.player.position.col * state.tileSize}px`,
                  top: `${state.player.position.row * state.tileSize}px`,
                  position: "absolute",
                  width: "40px",
                  height: "40px",
                }}
              />
              <div
                id="redoubt"
                style={{
                  left: `${state.redoubt.position.col * state.tileSize}px`,
                  top: `${state.redoubt.position.row * state.tileSize}px`,
                  position: "absolute",
                }}
              />
              {state.activeMonsters &&
                state.activeMonsters.map((monster) => {
                  const isInCombat = state.attackSlots.some(
                    (slot) => slot.id === monster.id
                  );
                  const renderPos = isInCombat
                    ? null
                    : {
                        x: monster.position.col * state.tileSize,
                        y: monster.position.row * state.tileSize,
                      };
                  return renderPos ? (
                    <div
                      key={monster.id}
                      id={monster.id}
                      className="abhuman"
                      style={{
                        left: `${renderPos.x}px`,
                        top: `${renderPos.y}px`,
                        position: "absolute",
                        width: "40px",
                        height: "40px",
                      }}
                    />
                  ) : null;
                })}
              {state.inCombat &&
                state.attackSlots.map((monster) => {
                  const slotPos = getCombatSlotPosition(monster.uiSlot);
                  return (
                    <div
                      key={monster.id}
                      id={`combat-${monster.id}`}
                      className="abhuman"
                      style={{
                        left: `${slotPos.left}px`,
                        top: `${slotPos.top}px`,
                        position: "absolute",
                        width: "40px",
                        height: "40px",
                      }}
                    />
                  );
                })}
            </div>
            <StatusBar
              hp={state.player.hp}
              onSettingsToggle={toggleSettings} // Pass toggle function
            />
            {showSettings && (
              <SettingsMenu
                sfxEnabled={sfxEnabled}
                onSfxToggle={() => setSfxEnabled(!sfxEnabled)} // Pass SFX toggle
              />
            )}
            {state.inCombat && (
              <CombatUI
                state={state}
                dispatch={dispatch}
                onCombatStep={(stepFn) => (combatStepRef.current = stepFn)}
                onPlayerDeath={(message) => setDeathMessage(message)}
              />
            )}
            {soloDeathAction && (
              <DeathDialog
                deathAction={soloDeathAction}
                onClose={() => setSoloDeathAction(null)}
              />
            )}
          </div>
          <GameDialog message={dialogMessage} />
          <Dialog message={deathMessage} onClose={() => setDeathMessage("")} />
          <audio
            id="background-audio"
            loop
            ref={audioRef} // Add ref to control audio
            autoPlay={sfxEnabled} // Respect initial SFX setting
          >
            <source
              src="/assets/sounds/ambient-background.wav"
              type="audio/wav"
            />
          </audio>
        </>
      )}
    </div>
  );
};

export default App;