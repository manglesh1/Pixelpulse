let ws = null;
let queue = [];

export function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket("ws://127.0.0.1:8181");

  ws.onopen = () => {
    console.log("WS connected");

    // Flush queued messages
    queue.forEach((m) => ws.send(m));
    queue = [];
  };

  ws.onmessage = (msg) => {
    console.log("C# → JS:", msg.data);
    try {
      const parsed = JSON.parse(msg.data);
      if (parsed.type === "script" && parsed.script) {
        // eslint-disable-next-line no-eval
        eval(parsed.script);
      }
    } catch (e) {
      console.error("WS message error:", e);
    }
  };

  ws.onerror = (err) => console.error("WS error:", err);

  ws.onclose = () => {
    console.log("WS closed, retrying...");
    setTimeout(connectWebSocket, 500);
  };
}

export function SendMessageToDotnet(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(msg);
  } else {
    console.warn("WS not ready, queueing:", msg);
    queue.push(msg);
  }
}

export function isWebSocketReady() {
  return ws && ws.readyState === WebSocket.OPEN;
}
