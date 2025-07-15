import React, { useEffect, useState } from 'react'

import styles from '../../styles/Home.module.css';
//import { fetchGameDataApi, fetchActiveGameDataApi, fetchGameStatusApi, fetchHighScoresApiByGameCode, fetchPlayerInfoApi, fetchRequireWristbandScanApi } from '../../services/api';
//import ScanningSection from './ScanningScreen';
import StartingScreen from './StartingScreen';
//import NumberOfPlayerSelectionScreen from './NumberOfPlayerSelectionScreen';

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
    const [requireWristbandScan, setRequireWristbandScan] = useState(true);
    const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(true);
  

  /*  useEffect(() => {
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
      fetchRequireWristbandScan();
    }, [])
  */
    useEffect(() => {
      registerGlobalFunctions();
       window.chrome.webview.postMessage("webviewLoaded");
      return () => unregisterGlobalFunctions();
    }, []);
  /*
    const fetchGameData = async (gameCode) => {
      try {
        const data = await fetchActiveGameDataApi(gameCode);
        shuffleArray(data.variants);
        setGameData(data);

        if (data[0]?.variants?.length > 0) {
          setSelectedVariant(gameData.variants[0]);
        }
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
*/
    const shuffleArray = (array) => {
      let currentIndex = array.length;
      let randomIndex;

      // While there remain elements to shuffle
      while (currentIndex > 0) {
        // Pick a remaining element
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Swap it with the current element
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex],
          array[currentIndex],
        ];
      }

      return array;
    };
/*
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

    const fetchRequireWristbandScan = async () => {
      try {
        const data = await fetchRequireWristbandScanApi();
        setRequireWristbandScan(data.configValue.toLowerCase()=="yes" ? true : false);
      } catch (error) {
        setError(error);
      }
    }
*/
    const registerGlobalFunctions = () => {
    window.receiveGameDataFromWPF = (payload) => {
       const data = typeof payload === 'string'
      ? JSON.parse(payload)
      : payload;
        shuffleArray(data.variants);
        setGameData(data);

        if (data[0]?.variants?.length > 0) {
          setSelectedVariant(gameData.variants[0]);
        }
        setLoading(false);
    };
    window.receiveHighScoresFromWPF = (payload) => {
       const data = typeof payload === 'string'
      ? JSON.parse(payload)
      : payload;
      setHighScores(data);
    };
    window.receiveRequireWristbandScanFromWPF = (payload) => {
        const data = typeof payload === 'string'
      ? JSON.parse(payload)
      : payload;
       setRequireWristbandScan(data.configValue.toLowerCase()=="yes" ? true : false);
      
    };
    
    window.receiveGameStatusFromWPF = (status) => {
      setGameStatus(status);
      if (status.toLowerCase().startsWith('running')) {
        setIsStartButtonEnabled(false);
      }
    };
     window.receiveMessageFromWPF = (message, playerData) => {
        if(requireWristbandScan) {
           if (playersData.some((player) => player.wristbandTranID === message)) {
            console.log('Scanning is finished or Wristband already tapped.');
            return;
          }
          const data = typeof playerData === 'string'
          ? JSON.parse(playerData)
          : payload;

          console.log(playerData);
          console.log('Received message from WPF:', message);
           setPlayersData((prevPlayers) => {
          const updatedPlayers = [...prevPlayers, { ...data, message }];
          return updatedPlayers;
        });

        }
      };
  
      window.updateStatus = (status) => {
        setGameStatus(status);
        console.log('Received game status from WPF:', status);
        if (gameStatus.toLowerCase().startsWith('running')) {
          setIsStartButtonEnabled(false);
        }
      };

      window.cleanPlayers =() => {
         setPlayersData((prevPlayers) => {
          const updatedPlayers = [];
          return updatedPlayers;
        });
      };
  };



  const unregisterGlobalFunctions = () => {
    delete window.receiveGameDataFromWPF;
    delete window.receiveHighScoresFromWPF;
    delete window.receiveRequireWristbandScanFromWPF;
    delete window.receivePlayersDataFromWPF;
    delete window.receiveGameStatusFromWPF;
    delete window.receiveMessageFromWPF;
    delete window.updateStatus;
    delete window.cleanPlayers;
  };
  
  
  
    if (loading || !highScores) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;
    if (!gameData) return <p>No data found for game code: {gameCode}</p>;

    // if (step === STEPS.SCANNING) {
    //   if(!requireWristbandScan) {
    //     return <NumberOfPlayerSelectionScreen highScores={highScores} setPlayersData={setPlayersData} playersData={playersData} styles={styles} gameData={gameData} gameStatus={gameStatus} setStep={setStep} isStartButtonEnabled={isStartButtonEnabled} setIsStartButtonEnabled={setIsStartButtonEnabled} />
    //   }
    //  return <ScanningSection highScores={highScores} setPlayersData={setPlayersData} playersData={playersData} styles={styles} gameData={gameData} gameStatus={gameStatus} setStep={setStep} />;
    // }
    return (
      <StartingScreen highScores={highScores} setPlayersData={setPlayersData} playersData={playersData} styles={styles} gameData={gameData} gameStatus={gameStatus} setStep={setStep} isStartButtonEnabled={isStartButtonEnabled} setIsStartButtonEnabled={setIsStartButtonEnabled} />
    );
};

export default GameDetails
