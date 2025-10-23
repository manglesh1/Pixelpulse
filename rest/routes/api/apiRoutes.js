const { Router } = require("express");
const router = Router();
const retryMiddleware = require("../../middlewares/retryMiddleware"); // Import the retry middleware
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const authController = require("../../controllers/authController");
const ctrl = require("../../controllers/smartDevicesController");
const automations = require("../../controllers/automationsController");

// Import controllers
const gameroomTypeController = require("../../controllers/gameroomTypeController");
const notificationController = require("../../controllers/notificationController");
const playerScoreController = require("../../controllers/playerScoreController");
const playerController = require("../../controllers/playerController");
const gameController = require("../../controllers/gameController");
const gamesVariantController = require("../../controllers/gamesVariantController");
const configController = require("../../controllers/configController");
const WristbandTranController = require("../../controllers/WristbandTranController");
const statsController = require("../../controllers/statsController");
const startGameController = require("../../controllers/startGameController");
const gameRoomDeviceController = require("../../controllers/gameRoomDevicesController");
const smartDeviceController = require("../../controllers/smartDevicesController");
const locationsController = require("../../controllers/locationController");
const apiKeyController = require("../../controllers/apiKeyController");

// Location routes
router.post(
  "/location/create",
  retryMiddleware(locationsController.create)
);
router.get(
  "/location/findAll",
  retryMiddleware(locationsController.findAll)
);
router.get(
  "/location/:LocationID",
  retryMiddleware(locationsController.findOne)
);
router.put(
  "/location/:LocationID",
  retryMiddleware(locationsController.update)
);
router.delete(
  "/location/:LocationID",
  retryMiddleware(locationsController.delete)
);

// GameroomType routes
router.post(
  "/gameroomType/create",
  retryMiddleware(gameroomTypeController.create)
);
router.get(
  "/gameroomType/findAll",
  retryMiddleware(gameroomTypeController.findAll)
);
router.get(
  "/gameroomType/:id",
  retryMiddleware(gameroomTypeController.findOne)
);
router.put("/gameroomType/:id", retryMiddleware(gameroomTypeController.update));
router.delete(
  "/gameroomType/:id",
  retryMiddleware(gameroomTypeController.delete)
);

// Notification routes
router.post(
  "/notification/create",
  retryMiddleware(notificationController.create)
);
router.get(
  "/notification/findAll",
  retryMiddleware(notificationController.findAll)
);
router.get(
  "/notification/:id",
  retryMiddleware(notificationController.findOne)
);
router.put("/notification/:id", retryMiddleware(notificationController.update));
router.delete(
  "/notification/:id",
  retryMiddleware(notificationController.delete)
);

// PlayerScore routes
router.get(
  "/playerScore/topAllTime",
  retryMiddleware(playerScoreController.getTopAllTime)
);
router.get(
  "/playerScore/topRecent",
  retryMiddleware(playerScoreController.getTopRecent)
);
router.post(
  "/playerScore/addPlayerScores",
  retryMiddleware(playerScoreController.addPlayerScores)
);
router.post(
  "/playerScore/create",
  retryMiddleware(playerScoreController.create)
);
router.get(
  "/playerScore/findAll",
  retryMiddleware(playerScoreController.findAll)
);
router.get(
  "/playerScore/findPaged",
  retryMiddleware(playerScoreController.findPaged)
);
router.get("/playerScore/:id", retryMiddleware(playerScoreController.findOne));
router.put("/playerScore/:id", retryMiddleware(playerScoreController.update));
router.delete(
  "/playerScore/:id",
  retryMiddleware(playerScoreController.delete)
);
router.get(
  "/playerScore/getTopScoresForVariants/:gameCode",
  retryMiddleware(playerScoreController.getTopScoresForVariants)
);
router.get(
  "/playerScore/getTopScoreForPlayer/:gamesVariantId/:playerId",
  retryMiddleware(playerScoreController.getTopScoresForPlayerinGameVariant)
);
router.get(
  "/playerScore/allForVariant/:gamesVariantId",
  retryMiddleware(playerScoreController.getAllScoresForVariant)
);
router.get(
  "/playerScore/player/:playerID",
  retryMiddleware(playerScoreController.findAllScoresByPlayerID)
);

