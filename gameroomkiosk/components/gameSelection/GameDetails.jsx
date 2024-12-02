import React, { useEffect, useState } from 'react'

import styles from '../../styles/Home.module.css';
import { fetchGameDataApi, fetchGameStatusApi, fetchHighScoresApiByGameCode, fetchPlayerInfoApi } from '../../services/api';
import ScanningSection from './ScanningScreen';
import StartingScreen from './StartingScreen';

const STEPS = {
  SCANNING: 0,
  SELECTING: 1,
  PLAYING: 2
}

const GameDetails = ({ gameCode }) => {
    const [gameData, setGameData] = useState(null);
    const [step, setStep] = useState(STEPS.SCANNING);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playersData, setPlayersData] = useState([]);
    const [gameStatus, setGameStatus] = useState('');
    const [highScores, setHighScores] = useState(null);
  
    useEffect(() => {
      if (gameCode) { 
        fetchGameData(gameCode);
      }
    }, [gameCode]);
    
    useEffect(() => {
      if (gameCode) {
        fetchHighScores();
      }
    }, [gameCode]);    
  
    useEffect(() => {
      registerGlobalFunctions();
      return () => unregisterGlobalFunctions();
    }, []);
  
    const fetchGameData = async (gameCode) => {
      try {
        const data = await fetchGameDataApi(gameCode);
        setGameData(data);
        if (data[0]?.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    const fetchHighScores = async () => {
      try {
        const data = await fetchHighScoresApiByGameCode(gameCode);
        console.log('High Scores Data:', data); // Debug log to check response
        setHighScores(data); // Update state with the received data
      } catch (error) {
        console.error('Error fetching high scores:', error);
        setError(error);
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
          return updatedPlayers;
        });
      } catch (error) {
        setError(error);
      }
    };

    const registerGlobalFunctions = () => {
      window.receiveMessageFromWPF = (message) => {
        console.log('Received message from WPF:', message);
        fetchPlayerInfo(message);
      };
  
      window.updateStatus = (status) => {
        setGameStatus(status);
        console.log('Received game status from WPF:', status);
        if (gameStatus.toLowerCase().startsWith('running')) {
          setIsStartButtonEnabled(false);
        }
      };
    };
  
    const unregisterGlobalFunctions = () => {
      delete window.receiveMessageFromWPF;
      delete window.updateStatus;
    };
  
    if (loading || !highScores) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;
    if (!gameData) return <p>No data found for game code: {gameCode}</p>;

    if (step === STEPS.SCANNING) {
      return <ScanningSection highScores={highScores} setPlayersData={setPlayersData} playersData={playersData} styles={styles} gameData={gameData} gameStatus={gameStatus} setStep={setStep} />;
    }
    return (
      <StartingScreen highScores={highScores} styles={styles} gameData={gameData} playersData={playersData} gameStatus={gameStatus} setStep={setStep} />
    );
};

export default GameDetails
