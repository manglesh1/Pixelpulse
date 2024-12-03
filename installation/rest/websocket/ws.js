// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('A new client connected');
    ws.on('message', function incoming(message) {
        console.log('Received: %s', message);
        ws.send('Hello! Message received: ' + message);
    });

    ws.on('close', function close() {
        console.log('Client disconnected');
    });

    ws.send('Welcome! You are connected.');
});

console.log('WebSocket server is running on ws://localhost:8080');
