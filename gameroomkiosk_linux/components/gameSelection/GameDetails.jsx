import React, { useEffect, useRef, useState } from "react";
import {
  connectWebSocket,
  SendMessageToDotnet,
  isWebSocketReady,
} from "../../tools/util";
import {
  fetchActiveGameDataApi,
  fetchHighScoresApiByGameCode,
} from "../../services/api";

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

  /* -------------------- View Transitions --------------------
     Intentionally no longer forces ATTRACT when a game starts
     running. Users (and wristband scans during a running game)
     can still open the selection screen to read game info; the
     Start button on that screen is disabled with a BUSY label
     while a game is in progress. */

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

    // Set by the launcher from Location.config["hasWristbandScanner"].
    // When false (e.g. Windsor TileHunt/HexaQuest), we skip the wristband
    // flow entirely and show the Number-of-Players selection screen.
    window.setWristbandScannerAvailable = (hasScanner) => {
      setRequireWristbandScan(!!hasScanner);
    };

    window.receiveGameStatusFromWPF = (status) => {
      setGameStatus(status);
      if ((status || "").toLowerCase().startsWith("running")) {
        setIsStartButtonEnabled(false);
      }
    };

    window.receiveMessageFromWPF = (message, playerData) => {
      resetIdle();

      // Flip ATTRACT → MAIN only when the selection screen can actually
      // render. If we switch to MAIN before gameData/highScores arrive,
      // the "Loading..." fallback has no corner admin buttons and locks
      // the user out. Stay on AttractScreen (which has corner buttons)
      // until the selection page is ready.
      const dataReady = !!gameData && !!highScores;
      if (dataReady && viewRef.current === VIEWS.ATTRACT) {
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
    delete window.setWristbandScannerAvailable;
    delete window.receiveGameStatusFromWPF;
    delete window.receiveMessageFromWPF;
    delete window.updateStatus;
    delete window.cleanPlayers;
  };

  /* -------------------- Enter Handler -------------------- */

  const handleEnter = async () => {
    setView(VIEWS.MAIN);

    // If C# hasn't pushed data yet (e.g. WS initialisation race on Linux),
    // fetch directly from the API so the user is never stuck on "Loading...".
    if ((loading || !highScores) && gameCode) {
      try {
        const [gameDataResult, scoresResult] = await Promise.all([
          fetchActiveGameDataApi(gameCode),
          fetchHighScoresApiByGameCode(gameCode),
        ]);

        if (gameDataResult) {
          if (gameDataResult?.variants?.length) {
            shuffleArray(gameDataResult.variants);
          }
          setGameData(gameDataResult);
          setLoading(false);
        }

        if (scoresResult) {
          setHighScores(scoresResult);
        }
      } catch (err) {
        console.error("GameDetails: direct fetch on enter failed:", err);
      }
    }
  };

  /* -------------------- RENDER -------------------- */

  if (view === VIEWS.ATTRACT) {
    return (
      <AttractScreen
        gameCode={gameCode}
        gameStatus={gameStatus}
        onEnter={handleEnter}
      />
    );
  }

  // Corner admin buttons on fallback screens so the operator is never
  // locked out (F12 admin menu is the recovery path for stuck kiosks).
  const adminCornerButtons = (
    <>
      {["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"].map((pos) => {
        const [v, h] = pos.split("-");
        const posStyle = {
          position: "absolute",
          [v.toLowerCase()]: "10px",
          [h.toLowerCase()]: "10px",
          width: "200px",
          height: "100px",
          padding: "10px 20px",
          backgroundColor: "transparent",
          color: "transparent",
          border: "1px solid transparent",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 999,
        };
        return (
          <button key={pos} style={posStyle}
                  onClick={() => SendMessageToDotnet(pos)}>
            {pos}
          </button>
        );
      })}
    </>
  );

  const fallback = (msg) => (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {adminCornerButtons}
      <p style={{ padding: 20 }}>{msg}</p>
    </div>
  );

  if (loading || !highScores) return fallback("Loading...");
  if (error) return fallback(`Error: ${error.message}`);
  if (!gameData) return fallback(`No data found for game code: ${gameCode}`);

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
      requireWristbandScan={requireWristbandScan}
      goToAttract={() => setView(VIEWS.ATTRACT)}
    />
  );
};

export default GameDetails;
