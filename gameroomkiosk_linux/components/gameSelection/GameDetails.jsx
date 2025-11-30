import React, { useEffect, useState, useRef } from "react";
import styles from "../../styles/Home.module.css";

import {
  fetchActiveGameDataApi,
  fetchHighScoresApiByGameCode,
  fetchPlayerInfoApi,
  fetchRequireWristbandScanApi,
} from "../../services/api";

import {
  getScannerStatus,
  openScannerLiveSocket,
  getGameStatus,
} from "../../services/controllerApi";

import StartingScreen from "./StartingScreen";

const STEPS = {
  SCANNING: 0,
  SELECTING: 1,
  PLAYING: 2,
};

const GameDetails = ({ gameCode }) => {
  const [gameData, setGameData] = useState(null);
  const [step, setStep] = useState(STEPS.SCANNING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [playersData, setPlayersData] = useState([]);
  const [gameStatus, setGameStatusState] = useState("idle");
  const [highScores, setHighScores] = useState(null);
  const [requireWristbandScan, setRequireWristbandScan] = useState(true);
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(true);

  // for deduping inside WS callback
  const playersRef = useRef(playersData);
  useEffect(() => {
    playersRef.current = playersData;
  }, [playersData]);

  const clearPlayers = () => {
    playersRef.current = [];
    setPlayersData([]);
  };

  // ---- Helpers ----
  const shuffleArray = (array) => {
    if (!array) return array;
    let currentIndex = array.length;
    let randomIndex;

    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  };

  // ---- Load game + highscores ----
  useEffect(() => {
    if (!gameCode) return;

    const load = async () => {
      try {
        const game = await fetchActiveGameDataApi(gameCode);
        if (!game) {
          setError(new Error("No active game data returned"));
          setLoading(false);
          return;
        }

        // old shape was gameData.variants – keep that
        if (Array.isArray(game.variants)) {
          shuffleArray(game.variants);
        }

        setGameData(game);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    };

    load();
  }, [gameCode]);

  useEffect(() => {
    if (!gameCode) return;

    const loadScores = async () => {
      try {
        const scores = await fetchHighScoresApiByGameCode(gameCode);
        setHighScores(scores);
      } catch (err) {
        console.error("Error fetching highscores", err);
      }
    };

    loadScores();
  }, [gameCode]);

  // RequireWristbandScan config (still from your Node API)
  useEffect(() => {
    const loadCfg = async () => {
      try {
        const cfg = await fetchRequireWristbandScanApi();
        if (cfg && typeof cfg.configValue === "string") {
          setRequireWristbandScan(cfg.configValue.toLowerCase() === "yes");
        }
      } catch (err) {
        console.error("Error fetching RequireWristbandScan", err);
      }
    };
    loadCfg();
  }, []);

  // ---- Poll game status from controller ----
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const state = await getGameStatus();
        if (cancelled || !state) return;

        const status = (state.status || "idle").toLowerCase();
        setGameStatusState(status);
        setIsStartButtonEnabled(!status.startsWith("running"));
      } catch (err) {
        console.error("getGameStatus failed", err);
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ---- One-time scanner status check ----
  useEffect(() => {
    const checkScanner = async () => {
      try {
        const s = await getScannerStatus();
        console.log("Scanner status", s);
      } catch (err) {
        console.error("getScannerStatus failed", err);
      }
    };
    checkScanner();
  }, []);

  // ---- Connect to scanner live WebSocket ----
  useEffect(() => {
    const ws = openScannerLiveSocket();

    ws.onopen = () => {
      console.log("[scanner/live] WebSocket opened");
    };

    ws.onmessage = async (evt) => {
      try {
        const status =
          typeof evt.data === "string" ? evt.data : String(evt.data ?? "");

        // Expect formats like:
        //  "READY"
        //  "UID1234:"      (success)
        //  "UID1234:Error message"
        if (!status || status === "READY") {
          return;
        }

        const [uidRaw, resultRaw] = status.split(":");
        const uid = uidRaw?.trim();
        const result = (resultRaw ?? "").trim();

        if (!uid) return;

        // If scanner reports an error for this UID, you can handle it here
        if (result && result.toUpperCase().startsWith("ERROR")) {
          console.warn("Scan error for uid", uid, result);
          return;
        }

        // Dedup – don't add same wristband twice
        if (playersRef.current.some((p) => p.wristbandTranID === uid)) {
          console.log("UID already in players list, skipping", uid);
          return;
        }

        // Look up player info from your existing Node API
        const playerInfo = await fetchPlayerInfoApi(uid);
        if (!playerInfo) return;

        // Shape matches your old pattern { player, remaining, reward, totalScore, ... }
        setPlayersData((prev) => [
          ...prev,
          { ...playerInfo, wristbandTranID: uid },
        ]);
      } catch (err) {
        console.error("scanner/live onmessage error", err);
      }
    };

    ws.onerror = (evt) => {
      console.error("[scanner/live] websocket error", evt);
    };

    ws.onclose = () => {
      console.log("[scanner/live] WebSocket closed");
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, []);

  // ---- render ----
  if (loading || !highScores) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!gameData) return <p>No data found for game code: {gameCode}</p>;

  return (
    <StartingScreen
      highScores={highScores}
      setPlayersData={setPlayersData}
      clearPlayers={clearPlayers}
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
