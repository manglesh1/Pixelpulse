import React, { useState } from "react";
import ReactDOM from "react-dom";
import HighScoreSection from "./HighScoreSection";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

import PlayersInfo from "./PlayersInfo";
import StartAndResetButtons from "./StartAndResetButtons";

const GameImage = ({
  styles,
  variant,
  highScores,
  gameStatus,
  selectedVariant,
  isStartButtonEnabled,
  setIsStartButtonEnabled,
  playersData,
  setStarting,
  setDoorCloseTime,
}) => {
  const [selectedVariantInstructions, setSelectedVariantInstructions] =
    useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleIconClick = (instructions) => {
    const sanitized = DOMPurify.sanitize(instructions);
    const parsedContent = parse(sanitized);
    setSelectedVariantInstructions(parsedContent);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const getHighScore = (variantId) => {
    const variantScore = highScores?.find((s) => s.VariantID === variantId);

    const emptyScore = { Points: "-", FirstName: "-", LastName: "-" };

    const topScore = variantScore?.TopScore ?? emptyScore;

    return {
      topDailyScore: topScore,
      topMonthlyScore: topScore,
      topAllTimeScore: topScore,
    };
  };

  const dialog = dialogOpen ? (
    <div className={styles.dialogOverlay} onClick={handleCloseDialog}>
      <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogContent}>
          {selectedVariantInstructions}
        </div>
        <button
          className={styles.dialogCloseButton}
          onClick={handleCloseDialog}
        >
          Close
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={styles.slide}>
        <div
          className={styles.variantBackground}
          style={{
            backgroundImage: `url(/images/gameImages/${variant.name
              .split(" ")
              .join("")}.jpg)`,
          }}
        >
          <div className={styles.slideHeader}>
            <HighScoreSection
              styles={styles}
              score={getHighScore(variant.ID)}
            />
            <div
              className={styles.slideHeaderItem}
              onClick={() => handleIconClick(variant.instructions)}
              style={{ cursor: "pointer" }}
            >
              HOW TO PLAY
            </div>
          </div>
          <PlayersInfo
            styles={styles}
            playersData={playersData}
            selectedVariant={selectedVariant}
          />
          <StartAndResetButtons
            styles={styles}
            gameStatus={gameStatus}
            selectedVariant={selectedVariant}
            isStartButtonEnabled={isStartButtonEnabled}
            setIsStartButtonEnabled={setIsStartButtonEnabled}
            playersData={playersData}
            setStarting={setStarting}
            setDoorCloseTime={setDoorCloseTime}
          />
        </div>
      </div>
      {/* Render dialog at the root of the DOM */}
      {ReactDOM.createPortal(dialog, document.body)}
    </>
  );
};

export default GameImage;
