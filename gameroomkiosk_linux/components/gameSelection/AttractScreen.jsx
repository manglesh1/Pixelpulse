import React, { useMemo, useState, useEffect, useRef } from "react";
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

const MAX_IMAGE_RETRIES = 20;
const TOTAL_RETRY_WINDOW_MS = 60000;
const RETRY_DELAY_MS = Math.floor(TOTAL_RETRY_WINDOW_MS / MAX_IMAGE_RETRIES);

const AttractScreen = ({ gameCode, gameStatus, onEnter }) => {
  const busy = isBusyStatus(gameStatus);

  const config = attractConfig[gameCode] || {};
  const gameName = config.gameName || gameCode;
  const titleLine = config.titleLine || "WELCOME";
  const imageUrl = config.image || `/images/gameImages/${gameCode}.jpg`;
  const tags = Array.isArray(config.tags) ? config.tags : [];
  const ageGroup = config.ageGroup || "";

  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    setImgSrc(imageUrl);
    setRetryCount(0);
    setImageLoaded(false);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [imageUrl]);

  const message = useMemo(() => {
    return busy ? "This game is currently in use" : titleLine;
  }, [busy, titleLine]);

  const handleAdmin = (corner) => {
    SendMessageToDotnet(corner);
  };

  const handleImageError = () => {
    if (retryCount >= MAX_IMAGE_RETRIES) {
      console.warn(
        `Failed to load image after ${MAX_IMAGE_RETRIES} retries over ~${Math.round(
          TOTAL_RETRY_WINDOW_MS / 1000
        )}s:`,
        imageUrl
      );
      return;
    }

    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      setImageLoaded(false);
      setImgSrc(
        `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}retry=${Date.now()}`
      );
    }, RETRY_DELAY_MS);
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
              key={imgSrc}
              className={styles.attractImage}
              src={imgSrc}
              alt={`${gameName} image`}
              onLoad={() => {
                setImageLoaded(true);
                setRetryCount(0);

                if (retryTimeoutRef.current) {
                  clearTimeout(retryTimeoutRef.current);
                  retryTimeoutRef.current = null;
                }
              }}
              onError={handleImageError}
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.2s ease",
              }}
              draggable={false}
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
                {tags.length > 0 && (
                  <div className={styles.attractMetaRow}>
                    <div className={styles.attractTags}>
                      {tags.map((tag) => (
                        <span key={tag} className={styles.attractTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ageGroup && (
                  <div className={styles.attractMetaRow}>
                    <span className={styles.attractAgeValue}>{ageGroup}</span>
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