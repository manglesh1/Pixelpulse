import React, { useEffect, useState } from 'react'

import styles from '../styles/Home.module.css';
import GameSelection from '../components/GameSelection';
import HighScores from '../components/HighScores';
import PlayersInfo from '../components/PlayersInfo';
import ModalDialog from './ModalDialog';
import { fetchGameDataApi, fetchGameStatusApi, fetchHighScoresApi, fetchPlayerInfoApi } from '../services/api';

const GameDetails = ({ gameCode }) => {
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playersData, setPlayersData] = useState([]);
    const [highScores, setHighScores] = useState({ today: 0, last90Days: 0, last360Days: 0 });
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(false);
    const [gameStatus, setGameStatus] = useState('');
    const [isCardScanned, setIsCardScanned] = useState(false);
    const [scanningFinished, setScanningFinished] = useState(false);
  
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
      fetchHighScores();
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
  
    const fetchHighScores = async () => {
      try {
        const data = await fetchHighScoresApi();
        setHighScores({
          today: data.highestToday || 0,
          last90Days: data.highest90Days || 0,
          last360Days: data.highest360Days || 0,
        });
      } catch (error) {
        setError(error);
      }
    };
  
    const fetchPlayerInfo = async (wristbandTranID) => {
      if (scanningFinished || playersData.some((player) => player.wristbandTranID === wristbandTranID)) {
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
  
    const handleFinishScan = () => {
      setScanningFinished(true);
      setIsStartButtonEnabled(true);
    };
  
    const handleVariantClick = (variant) => {
      setSelectedVariant(variant);
      setIsModalOpen(true);
    };
  
    const closeModal = () => {
      setIsModalOpen(false);
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
          <h1 className={styles.sectionTitle}>{gameData.gameName}</h1>
          <p>{gameData.gameDescription}</p>
          <PlayersInfo styles={styles} playersData={playersData} />
          <HighScores styles={styles} highScores={highScores} />
        </div>
        <div className={styles.rightSection}>
          <h2 className={styles.sectionTitle}>Game Selection</h2>
          <GameSelection styles={styles} gameData={gameData} selectedVariant={selectedVariant} handleVariantClick={handleVariantClick} />
          <button
            className={styles.startButton}
            onClick={handleStartButtonClick}
            disabled={!isStartButtonEnabled || !selectedVariant || gameStatus === 'Running'}
          >
            {gameStatus === 'Running' ? 'PLEASE WAIT UNTIL THE GAME ENDS' : 'START'}
          </button>
        </div>
        {isModalOpen && selectedVariant && (
            <ModalDialog styles={styles} closeModal={closeModal} selectedVariant={selectedVariant} />
        )}
  
      </div>
    );
};

export default GameDetails
