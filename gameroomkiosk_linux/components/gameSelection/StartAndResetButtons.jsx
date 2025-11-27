import React from "react";
import SendMessageToDotnet from "../../tools/util";

const StartAndResetButtons = ({
  styles,
  gameStatus,
  selectedVariant,
  isStartButtonEnabled,
  setIsStartButtonEnabled,
  playersData,
  setStarting,
  setDoorCloseTime,
}) => {
  // ---- Reset Button ----
  const handleCancel = () => {
    SendMessageToDotnet("refresh");
  };

  // ---- Player Names for Controller ----
  const sendPlayerNames = (playersData) => {
    const MAX_LEN = 10;

    const playerNames = playersData.map(
      ({ player: { FirstName = "", LastName = "" } }, idx) => {
        let name;

        if (FirstName || LastName) {
          const lastInitial = LastName.charAt(0);
          name = lastInitial ? `${FirstName} ${lastInitial}` : FirstName;
        } else {
          name = `Player ${idx + 1}`;
        }

        if (name.length > MAX_LEN) {
          return `${name.slice(0, MAX_LEN - 3)}...`;
        }
        return name;
      }
    );

    SendMessageToDotnet(`setPlayerNames:${playerNames.join(",")}`);
  };

  // ---- Start Button ----
  const handleStart = () => {
    if (!selectedVariant || playersData.length === 0) return;

    setIsStartButtonEnabled(false);
    setStarting(true);
    setDoorCloseTime(10);

    let remaining = 10;
    const interval = setInterval(() => {
      remaining -= 1;
      setDoorCloseTime(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    // Send start message to controller
    const msg = `start:${selectedVariant.name}:${playersData.length}:${selectedVariant.GameType}`;
    SendMessageToDotnet(msg);

    // Send player names separately
    sendPlayerNames(playersData);

    // After countdown → switch back to game queue
    setTimeout(() => {
      setStarting(false);
      handleCancel();
    }, 10000);
  };

  const isGameRunning = gameStatus.toLowerCase().startsWith("running");

  return (
    <div className={styles.scanButtons}>
      {/* RESET */}
      <button className={styles.cancelButton} onClick={handleCancel}>
        Reset
      </button>

      {/* START */}
      <button
        className={styles.startButton}
        onClick={handleStart}
        disabled={
          !isStartButtonEnabled || isGameRunning || playersData.length === 0
        }
      >
        {playersData.length === 0
          ? "Please Scan Wristbands"
          : isGameRunning
          ? "Game Running..."
          : "Start"}
      </button>
    </div>
  );
};

export default StartAndResetButtons;