// Player routes
router.post("/player/create", retryMiddleware(playerController.create));
router.get("/player/findAll", retryMiddleware(playerController.findAll));
router.post(
  "/player/findOrCreate",
  retryMiddleware(playerController.findOrCreate)
);
router.post(
  "/player/findOrCreateChild",
  retryMiddleware(playerController.findOrCreateChild)
);
router.get(
  "/player/with-kids/:email",
  retryMiddleware(playerController.getWithChildrenByEmail)
);
router.get(
  "/player/family/:email",
  retryMiddleware(playerController.getFamilyByEmail)
);
router.get(
  "/player/email-suggestions",
  retryMiddleware(playerController.getEmailSuggestions)
);
router.put("/player/:id", retryMiddleware(playerController.update));
router.delete("/player/:id", retryMiddleware(playerController.delete));
router.get("/player/paged", retryMiddleware(playerController.findPaged));
router.get("/player/:id", retryMiddleware(playerController.findOne));

// Game routes
router.post("/game/create", retryMiddleware(gameController.create));
router.get("/game/findAll", retryMiddleware(gameController.findAll));
router.get(
  "/game/findByGameCode",
  retryMiddleware(gameController.findByGameCode)
);
router.get(
  "/game/findActiveGamesByGameCode",
  retryMiddleware(gameController.findActiveGamesByGameCode)
);
router.get("/game/:GameID", retryMiddleware(gameController.findOne));
router.put("/game/:GameID", retryMiddleware(gameController.update));
router.delete("/game/:GameID", retryMiddleware(gameController.delete));

// GamesVariant routes
router.post(
  "/gamesVariant/create",
  retryMiddleware(gamesVariantController.create)
);
router.get(
  "/gamesVariant/findAll",
  retryMiddleware(gamesVariantController.findAll)
);
router.get(
  "/gamesVariant/:id",
  retryMiddleware(gamesVariantController.findOne)
);
router.put("/gamesVariant/:id", retryMiddleware(gamesVariantController.update));
router.delete(
  "/gamesVariant/:id",
  retryMiddleware(gamesVariantController.delete)
);

// GameRoomDevice routes
router.post(
  "/devices/create",
  retryMiddleware(gameRoomDeviceController.create)
);
router.get("/devices", retryMiddleware(gameRoomDeviceController.findAll));
router.get("/devices/:id", retryMiddleware(gameRoomDeviceController.findOne));
router.get(
  "/devices/deviceId/:deviceId",
  retryMiddleware(gameRoomDeviceController.findByDeviceId)
);
router.put("/devices/:id", retryMiddleware(gameRoomDeviceController.update));
router.delete("/devices/:id", retryMiddleware(gameRoomDeviceController.delete));

// Config routes
router.post("/config/create", retryMiddleware(configController.create));
router.get("/config/findAll", retryMiddleware(configController.findAll));
router.get("/config/:id", retryMiddleware(configController.findOne));
router.get("/config", retryMiddleware(configController.findByConfigKey));
router.put("/config/:id", retryMiddleware(configController.update));
router.delete("/config/:id", retryMiddleware(configController.delete));

// WristbandTran routes
router.post(
  "/wristbandtran/create",
  retryMiddleware(WristbandTranController.create)
);
router.get(
  "/wristbandtran/findAll",
  retryMiddleware(WristbandTranController.findAll)
);
router.get(
  "/wristbandtran/getplaysummary",
  retryMiddleware(WristbandTranController.getPlaySummary)
);
router.get("/wristbandtran", retryMiddleware(WristbandTranController.findOne));
router.put("/wristbandtran", retryMiddleware(WristbandTranController.update));
router.put(
  "/wristbandtran/addHours",
  retryMiddleware(WristbandTranController.addTimeToWristband)
);
router.delete(
  "/wristbandtran/:id",
  retryMiddleware(WristbandTranController.delete)
);
router.get(
  "/wristbandtran/validate",
  retryMiddleware(WristbandTranController.validate)
);
router.get(
  "/wristbandtran/validatePlayer",
  retryMiddleware(WristbandTranController.validatePlayer)
);
router.get(
  "/wristbandtran/lookupByUid",
  retryMiddleware(WristbandTranController.lookupByUid)
);

