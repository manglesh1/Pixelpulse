import React from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import GameImage from './GameImage';
import SendMessageToDotnet from '../../tools/util';
const ScanningScreen = ({ highScores, styles, gameData, playersData, gameStatus, setStep }) => {

  const handleCancel = () => {
    SendMessageToDotnet('refresh');
   
  };

  const handleAdmin = (x) => {
   SendMessageToDotnet( x);
  
  };

  const handleFinish = () => {
    if (gameStatus !== 'running' && playersData.length > 0) {
      setStep(2);
    }
  };

  const handImage = `images/count/${playersData.length}-count.svg`;

  return (

    //Admin buttons in the 4 corners
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
    }}
    onClick={() => handleAdmin("Bottom-Right")}
  >
    Bottom Right
  </button>

      {/* ScanningScreen Content */}
      <div className={styles.containerScanning}>
        {/* Left Section: Game Variants */}
        <div className={styles.leftSectionScanning}>
          <Slide easing="ease">
            {gameData.variants.map((variant, index) => (
              <div className={styles.slide} key={index}>
                <GameImage styles={styles} variant={variant} index={index} highScores={highScores} />
              </div>
            ))}
          </Slide>
        </div>

        {/* Right Section: Scanning Interface */}
        <div className={styles.rightSectionScanning}>
          <div className={styles.titleContainer}>
            <h1 className={styles.scanningTitle}>{gameData.gameName || 'GAME NAME'}</h1>
            {playersData.length === 0 && (
              <div className={styles.scanMessage}>Please scan your wristbands!</div>
            )}
          </div>

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
                alt={`${playersData.length} fingers`}
                className={styles.handImage}
              />
            </div>
          )}

          <div className={styles.scanButtons}>
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
            <button
              className={styles.startButton}
              onClick={handleFinish}
              disabled={gameStatus.toLowerCase().startsWith('running') || playersData.length <= 0}
            >
              {playersData.length <= 0
                ? 'Please scan your wristbands'
                : gameStatus.toLowerCase().startsWith('running')
                ? 'Game is still running. Please wait...'
                : 'Finish Scan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanningScreen;
