// nightland/src/App.js
import React, { useReducer, useState, useEffect, useCallback, useRef } from "react";
import { initialState, reducer } from "./modules/gameState";
import SplashScreen from "./components/SplashScreen";
import PrincessScreen from "./components/PrincessScreen";
import StatusBar from "./components/StatusBar";
import CombatUI from "./components/CombatUI";
import DeathDialog from "./components/DeathDialog";
import GameDialog from "./components/GameDialog";
import Dialog from "./components/Dialog";
import SettingsMenu from "./components/SettingsMenu";
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
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const gameContainerRef = useRef(null);
  const combatStepRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!state.inCombat && state.attackSlots.length === 0 && state.combatTurn) {
      const lastAction = { type: "ENEMY_DEATH" };
      setSoloDeathAction(lastAction);
      setTimeout(() => setSoloDeathAction(null), 2000);
    }
  }, [state.inCombat, state.attackSlots.length, state.combatTurn]);

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
    setShowSettings(!showSettings);
  };

  const showDialog = useCallback((message, duration = 3600) => {
    setDialogMessage(message);
    setTimeout(() => setDialogMessage(""), duration);
  }, []);

  const showEntityDescription = (description) => setDeathMessage(description);

  const handleMovePlayerWithDeath = (state, dispatch, key) =>
    handleMovePlayer(state, dispatch, key, showDialog, setDeathMessage);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase === "gameplay") {
        event.preventDefault();
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          handleMovePlayerWithDeath(state, dispatch, event.key);
          updateViewport(state);
        } else if (event.key === " " && state.inCombat) {
          if (combatStepRef.current) combatStepRef.current();
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
      case 0: return { left: centerX - tileSize, top: centerY - tileSize };
      case 1: return { left: centerX + tileSize, top: centerY - tileSize };
      case 2: return { left: centerX - tileSize, top: centerY + tileSize };
      case 3: return { left: centerX + tileSize, top: centerY + tileSize };
      default: return { left: centerX, top: centerY };
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
                id={state.player.shortName} // "christos"
                className={state.player.shortName} // Add class for styling
                style={{
                  left: `${state.player.position.col * state.tileSize}px`,
                  top: `${state.player.position.row * state.tileSize}px`,
                  position: "absolute",
                  width: "40px",
                  height: "40px",
                }}
                onClick={() => showEntityDescription(state.player.description)}
              />
              <div
                id={state.redoubt.shortName} // "redoubt"
                className={state.redoubt.shortName} // Optional: add class if styled
                style={{
                  left: `${state.redoubt.position.col * state.tileSize}px`,
                  top: `${state.redoubt.position.row * state.tileSize}px`,
                  position: "absolute",
                }}
                onClick={() => showEntityDescription(state.redoubt.description)}
              />
              {state.greatPowers &&
                state.greatPowers.map((power) => (
                  <div
                    key={power.shortName}
                    id={power.shortName} // "watcherse"
                    className={power.shortName} // Optional: add class if styled
                    style={{
                      left: `${power.position.col * state.tileSize}px`,
                      top: `${power.position.row * state.tileSize}px`,
                      position: "absolute",
                    }}
                    onClick={() => showEntityDescription(power.description)}
                  />
                ))}
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
                      id={monster.id} // "abhuman-<timestamp>"
                      className={monster.shortName} // "abhuman"
                      style={{
                        left: `${renderPos.x}px`,
                        top: `${renderPos.y}px`,
                        position: "absolute",
                        width: "40px",
                        height: "40px",
                      }}
                      onClick={() => showEntityDescription(monster.description)}
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
                      className={monster.shortName} // "abhuman"
                      style={{
                        left: `${slotPos.left}px`,
                        top: `${slotPos.top}px`,
                        position: "absolute",
                        width: "40px",
                        height: "40px",
                      }}
                      onClick={() => showEntityDescription(monster.description)}
                    />
                  );
                })}
            </div>
            <StatusBar hp={state.player.hp} onSettingsToggle={toggleSettings} />
            {showSettings && (
              <SettingsMenu
                sfxEnabled={sfxEnabled}
                onSfxToggle={() => setSfxEnabled(!sfxEnabled)}
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
          <audio id="background-audio" loop ref={audioRef} autoPlay={sfxEnabled}>
            <source src="/assets/sounds/ambient-background.wav" type="audio/wav" />
          </audio>
        </>
      )}
    </div>
  );
};

export default App;