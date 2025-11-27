import React, { useState } from 'react'
import GameImage from './GameImage';
import GameSelection from './GameSelection';
import SendMessageToDotnet from '../../tools/util';
const NumberOfPlayerSelectionScreen = ({ highScores, styles, gameData, playersData, gameStatus, isStartButtonEnabled, setIsStartButtonEnabled }) => {
  const [selectedVariant, setSelectedVariant] = useState(gameData.variants[0]);
  const [numberOfPlayers, setNumberOfPlayers] = useState(0);

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };
  const handleCancel = () => {
       SendMessageToDotnet('refresh');
  };

  const handleStartButtonClick = () => {
    const message = `start:${selectedVariant.name}:${numberOfPlayers}:${selectedVariant.GameType}`;
    SendMessageToDotnet(message);
    handleCancel();
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
        <div className={styles.numberOfPlayerSelection}>
            <h2 className={styles.selectionSectionTitle}>Select Number of Players</h2>
            <div className={styles.playerSelectionContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                <button
                    key={num}
                    className={`${styles.playerButton} ${
                    numberOfPlayers === num ? styles.selectedPlayerButton : ''
                    }`}
                    onClick={() => setNumberOfPlayers(num)}
                >
                    {num}
                </button>
                ))}
            </div>
        </div>

        <div className={styles.scanButtons}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
          <button
            className={styles.startButton}
            onClick={handleStartButtonClick}
            disabled={gameStatus.toLowerCase().startsWith('running') || !selectedVariant || numberOfPlayers==0 || !isStartButtonEnabled}
          >
            {numberOfPlayers==0 ? "Please Select the Number Of Players" : gameStatus.toLowerCase().startsWith('running') ? "Game is still running, Please wait" : "Start"}
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

export default NumberOfPlayerSelectionScreen;