// Stats routes
router.get(
  "/stats/highestScores",
  retryMiddleware(statsController.getHighestScores)
);
router.get("/stats/game-stats", retryMiddleware(statsController.getGameStats));
router.get(
  "/stats/plays/daily",
  retryMiddleware(statsController.getDailyPlays)
);
router.get(
  "/stats/plays/hourly",
  retryMiddleware(statsController.getHourlyPlaysForDay)
);
router.get(
  "/stats/variants/top",
  retryMiddleware(statsController.getTopVariants)
);
router.get(
  "/stats/game/share",
  retryMiddleware(statsController.getGameShareForDay)
);
router.get(
  "/stats/heatmap/weekday-hour",
  retryMiddleware(statsController.getWeekdayHourHeatmap)
);
router.get(
  "/stats/game-length/averages",
  retryMiddleware(statsController.getGameLengthAverages)
);
router.get(
  "/stats/game-variant/:variantId/analytics",
  retryMiddleware(statsController.getGameVariantAnalytics)
);

// Start game routes
router.get("/start-game", retryMiddleware(startGameController.startGame));
router.get("/game-status", retryMiddleware(startGameController.getGameStatus));

// smart devices routes
router.get("/smartDevices", retryMiddleware(smartDeviceController.findAll));
router.get(
  "/smartDevices/set",
  retryMiddleware(smartDeviceController.setStatus)
);
router.get(
  "/smartDevices/get",
  retryMiddleware(smartDeviceController.getStatus)
);

// login routes
router.post("/login", authController.login);
router.get("/me", authController.getMe);
router.post(
  "/register",
  // verifyToken,
  // requireRole('admin', 'manager'),
  retryMiddleware(authController.register)
);
router.post("/logout", authController.logout);
//router.post('/register-initial', retryMiddleware(authController.register));

// smart device routes
router.get("/devices", ctrl.findAll);
router.post("/devices/refresh", ctrl.refreshDiscovery);

router.get("/device/status", ctrl.getStatus); // ?ip=...
router.post("/device/status", ctrl.setStatus); // ?ip=...&state=on|off

router.get("/device/status/mac", ctrl.getStatusByMac); // ?mac=AA:BB:...
router.post("/device/status/mac", ctrl.setStatusByMac); // ?mac=AA:BB:...&state=on|off

router.get("/device/status/alias", ctrl.getStatusByAlias); // ?alias=laser smoke
router.post("/device/status/alias", ctrl.setStatusByAlias); // ?alias=...&state=on|off

// automation routes

router.get("/automations", automations.list);
router.get("/automations/:id", automations.get);
router.post("/automations", automations.create);
router.put("/automations/:id", automations.update);
router.delete("/automations/:id", automations.remove);

router.post("/automations/:id/enable", automations.enable);
router.post("/automations/:id/disable", automations.disable);

router.get("/automations/:id/logs", automations.logs);

router.post("/automations/:id/bind", automations.bindFromDiscovery);
router.get("/automations/:id/resolve", automations.resolveTarget);

router.post("/automations/:id/force-on", automations.forceOn); // ?autoOffMs=5000 (optional)
router.post("/automations/:id/force-off", automations.forceOff);
router.post("/automations/:id/pulse", automations.pulseNow); // ?onMs=5000

// Api key routes
router.post('/apikeys', verifyToken, requireRole('admin'), apiKeyController.create);
router.get('/apikeys', verifyToken, requireRole('admin'), apiKeyController.list);
router.put('/apikeys/:id/deactivate', verifyToken, requireRole('admin'), apiKeyController.deactivate);

module.exports = router;
