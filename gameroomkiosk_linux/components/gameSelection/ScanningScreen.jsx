import React from "react";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import GameImage from "./GameImage";
import SendMessageToDotnet from "../../tools/util";

const adminZoneStyle = {
  position: "absolute",
  width: "200px",
  height: "100px",
  backgroundColor: "transparent",
  color: "transparent",
  border: "1px solid transparent",
  padding: "10px 20px",
  borderRadius: "5px",
  cursor: "pointer",
  zIndex: 999,
};

const AdminTapZone = ({ position, onTap }) => {
  const posStyle = {};

  switch (position) {
    case "Top-Left":
      posStyle.top = "10px";
      posStyle.left = "10px";
      break;
    case "Top-Right":
      posStyle.top = "10px";
      posStyle.right = "10px";
      break;
    case "Bottom-Left":
      posStyle.bottom = "10px";
      posStyle.left = "10px";
      break;
    case "Bottom-Right":
      posStyle.bottom = "10px";
      posStyle.right = "10px";
      break;
  }

  return (
    <button
      style={{ ...adminZoneStyle, ...posStyle }}
      onClick={() => onTap(position)}
    >
      {position}
    </button>
  );
};

const ScanningScreen = ({
  highScores,
  styles,
  gameData,
  playersData,
  gameStatus,
  setStep,
}) => {
  const handleCancel = () => {
    SendMessageToDotnet("refresh");
  };

  const handleAdmin = (zone) => {
    SendMessageToDotnet(zone);
  };

  const handleFinish = () => {
    if (
      gameStatus &&
      !gameStatus.toLowerCase().startsWith("running") &&
      playersData.length > 0
    ) {
      setStep(2); // → Move to StartingScreen / StartFlow
    }
  };

  const count = playersData.length;
  const handImage = `/images/count/${count}-count.svg`;

  const variants = gameData?.variants ?? [];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Admin Tap Zones */}
      <AdminTapZone position="Top-Left" onTap={handleAdmin} />
      <AdminTapZone position="Top-Right" onTap={handleAdmin} />
      <AdminTapZone position="Bottom-Left" onTap={handleAdmin} />
      <AdminTapZone position="Bottom-Right" onTap={handleAdmin} />

      <div className={styles.containerScanning}>
        {/* LEFT — slideshow of variants */}
        <div className={styles.leftSectionScanning}>
          <Slide easing="ease">
            {variants.map((variant, idx) => (
              <div className={styles.slide} key={idx}>
                <GameImage
                  styles={styles}
                  variant={variant}
                  highScores={highScores}
                  gameStatus={gameStatus}
                  selectedVariant={variant}
                  isStartButtonEnabled={true}
                  setIsStartButtonEnabled={() => {}}
                  playersData={playersData}
                  setStarting={() => {}}
                  setDoorCloseTime={() => {}}
                />
              </div>
            ))}
          </Slide>
        </div>

        {/* RIGHT — scanning logic */}
        <div className={styles.rightSectionScanning}>
          <div className={styles.titleContainer}>
            <h1 className={styles.scanningTitle}>
              {gameData?.gameName ?? "GAME NAME"}
            </h1>

            {playersData.length === 0 && (
              <div className={styles.scanMessage}>
                Please scan your wristbands!
              </div>
            )}
          </div>

          {/* Animated scan dots OR hand graphic */}
          {playersData.length === 0 ? (
            <div className={styles.scan}>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : (
            <div className={styles.imageContainer}>
              <img
                src={handImage}
                onError={(e) => (e.target.src = "/images/count/1-count.svg")}
                alt={`${count} fingers`}
                className={styles.handImage}
              />
            </div>
          )}

          {/* Buttons */}
          <div className={styles.scanButtons}>
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>

            <button
              className={styles.startButton}
              onClick={handleFinish}
              disabled={
                !gameStatus ||
                gameStatus.toLowerCase().startsWith("running") ||
                playersData.length <= 0
              }
            >
              {playersData.length <= 0
                ? "Please scan your wristbands"
                : gameStatus?.toLowerCase().startsWith("running")
                ? "Game is still running. Please wait..."
                : "Finish Scan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanningScreen;
