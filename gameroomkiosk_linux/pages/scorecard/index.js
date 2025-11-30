import React, { useEffect, useState } from "react";
import CompScoreCardScreen from "../../components/scoreCard/CompScoreCardScreen";
import MultiScoreCardScreen from "../../components/scoreCard/MultiScoreCardScreen";

const GameScreen = () => {
  const [gameType, setGameType] = useState("multi"); // comp | multi
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [timer, setTimer] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(1);
  const [hideTimer, setHideTimer] = useState(false);

  // Connect to backend WebSocket
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      const wsUrl =
        (
          process.env.NEXT_PUBLIC_CONTROLLER_URL || "http://localhost:5005"
        ).replace("http", "ws") + "/scores/live";

      console.log("Connecting to WS:", wsUrl);

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✓ Connected to /scores/live");
      };

      ws.onmessage = (event) => {
        const msg = event.data;
        console.log("Score WS →", msg);

        // Parse incoming JSON
        try {
          const data = JSON.parse(msg);

          if (data.gameType) setGameType(data.gameType);
          if (data.players) setPlayers(data.players);
          if (data.scores) setScores(data.scores);
          if (data.timerMs !== undefined) setTimer(data.timerMs);
          if (data.lives !== undefined) setLives(data.lives);
          if (data.level !== undefined) setLevel(data.level);
          if (data.hideTimer !== undefined) setHideTimer(data.hideTimer);
        } catch (err) {
          console.error("Invalid WS message:", msg);
        }
      };

      ws.onclose = () => {
        console.warn("WS closed. Reconnecting in 2s...");
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <>
      {gameType === "comp" && (
        <CompScoreCardScreen
          styles={require("./gameScreen.module.css")}
          score={scores[0] || 0}
          lives={lives}
          level={level}
          timer={timer}
          hideTimer={hideTimer}
        />
      )}

      {gameType === "multi" && (
        <MultiScoreCardScreen
          styles={require("./gameScreen.module.css")}
          players={players}
          scores={scores}
          lives={lives}
          level={level}
          timer={timer}
          hideTimer={hideTimer}
        />
      )}
    </>
  );
};

export default GameScreen;
