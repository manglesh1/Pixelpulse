import React, { useEffect, useRef, useState } from "react";
import {
  connectWebSocket,
  SendMessageToDotnet,
  isWebSocketReady,
} from "../../tools/util";

import styles from "../../styles/Home.module.css";
import StartingScreen from "./StartingScreen";
import AttractScreen from "./AttractScreen";

const STEPS = {
  SCANNING: 0,
  SELECTING: 1,
  PLAYING: 2,
};

const VIEWS = {
  ATTRACT: 0,
  MAIN: 1,
};

const IDLE_MS = 60000; // 60 seconds

const GameDetails = ({ gameCode }) => {
  const [gameData, setGameData] = useState(null);
  const [step, setStep] = useState(STEPS.SCANNING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playersData, setPlayersData] = useState([]);
  const [gameStatus, setGameStatus] = useState("");
  const [highScores, setHighScores] = useState(null);
  const [requireWristbandScan, setRequireWristbandScan] = useState(true);
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(true);
  const [view, setView] = useState(VIEWS.ATTRACT);

  const idleTimerRef = useRef(null);
  const viewRef = useRef(view);
  const playersRef = useRef(playersData);
  const requireScanRef = useRef(requireWristbandScan);

  const statusRef = useRef(gameStatus);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    playersRef.current = playersData;
  }, [playersData]);

  useEffect(() => {
    requireScanRef.current = requireWristbandScan;
  }, [requireWristbandScan]);

  useEffect(() => {
    statusRef.current = gameStatus;
  }, [gameStatus]);

  /* -------------------- Idle Handling -------------------- */

  const clearIdle = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const armIdle = () => {
    clearIdle();
    idleTimerRef.current = setTimeout(() => {
      setView(VIEWS.ATTRACT);
    }, IDLE_MS);
  };

  const resetIdle = () => {
    if (viewRef.current !== VIEWS.MAIN) return;
    armIdle();
  };

  useEffect(() => {
    clearIdle();

    if (view !== VIEWS.MAIN) return;

    const onActivity = () => resetIdle();

    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("pointermove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);

    armIdle();

    return () => {
      clearIdle();
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
    };
  }, [view]);

  /* -------------------- WebSocket -------------------- */

  useEffect(() => {
    connectWebSocket();
  }, []);

  useEffect(() => {
    registerGlobalFunctions();

    function waitAndSendLoaded() {
      if (isWebSocketReady()) {
        SendMessageToDotnet("webviewLoaded");
      } else {
        setTimeout(waitAndSendLoaded, 200);
      }
    }

    waitAndSendLoaded();

    return () => unregisterGlobalFunctions();
    // eslint-disable-next-line
  }, []);

  const shuffleArray = (array) => {
    let currentIndex = array.length;
    while (currentIndex > 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  };

  /* -------------------- Force ATTRACT When Running -------------------- */

  useEffect(() => {
    const running = (gameStatus || "").toLowerCase().startsWith("running");
    if (running && viewRef.current !== VIEWS.ATTRACT) {
      setView(VIEWS.ATTRACT);
    }
  }, [gameStatus]);

  /* -------------------- Global Functions -------------------- */

  const registerGlobalFunctions = () => {
    window.receiveGameDataFromWPF = (payload) => {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;

      if (data?.variants?.length) {
        shuffleArray(data.variants);
      }

      setGameData(data);
      setLoading(false);
    };

    window.receiveHighScoresFromWPF = (payload) => {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;
      setHighScores(data);
    };

    window.receiveRequireWristbandScanFromWPF = (payload) => {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;
      setRequireWristbandScan(data?.configValue?.toLowerCase() === "yes");
    };

    window.receiveGameStatusFromWPF = (status) => {
      setGameStatus(status);
      if ((status || "").toLowerCase().startsWith("running")) {
        setIsStartButtonEnabled(false);
      }
    };

    window.receiveMessageFromWPF = (message, playerData) => {
      resetIdle();

      const running = (statusRef.current || "")
        .toLowerCase()
        .startsWith("running");

      if (!running && viewRef.current === VIEWS.ATTRACT) {
        setView(VIEWS.MAIN);
      }

      if (!requireScanRef.current) return;

      if (playersRef.current.some((p) => p.wristbandTranID === message)) {
        return;
      }

      const data =
        typeof playerData === "string" ? JSON.parse(playerData) : playerData;

      setPlayersData((prev) => [
        ...prev,
        { ...data, wristbandTranID: message },
      ]);
    };

    window.updateStatus = (status) => {
      //resetIdle();
      setGameStatus(status);

      if ((status || "").toLowerCase().startsWith("running")) {
        setIsStartButtonEnabled(false);
      }
    };

    window.cleanPlayers = () => {
      resetIdle();
      setPlayersData([]);
    };
  };

  const unregisterGlobalFunctions = () => {
    delete window.receiveGameDataFromWPF;
    delete window.receiveHighScoresFromWPF;
    delete window.receiveRequireWristbandScanFromWPF;
    delete window.receiveGameStatusFromWPF;
    delete window.receiveMessageFromWPF;
    delete window.updateStatus;
    delete window.cleanPlayers;
  };

  /* -------------------- RENDER -------------------- */

  if (view === VIEWS.ATTRACT) {
    return (
      <AttractScreen
        gameCode={gameCode}
        gameStatus={gameStatus}
        onEnter={() => setView(VIEWS.MAIN)}
      />
    );
  }

  if (loading || !highScores) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!gameData) return <p>No data found for game code: {gameCode}</p>;

  return (
    <StartingScreen
      highScores={highScores}
      setPlayersData={setPlayersData}
      playersData={playersData}
      styles={styles}
      gameData={gameData}
      gameStatus={gameStatus}
      setStep={setStep}
      isStartButtonEnabled={isStartButtonEnabled}
      setIsStartButtonEnabled={setIsStartButtonEnabled}
    />
  );
};

export default GameDetails;
