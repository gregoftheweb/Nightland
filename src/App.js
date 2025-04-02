// nightland/src/App.js
import React, {
  useReducer,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { initialState, reducer } from "./modules/gameState";
import { gamePreferences } from "./modules/gamePreferences"; // New: Import preferences
import { dropItemPrompt } from "./assets/copy/textcontent"; // New import
import SplashScreen from "./components/SplashScreen";
import PrincessScreen from "./components/PrincessScreen";
import StatusBar from "./components/StatusBar";
import CombatUI from "./components/CombatUI";
import DeathDialog from "./components/DeathDialog";
import Dialog from "./components/Dialog";
import SettingsMenu from "./components/SettingsMenu";
import { handleMovePlayer } from "./modules/gameLoop";
import { initializeEntityStyles, updateViewport } from "./modules/utils";
import "./styles/styles.css";

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [phase, setPhase] = useState("splash");
  const [showSettings, setShowSettings] = useState(false);
  const [dialogMessage, setDialogMessage] = useState(""); // In-game messages
  const [soloDeathAction, setSoloDeathAction] = useState(null);
  const [deathMessage, setDeathMessage] = useState(""); // Descriptions/death
  const [deathCount, setDeathCount] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isDropping, setIsDropping] = useState(false);
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
        audioRef.current
          .play()
          .catch((error) => console.log("Audio play error:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [sfxEnabled]);

  useEffect(() => {
    console.log("App.js - Player HP:", state.player.hp);
  }, [state.player.hp]);

  const handleStartGame = () => setPhase("princess");
  const handlePrincessNext = () => setPhase("gameplay");
  const toggleSettings = (e) => {
    e.stopPropagation();
    setShowSettings(!showSettings);
  };

  const showDialog = useCallback((content, duration = 3600) => {
    setDialogMessage(content);
    if (duration !== null) {
      // Support no auto-close
      setTimeout(() => setDialogMessage(""), duration);
    }
  }, []);

  const showEntityDescription = (description) => setDeathMessage(description);

  const handleLevelClick = () => {
    const currentLevel = (state.levels || []).find(
      (lvl) => lvl.id === state.level
    ) || {
      name: "Unknown Level",
      description: "No level data available.",
    };
    const levelMessage = `${currentLevel.name}\n${currentLevel.description}`;
    showDialog(levelMessage, 10000);
  };

  const handleMovePlayerWithDeath = (state, dispatch, key) =>
    handleMovePlayer(state, dispatch, key, showDialog, (msg) => {
      setDeathMessage(msg);
      setDeathCount((prev) => prev + 1);
    });

  const showInventory = useCallback(() => {
    if (state.player.inventory.length === 0) {
      showDialog("Inventory is empty.", 3000);
    } else {
      const inventoryList = state.player.inventory
        .map(
          (item, index) => `${index + 1}. ${item.name} - ${item.description}`
        )
        .join("\n");
      showDialog(
        `Inventory (${state.player.inventory.length}/${state.player.maxInventorySize}):\n${inventoryList}`,
        5000
      );
    }
  }, [state.player.inventory, state.player.maxInventorySize, showDialog]);

  const showDropMenu = useCallback(() => {
    if (state.player.inventory.length === 0) {
      showDialog("Inventory is empty. Nothing to drop.", 3000);
      setIsDropping(false);
    } else {
      const dropList = state.player.inventory
        .map((item, index) => `${index + 1}. ${item.name}`)
        .join("\n");
      showDialog(`${dropItemPrompt}:\n${dropList}`, 15000);
      setIsDropping(true);
    }
  }, [state.player.inventory, showDialog]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase === "gameplay") {
        event.preventDefault();
        const { keys } = gamePreferences;

        if (
          event.key === keys.moveUp ||
          event.key === keys.moveDown ||
          event.key === keys.moveLeft ||
          event.key === keys.moveRight
        ) {
          handleMovePlayerWithDeath(state, dispatch, event.key);
          updateViewport(state);
        } else if (event.key === keys.combatAction && state.inCombat) {
          if (combatStepRef.current) combatStepRef.current();
        } else if (event.key === keys.showInventory) {
          showInventory();
        } else if (event.key === keys.dropItem) {
          showDropMenu();
        } else if (isDropping && /^[1-9]$/.test(event.key)) {
          // Number keys 1-9
          const index = parseInt(event.key, 10) - 1; // Convert to 0-based index
          const itemToDrop = state.player.inventory[index];
          if (itemToDrop) {
            dispatch({ type: "DROP_ITEM", payload: { itemId: itemToDrop.id } });
            showDialog(`Dropped ${itemToDrop.name}.`, 3000);
            setIsDropping(false);
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state, phase, showDialog, showInventory, showDropMenu, isDropping]);

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

  const currentLevel = (state.levels || []).find(
    (lvl) => lvl.id === state.level
  ) || {
    name: "Unknown Level",
    description: "No level data available.",
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
                className="level-info"
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  color: "white",
                }}
              >
                <h2>{currentLevel.name}</h2>
                <p>{currentLevel.description}</p>
              </div>
              <div
                id={state.player.shortName}
                className={state.player.shortName}
                style={{
                  left: `${state.player.position.col * state.tileSize}px`,
                  top: `${state.player.position.row * state.tileSize}px`,
                  position: "absolute",
                  width: "40px",
                  height: "40px",
                }}
                onClick={() => showEntityDescription(state.player.description)}
              />
              {/* Removed standalone redoubt rendering */}
              {state.greatPowers &&
                state.greatPowers.map((power) => (
                  <div
                    key={power.shortName}
                    id={power.shortName}
                    className={power.shortName}
                    style={{
                      left: `${power.position.col * state.tileSize}px`,
                      top: `${power.position.row * state.tileSize}px`,
                      position: "absolute",
                    }}
                    onClick={() => showEntityDescription(power.description)}
                  />
                ))}
              {state.objects &&
                state.objects.map((object) => (
                  <div
                    key={object.shortName}
                    id={object.shortName}
                    className={object.shortName}
                    style={{
                      left: `${object.position.col * state.tileSize}px`,
                      top: `${object.position.row * state.tileSize}px`,
                      position: "absolute",
                      width: `${(object.size?.width || 1) * state.tileSize}px`,
                      height: `${
                        (object.size?.height || 1) * state.tileSize
                      }px`,
                      transform: `rotate(${object.direction || 0}deg)`,
                      transformOrigin: "center center",
                    }}
                    onClick={() => showEntityDescription(object.description)}
                  />
                ))}

              {state.items &&
                state.items
                  .filter((item) => item.active)
                  .map((item) => {
                    console.log(
                      "Rendering item:",
                      item.shortName,
                      "at",
                      item.position,
                      "active:",
                      item.active
                    );
                    return (
                      <div
                        key={item.shortName} // Potential issue: duplicate keys
                        id={item.shortName}
                        className={item.shortName}
                        style={{
                          left: `${item.position.col * state.tileSize}px`,
                          top: `${item.position.row * state.tileSize}px`,
                          position: "absolute",
                          width: `${
                            (item.size?.width || 1) * state.tileSize
                          }px`,
                          height: `${
                            (item.size?.height || 1) * state.tileSize
                          }px`,
                        }}
                        onClick={() => showEntityDescription(item.description)}
                      />
                    );
                  })}
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
                      className={monster.shortName}
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
                      className={monster.shortName}
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
              {state.pools &&
                state.pools.map((pool) => {
                  const template = state.poolsTemplate;
                  return (
                    <div
                      key={`poolOfPeace-${pool.id}`}
                      id={`poolOfPeace-${pool.id}`}
                      className={template.shortName}
                      style={{
                        left: `${pool.position.col * state.tileSize}px`,
                        top: `${pool.position.row * state.tileSize}px`,
                        position: "absolute",
                        width: `${template.size.width * state.tileSize}px`,
                        height: `${template.size.height * state.tileSize}px`,
                      }}
                      onClick={() =>
                        showEntityDescription(template.description)
                      }
                    />
                  );
                })}
              {state.footsteps &&
                state.footsteps.map((step) => {
                  const template = state.footstepsTemplate;
                  return (
                    <div
                      key={`footstepsPersius-${step.id}`}
                      id={`footstepsPersius-${step.id}`}
                      className={template.shortName}
                      style={{
                        left: `${step.position.col * state.tileSize}px`,
                        top: `${step.position.row * state.tileSize}px`,
                        position: "absolute",
                        width: `${template.size.width * state.tileSize}px`,
                        height: `${template.size.height * state.tileSize}px`,
                        transform: `rotate(${step.direction}deg)`,
                        transformOrigin: "center center",
                      }}
                      onClick={() =>
                        showEntityDescription(template.description)
                      }
                    />
                  );
                })}
            </div>
            <StatusBar
              hp={state.player.hp}
              onSettingsToggle={toggleSettings}
              level={state.level}
              onLevelClick={handleLevelClick}
            />
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
          <Dialog
            children={dialogMessage} // Replaces GameDialog
            onClose={() => setDialogMessage("")}
            showCloseButton={true}
            duration={null} // Managed by showDialog
          />
          <Dialog
            key={deathCount} // Unique key for death/description dialog
            children={deathMessage}
            onClose={() => setDeathMessage("")}
            showCloseButton={true}
            duration={5000} // Default for descriptions
          />
          <audio
            id="background-audio"
            loop
            ref={audioRef}
            autoPlay={sfxEnabled}
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
