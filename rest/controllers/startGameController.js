// controllers/startGameController.js
const dgram = require('dgram');

const udpSocket = dgram.createSocket('udp4');

udpSocket.bind(() => {
    udpSocket.setBroadcast(true); // Enable broadcast
});

exports.startGame = (req, res) => {
    const gameVariant = req.query.variantCode;

    // Configure the broadcast address and port
    const BROADCAST_ADDRESS = req.query.IpAddress;
    const PORT = req.query.port;

    if (!gameVariant) {
        return res.status(400).json({ error: 'Game variant is required' });
    }

    const message = Buffer.from(`start:${gameVariant}`);

    udpSocket.send(message, 0, message.length, PORT, BROADCAST_ADDRESS, (err) => {
        if (err) {
            console.error('Error sending UDP message:', err);
            return res.status(500).json({ error: 'Failed to send start signal' });
        }
        console.log(`UDP message sent: ${message}`);
        res.status(200).json({ message: `Game started with variant: ${gameVariant}` });
    });
};

exports.getGameStatus = (req, res) => {
    const { gameCode, IpAddress, port } = req.query;

    // Check for required query parameters
    if (!gameCode || !IpAddress || !port) {
        return res.status(400).json({ error: 'Game code, IP address, and port are required' });
    }

    const BROADCAST_ADDRESS = IpAddress;
    const PORT = port;
    const message = Buffer.from(`status:${gameCode}`);

    try {
        // Send the request for game status
        udpSocket.send(message, 0, message.length, PORT, BROADCAST_ADDRESS, (err) => {
            if (err) {
                console.error('Error sending UDP message:', err);
                // Respond with an error but do not stop execution
                return res.status(500).json({ error: 'Failed to send status request' });
            }
            console.log(`UDP status request sent: ${message}`);
        });

        // Listen for the game status response
        udpSocket.once('message', (msg, rinfo) => {
            const receivedMessage = msg.toString();
            console.log(`Received UDP message from ${rinfo.address}:${rinfo.port} - ${receivedMessage}`);

            // Send the received status back to the HTTP client
            res.status(200).json({ status: receivedMessage });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        // Respond with an error but keep the server running
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
};
