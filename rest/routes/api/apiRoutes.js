const { Router } = require('express');
const router = Router();

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
// GameroomType routes
router.post('/gameroomType/create', gameroomTypeController.create);
router.get('/gameroomType/findAll', gameroomTypeController.findAll);
router.get('/gameroomType/:id', gameroomTypeController.findOne);
router.put('/gameroomType/:id', gameroomTypeController.update);
router.delete('/gameroomType/:id', gameroomTypeController.delete);

// Notification routes
router.post('/notification/create', notificationController.create);
router.get('/notification/findAll', notificationController.findAll);
router.get('/notification/:id', notificationController.findOne);
router.put('/notification/:id', notificationController.update);
router.delete('/notification/:id', notificationController.delete);

// PlayerScore routes
router.post('/playerScore/addPlayerScores', playerScoreController.addPlayerScores);
router.post('/playerScore/create', playerScoreController.create);
router.get('/playerScore/findAll', playerScoreController.findAll);
router.get('/playerScore/:id', playerScoreController.findOne);
router.put('/playerScore/:id', playerScoreController.update);
router.delete('/playerScore/:id', playerScoreController.delete);



// Player routes
router.post('/player/create', playerController.create);
router.get('/player/findAll', playerController.findAll);
router.get('/player/:id', playerController.findOne);
router.put('/player/:id', playerController.update);
router.delete('/player/:id', playerController.delete);

// Game routes
router.post('/game/create', gameController.create);
router.get('/game/findAll', gameController.findAll);
router.get('/game/findByGameCode', gameController.findByGameCode);
router.get('/game/:GameID', gameController.findOne);


router.put('/game/:GameID', gameController.update);
router.delete('/game/:GameID', gameController.delete);

// GamesVariant routes
router.post('/gamesVariant/create', gamesVariantController.create);
router.get('/gamesVariant/findAll', gamesVariantController.findAll);
router.get('/gamesVariant/:id', gamesVariantController.findOne);
router.put('/gamesVariant/:id', gamesVariantController.update);
router.delete('/gamesVariant/:id', gamesVariantController.delete);

// Config routes
router.post('/config/create', configController.create);
router.get('/config/findAll', configController.findAll);
router.get('/config/:id', configController.findOne);
router.put('/config/:id', configController.update);
router.delete('/config/:id', configController.delete);

// WristbandTran routes
router.post('/wristbandtran/create', WristbandTranController.create);
router.get('/wristbandtran/findAll', WristbandTranController.findAll);
router.get('/wristbandtran/getplaysummary', WristbandTranController.getPlaySummary);
router.get('/wristbandtran', WristbandTranController.findOne);
router.put('/wristbandtran', WristbandTranController.update);
router.delete('/wristbandtran/:id', WristbandTranController.delete);
router.get('/wristbandtran/validate', WristbandTranController.validate);
router.get('/wristbandtran/validatePlayer', WristbandTranController.validatePlayer);

router.get('/stats/highestScores', statsController.getHighestScores);

//start game routes
router.get('/start-game', startGameController.startGame);
router.get('/game-status', startGameController.getGameStatus)

module.exports = router;


