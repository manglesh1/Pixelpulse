import React, { useState } from 'react'
import GameImage from './GameImage';
import GameSelection from './GameSelection';
import GameStarting from './GameStarting';

const StartingScreen = ({ highScores, styles, gameData, playersData, gameStatus, isStartButtonEnabled, setIsStartButtonEnabled }) => {
  //const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(gameData.variants[0]);
  const [starting, setStarting] = useState(false);
  const [doorCloseTime, setDoorCloseTime] = useState(0);
  const handleVariantClick = (variant) => {
        setSelectedVariant(variant);
    };
  const handleAdmin = (x) => {
    if (window.chrome && window.chrome.webview) {
      console.log("Sent " + x)
      window.chrome.webview.postMessage(x);
    } else {
      console.log('WebView2 is not available');
    }
  };
  return (
    <>
      <button
  style={{
    position: "absolute",
    top: "10px",
    left: "10px",
    padding: "10px 20px",
    width: "200px",
    height: "100px",
    backgroundColor: "transparent",
    color: "transparent", 
    border: "1px solid transparent", 
    borderRadius: "5px",
    cursor: "pointer",
  }}
  onClick={() => handleAdmin("Top-Left")}
  >
    Top Left
  </button>
  <button
  style={{
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "10px 20px",
    width: "200px",
    height: "100px",
    backgroundColor: "transparent", 
    color: "transparent", 
    border: "1px solid transparent", 
    borderRadius: "5px",
    cursor: "pointer",
    zIndex: 999
  }}
  onClick={() => handleAdmin("Top-Right")}
  >
  Top Right
  </button>
  <button
    style={{
      position: "absolute",
      bottom: "10px",
      left: "10px",
      width: "200px",
      height: "100px",
      padding: "10px 20px",
      backgroundColor: "transparent",
      color: "transparent",
      border: "1px solid transparent",
      borderRadius: "5px",
      cursor: "pointer",
    }}
    onClick={() => handleAdmin("Bottom-Left")}
  >
    Bottom Left
  </button>
  <button
    style={{
      position: "absolute",
      bottom: "10px",
      right: "10px",
      width: "200px",
     height: "100px",
      padding: "10px 20px",
      backgroundColor: "transparent",
      color: "transparent", 
      border: "1px solid transparent", 
      borderRadius: "5px",
      cursor: "pointer",
      zIndex: 999
    }}
    onClick={() => handleAdmin("Bottom-Right")}
  >
    Bottom Right
  </button>
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
              {starting 
              ? (<GameStarting styles={styles} doorCloseTime={doorCloseTime}/>) 
              : (<GameImage 
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
              />)}
              
            </div>
      </div>
    </div>
    </>
    
  );
}

export default StartingScreen
