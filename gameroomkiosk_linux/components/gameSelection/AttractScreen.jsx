import React, { useMemo } from "react";
import styles from "../../styles/AttractScreen.module.css";
import attractConfig from "../../data/attractConfig.json";
import { SendMessageToDotnet } from "../../tools/util";

const isBusyStatus = (gameStatus = "") =>
  String(gameStatus).toLowerCase().startsWith("running");

const hiddenButtonStyle = {
  position: "absolute",
  width: "200px",
  height: "100px",
  padding: "10px 20px",
  backgroundColor: "transparent",
  color: "transparent",
  border: "1px solid transparent",
  borderRadius: "5px",
  cursor: "pointer",
  zIndex: 999,
};

const AttractScreen = ({ gameCode, gameStatus, onEnter }) => {
  const busy = isBusyStatus(gameStatus);

  const config = attractConfig[gameCode] || {};
  const gameName = config.gameName || gameCode;
  const titleLine = config.titleLine || "WELCOME";
  const imageUrl = config.image || `/images/gameImages/${gameCode}.jpg`;
  const tags = Array.isArray(config.tags) ? config.tags : [];
  const ageGroup = config.ageGroup || "";

  const message = useMemo(() => {
    return busy ? "This game is currently in use" : titleLine;
  }, [busy, titleLine]);

  const handleAdmin = (corner) => {
    SendMessageToDotnet(corner);
  };

  return (
    <div className={`${styles.attractRoot} ${busy ? styles.isBusy : ""}`}>
      <button
        style={{ ...hiddenButtonStyle, top: "10px", left: "10px" }}
        onClick={() => handleAdmin("Top-Left")}
      >
        Top Left
      </button>

      <button
        style={{ ...hiddenButtonStyle, top: "10px", right: "10px" }}
        onClick={() => handleAdmin("Top-Right")}
      >
        Top Right
      </button>

      <button
        style={{ ...hiddenButtonStyle, bottom: "10px", left: "10px" }}
        onClick={() => handleAdmin("Bottom-Left")}
      >
        Bottom Left
      </button>

      <button
        style={{ ...hiddenButtonStyle, bottom: "10px", right: "10px" }}
        onClick={() => handleAdmin("Bottom-Right")}
      >
        Bottom Right
      </button>

      <div className={styles.attractLayout}>
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

        <div className={styles.attractRight}>
          <div className={styles.attractRightInner}>
            <div
              className={`${styles.attractMessage} ${
                busy ? styles.busyText : ""
              }`}
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

            {(ageGroup || tags.length > 0) && (
              <div className={styles.attractMeta}>
                {ageGroup && (
                  <div className={styles.attractMetaRow}>
                    <span className={styles.attractMetaLabel}>Age Group</span>
                    <span className={styles.attractAgeValue}>{ageGroup}</span>
                  </div>
                )}

                {tags.length > 0 && (
                  <div className={styles.attractMetaRow}>
                    <span className={styles.attractMetaLabel}>Tags</span>
                    <div className={styles.attractTags}>
                      {tags.map((tag) => (
                        <span key={tag} className={styles.attractTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttractScreen;
