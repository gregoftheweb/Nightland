// nightland/src/App.js
import React, {
  useReducer,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { initialState, reducer } from "./modules/gameState";
import { gamePreferences } from "./modules/gamePreferences";
import { dropItemPrompt } from "./assets/copy/textcontent";
import SplashScreen from "./components/SplashScreen";
import PrincessScreen from "./components/PrincessScreen";
import StatusBar from "./components/StatusBar";
import CombatUI from "./components/CombatUI";
import DeathDialog from "./components/DeathDialog";
import Dialog from "./components/Dialog";
import SettingsMenu from "./components/SettingsMenu";
import { handleMovePlayer } from "./modules/gameLoop";
import {
  isClickWithinBounds,
  initializeEntityStyles,
  updateViewport,
} from "./modules/utils";
import "./styles/styles.css";

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [phase, setPhase] = useState("splash");
  const [showSettings, setShowSettings] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [soloDeathAction, setSoloDeathAction] = useState(null);
  const [deathMessage, setDeathMessage] = useState("");
  const [deathCount, setDeathCount] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isDroppingWeapon, setIsDroppingWeapon] = useState(false);
  const [isEquippingWeapon, setIsEquippingWeapon] = useState(false); // New state for equip mode
  const [showCollisionMask, setShowCollisionMask] = useState(false);
  const gameContainerRef = useRef(null);
  const combatStepRef = useRef(null);
  const audioRef = useRef(null);

  const currentLevel = (state.levels || []).find(
    (lvl) => lvl.id === state.level
  ) || {
    name: "Unknown Level",
    description: "No level data available.",
  };

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

  const showDialog = useCallback((message, duration, onClose) => {
    setDialogMessage(message);
    if (duration) {
      setTimeout(() => {
        setDialogMessage("");
        if (onClose) onClose();
      }, duration);
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

  const handleMovePlayerWithDeath = (direction) =>
    handleMovePlayer(state, dispatch, direction, showDialog, (msg) => {
      setDeathMessage(msg);
      setDeathCount((prev) => prev + 1);
    });

  const showInventory = useCallback(() => {
    if (state.player.inventory.length === 0) {
      showDialog("Inventory is empty.", 3000);
    } else {
      dispatch({ type: "TOGGLE_INVENTORY" });
      setIsDropping(true);
      showDialog(
        <div>
          <h3>
            Inventory ({state.player.inventory.length}/
            {state.player.maxInventorySize})
          </h3>
          <ul>
            {state.player.inventory.map((item, index) => (
              <li key={item.id}>
                {index + 1}. {item.name}
              </li>
            ))}
          </ul>
          <hr className="drop-divider" />
          <p className="drop-prompt">{dropItemPrompt}</p>
        </div>,
        5000,
        () => setIsDropping(false)
      );
    }
  }, [state.player.inventory, state.player.maxInventorySize, showDialog]);

  const showWeaponsInventory = useCallback(() => {
    if (state.player.weapons.length === 0) {
      showDialog("Weapons inventory is empty.", 3000);
    } else {
      dispatch({ type: "TOGGLE_WEAPONS_INVENTORY" });
      setIsDroppingWeapon(true);
      setIsEquippingWeapon(false); // Reset equip mode when opening inventory
      showDialog(
        <div>
          <h3>
            Weapons Inventory ({state.player.weapons.length}/
            {state.player.maxWeaponsSize})
          </h3>
          <ul>
            {state.player.weapons.map((weapon, index) => {
              const weaponDetails = state.weapons.find((w) => w.id === weapon.id);
              return (
                <li key={weapon.id}>
                  {index + 1}. {weaponDetails.name}{" "}
                  {weapon.equipped ? "(Equipped)" : ""}
                </li>
              );
            })}
          </ul>
          <hr className="drop-divider" />
          <p className="drop-prompt">
            {isEquippingWeapon && state.player.weapons.length > 1
              ? "Equip Weapon Number"
              : dropItemPrompt}
          </p>
        </div>,
        5000,
        () => {
          setIsDroppingWeapon(false);
          setIsEquippingWeapon(false); // Reset equip mode when closing
        }
      );
    }
  }, [state.player.weapons, state.player.maxWeaponsSize, showDialog, isEquippingWeapon]);



  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase !== "gameplay") return;
      event.preventDefault();
      const { keys } = gamePreferences;
  
      if (handleMovementKey(event, keys)) return;
      if (handleSpacebar(event, keys)) return;
      if (handleInventoryToggle(event, keys)) return;
      if (handleWeaponsInventoryToggle(event, keys)) return;
      if (handleItemDropKey(event)) return;
      if (handleWeaponKey(event)) return;
      if (handleEquipModeToggle(event, keys)) return;
    };
  
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    state,
    phase,
    showDialog,
    showInventory,
    showWeaponsInventory,
    isDropping,
    isDroppingWeapon,
    isEquippingWeapon,
  ]);
  


  const handleMovementKey = (event, keys) => {
    const directionMap = {
      [keys.moveUp]: "up",
      [keys.moveDown]: "down",
      [keys.moveLeft]: "left",
      [keys.moveRight]: "right",
    };
  
    const direction = directionMap[event.key];
    if (direction) {
      handleMovePlayerWithDeath(direction);
      updateViewport(state);
      return true;
    }
    return false;
  };
  
  const handleSpacebar = (event, keys) => {
    if (event.key !== keys.spaceBar) return false;
  
    if (state.inCombat && combatStepRef.current) {
      combatStepRef.current();
    } else {
      handleMovePlayerWithDeath("stay");
    }
    return true;
  };
  
  const handleInventoryToggle = (event, keys) => {
    if (event.key === keys.showInventory) {
      showInventory();
      return true;
    }
    return false;
  };
  
  const handleWeaponsInventoryToggle = (event, keys) => {
    if (event.key === keys.showWeaponsInventory) {
      showWeaponsInventory();
      return true;
    }
    return false;
  };
  
  const handleItemDropKey = (event) => {
    if (!isDropping || !/^[1-9]$/.test(event.key)) return false;
  
    const index = parseInt(event.key, 10) - 1;
    const itemToDrop = state.player.inventory[index];
    if (itemToDrop) {
      dispatch({ type: "DROP_ITEM", payload: { itemId: itemToDrop.id } });
      showDialog(`Dropped ${itemToDrop.name}.`, 3000);
      setIsDropping(false);
      dispatch({ type: "TOGGLE_INVENTORY" });
    }
    return true;
  };
  
  const handleWeaponKey = (event) => {
    if (!isDroppingWeapon || !/^[1-9]$/.test(event.key)) return false;
  
    const index = parseInt(event.key, 10) - 1;
    const weaponToDrop = state.player.weapons[index];
    if (!weaponToDrop) return false;
  
    const weaponDetails = state.weapons.find((w) => w.id === weaponToDrop.id);
  
    if (isEquippingWeapon) {
      dispatch({ type: "EQUIP_WEAPON", payload: { weaponId: weaponToDrop.id } });
      showDialog(`Equipped ${weaponDetails.name}.`, 3000);
      setIsEquippingWeapon(false);
      setIsDroppingWeapon(false);
      dispatch({ type: "TOGGLE_WEAPONS_INVENTORY" });
    } else {
      if (weaponToDrop.id === "weapon-discos-001") {
        showDialog("Cannot drop this weapon!", 3000);
      } else {
        dispatch({ type: "DROP_WEAPON", payload: { weaponId: weaponToDrop.id } });
        showDialog(`Dropped ${weaponDetails.name}.`, 3000);
      }
      setIsDroppingWeapon(false);
      dispatch({ type: "TOGGLE_WEAPONS_INVENTORY" });
    }
  
    return true;
  };
  
  const handleEquipModeToggle = (event, keys) => {
    if (!isDroppingWeapon || event.key !== keys.equipWeapon) return false;
  
    if (state.player.weapons.length > 1) {
      setIsEquippingWeapon(true);
      showWeaponsInventory(); // Refresh prompt
    }
  
    return true;
  };
  











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
                onClick={() => {
                  console.log("Christos SoulKey:", state.player.soulKey);
                  showEntityDescription(state.player.description);
                }}
              />
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
                state.objects.map((object) => {
                  const handleObjectClick = (event) => {
                    const gameBoard =
                      event.currentTarget.parentElement.getBoundingClientRect();
                    const isWithinBounds = isClickWithinBounds(
                      event,
                      gameBoard,
                      object,
                      state.tileSize
                    );

                    if (!isWithinBounds) return;

                    showEntityDescription(object.description);
                  };

                  return (
                    <React.Fragment key={object.shortName}>
                      <div
                        id={object.shortName}
                        className={object.shortName}
                        style={{
                          left: `${object.position.col * state.tileSize}px`,
                          top: `${object.position.row * state.tileSize}px`,
                          position: "absolute",
                          width: `${
                            (object.size?.width || 1) * state.tileSize
                          }px`,
                          height: `${
                            (object.size?.height || 1) * state.tileSize
                          }px`,
                          transform: `rotate(${object.direction || 0}deg)`,
                          transformOrigin: "center center",
                        }}
                        onClick={handleObjectClick}
                      />
                      {showCollisionMask &&
                        object.collisionMask &&
                        object.collisionMask.map((mask, index) => (
                          <div
                            key={`${object.shortName}-mask-${index}`}
                            className="collision-mask"
                            style={{
                              left: `${
                                (object.position.col + mask.col) *
                                state.tileSize
                              }px`,
                              top: `${
                                (object.position.row + mask.row) *
                                state.tileSize
                              }px`,
                              position: "absolute",
                              width: `${(mask.width || 1) * state.tileSize}px`,
                              height: `${
                                (mask.height || 1) * state.tileSize
                              }px`,
                              zIndex: 1000,
                            }}
                          />
                        ))}
                    </React.Fragment>
                  );
                })}
              {state.items &&
                state.items
                  .filter((item) => item.active)
                  .map((item) => {
                    return (
                      <div
                        key={item.shortName}
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
                  const pos = isInCombat
                    ? getCombatSlotPosition(monster.uiSlot || 0)
                    : {
                        left: monster.position.col * state.tileSize,
                        top: monster.position.row * state.tileSize,
                      };
                  return (
                    <div
                      key={monster.id}
                      id={monster.id}
                      className={monster.shortName}
                      style={{
                        left: `${pos.left}px`,
                        top: `${pos.top}px`,
                        position: "absolute",
                        width: "40px",
                        height: "40px",
                      }}
                      onClick={() => {
                        console.log(`${monster.name} SoulKey:`, monster.soulKey);
                        showEntityDescription(monster.description);
                      }}
                    />
                  );
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
            children={dialogMessage}
            onClose={() => setDialogMessage("")}
            showCloseButton={true}
            duration={null}
          />
          <Dialog
            key={deathCount}
            children={deathMessage}
            onClose={() => setDeathMessage("")}
            showCloseButton={true}
            duration={5000}
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