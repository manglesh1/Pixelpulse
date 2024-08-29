import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

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

  const API_BASE_URL = 'http://szstc-srvr:8080/api';

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
      const response = await fetch(`${API_BASE_URL}/game/findByGameCode/?gameCode=${gameCode}`);
      if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);
      const data = await response.json();
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
        const response = await fetch(
          `${API_BASE_URL}/game-status?gameCode=${encodeURIComponent(gameCode)}&IpAddress=${encodeURIComponent(gameData.IpAddress)}&port=${encodeURIComponent(gameData.LocalPort)}`
        );
        const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/stats/highestScores`);
      if (!response.ok) throw new Error(`Error fetching high scores: ${response.statusText}`);
      const data = await response.json();
      setHighScores({
        today: data.highestToday || 0,
        last90Days: data.highest90Days || 0,
        last360Days: data.highestAllTime || 0,
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
      const response = await fetch(`${API_BASE_URL}/wristbandtran/getplaysummary?wristbanduid=${wristbandTranID}`);
      if (!response.ok) throw new Error(`Error fetching player data: ${response.statusText}`);
      const data = await response.json();
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
      const message = `start:${selectedVariant.name}:${playersData.length}`;
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
        <div className={styles.scoreTable}>
          <div className={styles.tableRow}>
            <div>Player Name</div>
            <div>Time Left</div>
            <div>High Score</div>
            <div>Team Reward</div>
          </div>
          {playersData.map((playerInfo, index) => (
            <div key={index} className={styles.tableRow}>
              <div>{playerInfo.player.FirstName} {playerInfo.player.LastName}</div>
              <div>{playerInfo.timeleft}</div>
              <div>{playerInfo.totalScore}</div>
              <div>{playerInfo.reward}</div>
            </div>
          ))}
        </div>
        <div className={styles.highScores}>
          <h3>High Scores</h3>
          <div className={styles.scoreCategories}>
            <div className={styles.scoreBox}>
              <div className={styles.scoreTitle}>Today</div>
              <div className={styles.scoreValue}>{highScores.today}</div>
            </div>
            <div className={styles.scoreBox}>
              <div className={styles.scoreTitle}>90 Days</div>
              <div className={styles.scoreValue}>{highScores.last90Days}</div>
            </div>
            <div className={styles.scoreBox}>
              <div className={styles.scoreTitle}>360 Days</div>
              <div className={styles.scoreValue}>{highScores.last360Days}</div>
            </div>
          </div>
          <button className={styles.finishScanButton} onClick={handleFinishScan}>
            Finish Scan
          </button>
        </div>
      </div>
      <div className={styles.rightSection}>
        <h2 className={styles.sectionTitle}>Game Selection</h2>
        <div className={styles.gameOptions}>
          {gameData.variants.map((variant) => (
            <div
              key={variant.ID}
              className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
              onClick={() => handleVariantClick(variant)}
            >
              {variant.name}
            </div>
          ))}
        </div>
        <div className={styles.levelSelector}>
          <h3>Level</h3>
          <div className={styles.levelDots}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
        <button
          className={styles.startButton}
          onClick={handleStartButtonClick}
          disabled={!isStartButtonEnabled || !selectedVariant || gameStatus === 'Running'}
        >
          {gameStatus === 'Running' ? 'PLEASE WAIT UNTIL THE GAME ENDS' : 'START'}
        </button>
      </div>
      {isModalOpen && selectedVariant && (
		<div className={styles.modal}>
			<div className={styles.modalContent}>
			  <button className={styles.closeButton} onClick={closeModal}>X</button>
			  <h2>{selectedVariant.name}</h2>
			  <div dangerouslySetInnerHTML={{ __html: selectedVariant.instructions }} />
			</div>
		  </div>
		)}

    </div>
  );
};

const Home = () => {
  const router = useRouter();
  const { gameCode } = router.query;

  return <GameDetails gameCode={gameCode} />;
};

export default Home;
