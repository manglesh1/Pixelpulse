import React, { useEffect, useState } from 'react'

import styles from '../../styles/Home.module.css';
import GameSelection from './GameSelection';
import PlayersInfo from './PlayersInfo';
import { fetchGameDataApi, fetchGameStatusApi, fetchHighScoresApi, fetchPlayerInfoApi } from '../../services/api';
import ImageSection from './ImageSection';
import GameInstructions from './GameInstructions';
import LoaderSection from './LoaderSection';

const GameDetails = ({ gameCode }) => {
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playersData, setPlayersData] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(false);
    const [gameStatus, setGameStatus] = useState('');
    const [isCardScanned, setIsCardScanned] = useState(false);
  
    useEffect(() => {
      if (gameCode) {
        fetchGameData(gameCode);
      }
    }, [gameCode]);
  
    useEffect(() => {
      if (isCardScanned) {
        const intervalId = setInterval(fetchGameStatus, 1000);
        return () => clearInterval(intervalId);
      }
    }, [isCardScanned, gameCode, gameData]);
  
    useEffect(() => {
      registerGlobalFunctions();
      return () => unregisterGlobalFunctions();
    }, []);
  
    const fetchGameData = async (gameCode) => {
      try {
        const data = await fetchGameDataApi(gameCode);
        setGameData(data);
        if (data[0]?.variants?.length > 0) {
          setSelectedVariant(data[0].variants[0]);
        }
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
  
    const fetchGameStatus = async () => {
      if (gameData && gameData.IpAddress && gameData.LocalPort) {
        try {
          const data = await fetchGameStatusApi(gameCode, gameData);
          setGameStatus(data.status);
          if (data.status === 'Running') {
            setIsStartButtonEnabled(false);
          }
        } catch (error) {
          console.error('Error fetching game status:', error);
        }
      }
    };
  
    const fetchPlayerInfo = async (wristbandTranID) => {
      if (playersData.some((player) => player.wristbandTranID === wristbandTranID)) {
        console.log('Scanning is finished or Wristband already tapped.');
        return;
      }
    
      try {
        const data = await fetchPlayerInfoApi(wristbandTranID);
        setPlayersData((prevPlayers) => {
          const updatedPlayers = [...prevPlayers, { ...data, wristbandTranID }];
          if (updatedPlayers.length > 0) {
            setIsStartButtonEnabled(true);
            setIsCardScanned(true);
          }
          return updatedPlayers;
        });
      } catch (error) {
        setError(error);
      }
    };
  
    const handleVariantClick = (variant) => {
      setSelectedVariant(variant);
    };
  
    const handleStartButtonClick = () => {
      if (window.chrome && window.chrome.webview) {
        const message = `start:${selectedVariant.name}:${playersData.length}:${selectedVariant.GameType}`;
        window.chrome.webview.postMessage(message);
      } else {
        console.log('WebView2 is not available');
      }
      setIsStartButtonEnabled(false); // Disable the start button
    };
  
    const registerGlobalFunctions = () => {
      window.receiveMessageFromWPF = (message) => {
        console.log('Received message from WPF:', message);
        fetchPlayerInfo(message);
      };
  
      window.updateStatus = (status) => {
        setGameStatus(status);
        if (status !== 'Running') {
          setIsStartButtonEnabled(false);
        }
      };
    };
  
    const unregisterGlobalFunctions = () => {
      delete window.receiveMessageFromWPF;
      delete window.updateStatus;
    };
  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;
    if (!gameData) return <p>No data found for game code: {gameCode}</p>;
  
    return (
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.leftUpperSection}>
            <h1 className={styles.sectionTitle}>{gameData.gameName}</h1>
            <p>{gameData.gameDescription}</p>
            <GameSelection styles={styles} gameData={gameData} selectedVariant={selectedVariant} handleVariantClick={handleVariantClick} />
          </div>
          <div className={styles.leftLowerSection}>
            <PlayersInfo styles={styles} playersData={playersData} />
            <button
              className={styles.startButton}
              onClick={handleStartButtonClick}
              disabled={!isStartButtonEnabled || !selectedVariant || gameStatus === 'Running'}
            >
              START
            </button>
          </div>
        </div>
        <div classname={styles.rightSection}>
          {(playersData.length===0 || playersData===undefined || selectedVariant===undefined || selectedVariant===null) && (
            <LoaderSection playersData={playersData} selectedVariant={selectedVariant} styles={styles} />
          )}
          {playersData.length!==0 && playersData!==undefined && selectedVariant!==undefined && selectedVariant!==null && (
            <ImageSection styles={styles} altText={`${selectedVariant?.name} image`} imageUrl={`/images/gameImages/${selectedVariant?.name}.jpg`} />
          )}
          <GameInstructions styles={styles} instruction={selectedVariant?.instructions ?? ""} />
        </div>
      </div>
    );
};

export default GameDetails
