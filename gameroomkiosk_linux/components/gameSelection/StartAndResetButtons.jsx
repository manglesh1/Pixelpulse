import React from "react";
import { SendMessageToDotnet } from "../../tools/util";
const StartAndResetButtons = ({
  styles,
  gameStatus = "",
  selectedVariant,
  isStartButtonEnabled,
  setIsStartButtonEnabled,
  playersData = [],
  setStarting,
  setDoorCloseTime,
  requireWristbandScan = true,
  numberOfPlayers = 0,
  goToAttract = () => {},
}) => {
  // Effective count for the start message: wristband-scanned players when
  // the scanner is enabled, otherwise the manually-selected 1..5 value.
  const effectiveCount = requireWristbandScan ? playersData.length : numberOfPlayers;
  const handleCancel = () => {
    SendMessageToDotnet("refresh");
  };

  const setPlayerNames = (playersData) => {
    const MAX_LEN = 10;

    const playerNames = playersData.map(
      ({ player: { FirstName = "", LastName = "" } }, idx) => {
        let name;
        if (FirstName || LastName) {
          const lastInitial = LastName.charAt(0);
          name = lastInitial ? `${FirstName} ${lastInitial}` : FirstName;
        } else {
          name = `Player: ${idx}`;
        }

        if (name.length > MAX_LEN) {
          return `${name.slice(0, MAX_LEN - 3)}...`;
        }
        return name;
      }
    );
    SendMessageToDotnet(`setPlayerNames:${playerNames.join(",")}`);
  };

  const handleStartButtonClick = () => {
    //console.log(playersData);
    setIsStartButtonEnabled(false);
    setStarting(true);
    setDoorCloseTime(10);

    let remainingTime = 10;
    let countdownInterval; // ✅ Declare before using it in setInterval

    countdownInterval = setInterval(() => {
      remainingTime -= 1;
      setDoorCloseTime(remainingTime);

      if (remainingTime <= 0) {
        clearInterval(countdownInterval); // ✅ Now this works
      }
    }, 1000);

    const message = `start:${selectedVariant.name}:${effectiveCount}:${selectedVariant.GameType}`;
    SendMessageToDotnet(message);

    // Only push player names when they came from real wristband scans.
    // Anonymous count-mode players have no names to propagate.
    if (requireWristbandScan) {
      setPlayerNames(playersData);
    }

    // When the door-close countdown ends, stop the "starting" UI and
    // drop the user back to the AttractScreen. The AttractScreen will
    // render its BUSY state because gameStatus is running — users can
    // still tap ENTER to browse info, but they're visually out of the
    // launch flow.
    setTimeout(() => {
      setStarting(false);
      goToAttract();
      handleCancel();
    }, 10000);
  };

  return (
    <div className={styles.scanButtons}>
      <button className={styles.cancelButton} onClick={handleCancel}>
        Reset
      </button>
      <button
        className={styles.startButton}
        onClick={handleStartButtonClick}
        disabled={
          gameStatus.toLowerCase().startsWith("running") ||
          effectiveCount <= 0
        }
      >
        {gameStatus.toLowerCase().startsWith("running")
          ? "BUSY — Game In Progress"
          : effectiveCount <= 0
          ? requireWristbandScan
            ? "Please Scan Your Wristbands"
            : "Please Select Number of Players"
          : "Start"}
      </button>
    </div>
  );
};

export default StartAndResetButtons;
