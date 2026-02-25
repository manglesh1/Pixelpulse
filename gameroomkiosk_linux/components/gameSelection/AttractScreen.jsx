// components/gameSelection/AttractScreen.jsx
import React, { useMemo } from "react";
import styles from "../../styles/AttractScreen.module.css";
import attractConfig from "../../data/attractConfig.json";

const isBusyStatus = (gameStatus = "") =>
  String(gameStatus).toLowerCase().startsWith("running");

const AttractScreen = ({ gameCode, gameStatus, onEnter }) => {
  const busy = isBusyStatus(gameStatus);

  const config = attractConfig[gameCode] || {};
  const gameName = config.gameName || gameCode;
  const titleLine = config.titleLine || "WELCOME";
  const imageUrl = config.image || `/images/gameImages/${gameCode}.jpg`;

  const message = useMemo(() => {
    return busy ? "This game is currently in use" : titleLine;
  }, [busy, titleLine]);

  return (
    <div className={`${styles.attractRoot} ${busy ? styles.isBusy : ""}`}>
      <div className={styles.attractLayout}>
        {/* LEFT */}
        <div className={styles.attractLeft}>
          <div className={styles.attractImageFrame}>
            <img
              className={styles.attractImage}
              src={imageUrl}
              alt={`${gameName} image`}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className={styles.attractGameOverlayTitle}>{gameName}</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.attractRight}>
          <div
            className={`${styles.attractMessage} ${busy ? styles.busyText : ""}`}
          >
            {message}
          </div>

          <button
            className={`${styles.attractEnterButton} ${
              busy ? styles.attractEnterDisabled : ""
            }`}
            disabled={busy}
            onClick={() => {
              if (!busy) onEnter?.();
            }}
          >
            {busy ? "BUSY" : "ENTER"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttractScreen;
