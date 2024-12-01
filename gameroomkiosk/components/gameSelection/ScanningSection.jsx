import React from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import GameImage from './GameImage';

const ScanningSection = ({ highScores, styles, gameData, playersData, gameStatus, setStep }) => {

  const handleCancel = () => {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage("refresh");
    } else {
      console.log('WebView2 is not available');
    }
  };

  const handleFinish = () => {
    if (gameStatus !== 'running' && playersData.length > 0) {
      setStep(2);
    }
  };

  const handImage = `images/count/${playersData.length}-count.svg`;

  return (
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
            disabled={gameStatus === 'running' || playersData.length <= 0}
          >
            {playersData.length <= 0
              ? 'Please scan your wristbands'
              : gameStatus === 'running'
              ? 'Game is still running'
              : 'Finish Scan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanningSection;
