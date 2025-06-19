import React, { useState } from 'react'
import GameImage from './GameImage';
import GameSelection from './GameSelection';

const StartingScreen = ({ highScores, styles, gameData, playersData, gameStatus }) => {
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(gameData.variants[0]);
  const handleVariantClick = (variant) => {
        setSelectedVariant(variant);
    };
  return (
    <div className={styles.containerStarting}>
      {/* Left Section: Starting Interface */}
      <div className={styles.leftSectionStarting}>
        {/* <div className={styles.titleContainer}>
          <h1 className={styles.startingTitle}>{gameData.gameName || 'GAME NAME'}</h1>
        </div> */}
        <GameSelection styles={styles} gameData={gameData} selectedVariant={selectedVariant} handleVariantClick={handleVariantClick} />
        <div className={styles.slideDescription}>
          <span>{selectedVariant.name}</span>
          <p>{selectedVariant.variantDescription}</p>
        </div>
      </div>
      {/* Right Section: Image */}
      <div className={styles.rightSectionStarting}>
            <div className={styles.slide}>
              <GameImage 
                styles={styles} 
                variant={selectedVariant ?? gameData.variants[0]} 
                highScores={highScores} 
                gameStatus={gameStatus} 
                selectedVariant={selectedVariant} 
                isStartButtonEnabled={isStartButtonEnabled} 
                setIsStartButtonEnabled={setIsStartButtonEnabled}
                playersData={playersData}
              />
              
            </div>
      </div>
    </div>
  );
}

export default StartingScreen
