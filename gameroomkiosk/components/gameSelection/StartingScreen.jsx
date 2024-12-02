import React, { useState } from 'react'
import GameImage from './GameImage';
import GameSelection from './GameSelection';
import PlayersInfo from './PlayersInfo';

const StartingScreen = ({ highScores, styles, gameData, playersData, gameStatus }) => {
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };
  const handleCancel = () => {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage("refresh");
    } else {
      console.log('WebView2 is not available');
    }
  };

  const handleStartButtonClick = () => {
    if (window.chrome && window.chrome.webview) {
      const message = `start:${selectedVariant.name}:${playersData.length}:${selectedVariant.GameType}`;
      window.chrome.webview.postMessage(message);
      handleCancel();
    } else {
      console.log('WebView2 is not available');
    }
    setIsStartButtonEnabled(false); // Disable the start button
  };

  return (
    <div className={styles.containerStarting}>
      {/* Left Section: Starting Interface */}
      <div className={styles.leftSectionStarting}>
        <div className={styles.titleContainer}>
          <h1 className={styles.startingTitle}>{gameData.gameName || 'GAME NAME'}</h1>
        </div>
        <GameSelection styles={styles} gameData={gameData} selectedVariant={selectedVariant} handleVariantClick={handleVariantClick} />
        <PlayersInfo styles={styles} playersData={playersData} />
        <div className={styles.scanButtons}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
          <button
            className={styles.startButton}
            onClick={handleStartButtonClick}
            disabled={gameStatus.toLowerCase().startsWith('running') || !selectedVariant || isStartButtonEnabled}
          >
            {selectedVariant ? "Start" : "Please Select the Game"}
          </button>
        </div>
      </div>
      {/* Right Section: Image */}
      <div className={styles.rightSectionStarting}>
            <div className={styles.slide}>
              <GameImage styles={styles} variant={selectedVariant ?? gameData.variants[0]} highScores={highScores} />
            </div>
      </div>
    </div>
  );
}

export default StartingScreen
