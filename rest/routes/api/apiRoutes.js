const { Router } = require('express');
const router = Router();
const retryMiddleware = require('../../middlewares/retryMiddleware'); // Import the retry middleware

// Import controllers
const gameroomTypeController = require('../../controllers/gameroomTypeController');
const notificationController = require('../../controllers/notificationController');
const playerScoreController = require('../../controllers/playerScoreController');
const playerController = require('../../controllers/playerController');
const gameController = require('../../controllers/gameController');
const gamesVariantController = require('../../controllers/gamesVariantController');
const configController = require('../../controllers/configController');
const WristbandTranController = require('../../controllers/WristbandTranController');
const statsController = require('../../controllers/statsController');
const startGameController = require('../../controllers/startGameController');
const gameRoomDeviceController = require('../../controllers/gameRoomDevicesController');
const smartDeviceController = require('../../controllers/smartDevicesController');

// GameroomType routes
router.post('/gameroomType/create', retryMiddleware(gameroomTypeController.create));
router.get('/gameroomType/findAll', retryMiddleware(gameroomTypeController.findAll));
router.get('/gameroomType/:id', retryMiddleware(gameroomTypeController.findOne));
router.put('/gameroomType/:id', retryMiddleware(gameroomTypeController.update));
router.delete('/gameroomType/:id', retryMiddleware(gameroomTypeController.delete));

// Notification routes
router.post('/notification/create', retryMiddleware(notificationController.create));
router.get('/notification/findAll', retryMiddleware(notificationController.findAll));
router.get('/notification/:id', retryMiddleware(notificationController.findOne));
router.put('/notification/:id', retryMiddleware(notificationController.update));
router.delete('/notification/:id', retryMiddleware(notificationController.delete));

// PlayerScore routes
router.get('/playerScore/topAllTime', retryMiddleware(playerScoreController.getTopAllTime));
router.get('/playerScore/topRecent', retryMiddleware(playerScoreController.getTopRecent));
router.post('/playerScore/addPlayerScores', retryMiddleware(playerScoreController.addPlayerScores));
router.post('/playerScore/create', retryMiddleware(playerScoreController.create));
router.get('/playerScore/findAll', retryMiddleware(playerScoreController.findAll));
router.get('/playerScore/:id', retryMiddleware(playerScoreController.findOne));
router.put('/playerScore/:id', retryMiddleware(playerScoreController.update));
router.delete('/playerScore/:id', retryMiddleware(playerScoreController.delete));
router.get('/playerScore/getTopScoresForVariants/:gameCode', retryMiddleware(playerScoreController.getTopScoresForVariants));
router.get('/playerScore/getTopScoreForPlayer/:gamesVariantId/:playerId', retryMiddleware(playerScoreController.getTopScoresForPlayerinGameVariant));
router.get('/playerScore/allForVariant/:gamesVariantId', retryMiddleware(playerScoreController.getAllScoresForVariant));

// Player routes
router.post('/player/create', retryMiddleware(playerController.create));
router.get('/player/findAll', retryMiddleware(playerController.findAll));
router.get('/player/:id', retryMiddleware(playerController.findOne));
router.put('/player/:id', retryMiddleware(playerController.update));
router.delete('/player/:id', retryMiddleware(playerController.delete));

// Game routes
router.post('/game/create', retryMiddleware(gameController.create));
router.get('/game/findAll', retryMiddleware(gameController.findAll));
router.get('/game/findByGameCode', retryMiddleware(gameController.findByGameCode));
router.get('/game/findActiveGamesByGameCode', retryMiddleware(gameController.findActiveGamesByGameCode));
router.get('/game/:GameID', retryMiddleware(gameController.findOne));
router.put('/game/:GameID', retryMiddleware(gameController.update));
router.delete('/game/:GameID', retryMiddleware(gameController.delete));

// GamesVariant routes
router.post('/gamesVariant/create', retryMiddleware(gamesVariantController.create));
router.get('/gamesVariant/findAll', retryMiddleware(gamesVariantController.findAll));
router.get('/gamesVariant/:id', retryMiddleware(gamesVariantController.findOne));
router.put('/gamesVariant/:id', retryMiddleware(gamesVariantController.update));
router.delete('/gamesVariant/:id', retryMiddleware(gamesVariantController.delete));

// GameRoomDevice routes
router.post('/devices/create', retryMiddleware(gameRoomDeviceController.create));
router.get('/devices', retryMiddleware(gameRoomDeviceController.findAll));
router.get('/devices/:id', retryMiddleware(gameRoomDeviceController.findOne));
router.get('/devices/deviceId/:deviceId', retryMiddleware(gameRoomDeviceController.findByDeviceId));
router.put('/devices/:id', retryMiddleware(gameRoomDeviceController.update));
router.delete('/devices/:id', retryMiddleware(gameRoomDeviceController.delete));

// Config routes
router.post('/config/create', retryMiddleware(configController.create));
router.get('/config/findAll', retryMiddleware(configController.findAll));
router.get('/config/:id', retryMiddleware(configController.findOne));
router.get('/config', retryMiddleware(configController.findByConfigKey));
router.put('/config/:id', retryMiddleware(configController.update));
router.delete('/config/:id', retryMiddleware(configController.delete));

// WristbandTran routes
router.post('/wristbandtran/create', retryMiddleware(WristbandTranController.create));
router.get('/wristbandtran/findAll', retryMiddleware(WristbandTranController.findAll));
router.get('/wristbandtran/getplaysummary', retryMiddleware(WristbandTranController.getPlaySummary));
router.get('/wristbandtran', retryMiddleware(WristbandTranController.findOne));
router.put('/wristbandtran', retryMiddleware(WristbandTranController.update));
router.delete('/wristbandtran/:id', retryMiddleware(WristbandTranController.delete));
router.get('/wristbandtran/validate', retryMiddleware(WristbandTranController.validate));
router.get('/wristbandtran/validatePlayer', retryMiddleware(WristbandTranController.validatePlayer));

// Stats routes
router.get('/stats/highestScores', retryMiddleware(statsController.getHighestScores));

// Start game routes
router.get('/start-game', retryMiddleware(startGameController.startGame));
router.get('/game-status', retryMiddleware(startGameController.getGameStatus));

// smart devices routes
router.get('/smartDevices', retryMiddleware(smartDeviceController.findAll));
router.get('/smartDevices/set', retryMiddleware(smartDeviceController.setStatus));
router.get('/smartDevices/get', retryMiddleware(smartDeviceController.getStatus));

module.exports = router;