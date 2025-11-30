import React, { useState, useEffect } from "react";
import GameImage from "./GameImage";
import GameSelection from "./GameSelection";
import GameStarting from "./GameStarting";
import SendMessageToDotnet from "../../tools/util";
import AdminMenu from "./AdminMenu";
import AdminPasswordPad from "./AdminPasswordPad";
import { openScoreHubSocket } from "../../services/controllerApi";

const StartingScreen = ({
  highScores,
  styles,
  gameData,
  playersData,
  setPlayersData,
  clearPlayers,
  gameStatus,
  isStartButtonEnabled,
  setIsStartButtonEnabled,
}) => {
  const [selectedVariant, setSelectedVariant] = useState(gameData.variants[0]);
  const [starting, setStarting] = useState(false);
  const [doorCloseTime, setDoorCloseTime] = useState(0);

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };

  const [gesture, setGesture] = useState([]);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showPasswordPad, setShowPasswordPad] = useState(false);

  const ADMIN_SEQUENCE = ["TL", "BR", "TR", "BL"];

  const handleCornerPress = (corner) => {
    setGesture((g) => {
      const next = [...g, corner];

      // Compare step-by-step
      if (ADMIN_SEQUENCE[next.length - 1] !== corner) {
        return []; // wrong → reset
      }

      if (next.length === ADMIN_SEQUENCE.length) {
        // Full pattern matched → show password pad
        setGesture([]);
        setShowPasswordPad(true);
      }

      return next;
    });
  };

  // ---- ScoreHub WebSocket ----
  useEffect(() => {
    const ws = openScoreHubSocket();

    ws.onmessage = (e) => {
      console.log("[scorehub] raw:", e.data);

      try {
        const msg = JSON.parse(e.data);
        console.log("[scorehub] parsed:", msg);

        if (msg.type === "scoreUpdate" && msg.data?.type === "clearPlayers") {
          console.log("[scorehub] CLEAR PLAYERS received from backend");
          setPlayersData([]);
        }
      } catch (err) {
        console.error("Error parsing scorehub WS message", err);
      }
    };

    return () => ws.close();
  }, [setPlayersData]);

  const cornerStyle = {
    position: "absolute",
    top: "10px",
    left: "10px",
    width: "200px",
    height: "100px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    zIndex: 9999,
  };

  return (
    <>
      {/* Hidden corner buttons */}
      <button style={cornerStyle} onClick={() => handleCornerPress("TL")} />

      <button
        style={{ ...cornerStyle, right: "10px", left: "auto" }}
        onClick={() => handleCornerPress("TR")}
      />

      <button
        style={{ ...cornerStyle, top: "auto", bottom: "10px" }}
        onClick={() => handleCornerPress("BL")}
      />

      <button
        style={{
          ...cornerStyle,
          top: "auto",
          bottom: "10px",
          right: "10px",
          left: "auto",
        }}
        onClick={() => handleCornerPress("BR")}
      />

      <div className={styles.containerStarting}>
        {/* Left Section */}
        <div className={styles.leftSectionStarting}>
          <GameSelection
            styles={styles}
            gameData={gameData}
            selectedVariant={selectedVariant}
            handleVariantClick={handleVariantClick}
          />

          <div className={styles.slideDescription}>
            <span>{selectedVariant.name}</span>
            <p>{selectedVariant.variantDescription}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.rightSectionStarting}>
          <div className={styles.slide}>
            {starting ? (
              <GameStarting styles={styles} doorCloseTime={doorCloseTime} />
            ) : (
              <GameImage
                styles={styles}
                variant={selectedVariant ?? gameData.variants[0]}
                highScores={highScores}
                gameStatus={gameStatus}
                selectedVariant={selectedVariant}
                isStartButtonEnabled={isStartButtonEnabled}
                setIsStartButtonEnabled={setIsStartButtonEnabled}
                playersData={playersData}
                setStarting={setStarting}
                setDoorCloseTime={setDoorCloseTime}
              />
            )}
          </div>
        </div>
      </div>

      {/* Admin Password Pad */}
      {showPasswordPad && (
        <AdminPasswordPad
          onSuccess={() => {
            setShowPasswordPad(false);
            setShowAdminMenu(true);
          }}
          onCancel={() => setShowPasswordPad(false)}
        />
      )}

      {/* Actual Admin Menu */}
      {showAdminMenu && <AdminMenu onClose={() => setShowAdminMenu(false)} />}
    </>
  );
};

export default StartingScreen;
