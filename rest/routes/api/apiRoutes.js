const { Router } = require("express");
const router = Router();
const retryMiddleware = require("../../middlewares/retryMiddleware");
const {
  verifyToken,
  requireRole,
  verifyAnyAuth,
  restrictToOwnLocation,
} = require("../../middlewares/authMiddleware");

// Import controllers
const playerScoreController = require("../../controllers/playerScoreController");
const playerController = require("../../controllers/playerController");
const gameController = require("../../controllers/gameController");
const gamesVariantController = require("../../controllers/gamesVariantController");
const configController = require("../../controllers/configController");
const WristbandTranController = require("../../controllers/WristbandTranController");
const statsController = require("../../controllers/statsController");
const gameRoomDeviceController = require("../../controllers/gameRoomDevicesController");
const smartDeviceController = require("../../controllers/smartDevicesController");
const locationsController = require("../../controllers/locationController");
const apiKeyController = require("../../controllers/apiKeyController");
const authController = require("../../controllers/authController");
const automations = require("../../controllers/automationsController");

// Location routes
router.post(
  "/location/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.create)
);
router.get(
  "/location/findAll",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.findAll)
);
router.get(
  "/location/:LocationID",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.findOne)
);
router.put(
  "/location/:LocationID",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.update)
);
router.delete(
  "/location/:LocationID",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.delete)
);

// PlayerScore routes
router.get(
  "/playerScore/topAllTime",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.getTopAllTime)
);
router.get(
  "/playerScore/topRecent",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.getTopRecent)
);
router.post(
  "/playerScore/addPlayerScores",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.addPlayerScores)
);
router.post(
  "/playerScore/create",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.create)
);
router.get(
  "/playerScore/findAll",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.findAll)
);
router.get(
  "/playerScore/findPaged",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.findPaged)
);
router.get(
  "/playerScore/:id",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.findOne)
);
router.put(
  "/playerScore/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(playerScoreController.update)
);
router.delete(
  "/playerScore/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(playerScoreController.delete)
);
router.get(
  "/playerScore/getTopScoresForVariants/:gameCode",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.getTopScoresForVariants)
);
router.get(
  "/playerScore/getTopScoreForPlayer/:gamesVariantId/:playerId",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.getTopScoresForPlayerinGameVariant)
);
router.get(
  "/playerScore/allForVariant/:gamesVariantId",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.getAllScoresForVariant)
);
router.get(
  "/playerScore/player/:playerID",
  verifyAnyAuth,
  retryMiddleware(playerScoreController.findAllScoresByPlayerID)
);

// Player routes
router.post(
  "/player/create",
  verifyAnyAuth,
  retryMiddleware(playerController.create)
);
router.get(
  "/player/findAll",
  verifyAnyAuth,
  retryMiddleware(playerController.findAll)
);
router.post(
  "/player/findOrCreate",
  verifyAnyAuth,
  retryMiddleware(playerController.findOrCreate)
);
router.post(
  "/player/findOrCreateChild",
  verifyAnyAuth,
  retryMiddleware(playerController.findOrCreateChild)
);
router.get(
  "/player/with-kids/:email",
  verifyAnyAuth,
  retryMiddleware(playerController.getWithChildrenByEmail)
);
router.get(
  "/player/family/:email",
  verifyAnyAuth,
  retryMiddleware(playerController.getFamilyByEmail)
);
router.get(
  "/player/email-suggestions",
  verifyAnyAuth,
  retryMiddleware(playerController.getEmailSuggestions)
);
router.put(
  "/player/:id",
  verifyAnyAuth,
  retryMiddleware(playerController.update)
);
router.delete(
  "/player/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(playerController.delete)
);
router.get(
  "/player/paged",
  verifyAnyAuth,
  retryMiddleware(playerController.findPaged)
);
router.get(
  "/player/:id",
  verifyAnyAuth,
  retryMiddleware(playerController.findOne)
);

// Game routes
router.post(
  "/game/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameController.create)
);
router.get(
  "/game/findAll",
  verifyAnyAuth,
  retryMiddleware(gameController.findAll)
);
router.get(
  "/game/findByGameCode",
  verifyAnyAuth,
  retryMiddleware(gameController.findByGameCode)
);
router.get(
  "/game/findActiveGamesByGameCode",
  verifyAnyAuth,
  retryMiddleware(gameController.findActiveGamesByGameCode)
);
router.get(
  "/game/:GameID",
  verifyAnyAuth,
  retryMiddleware(gameController.findOne)
);
router.put(
  "/game/:GameID",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameController.update)
);
router.delete(
  "/game/:GameID",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameController.delete)
);

// GamesVariant routes
router.post(
  "/gamesVariant/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gamesVariantController.create)
);
router.get(
  "/gamesVariant/findAll",
  verifyAnyAuth,
  retryMiddleware(gamesVariantController.findAll)
);
router.get(
  "/gamesVariant/:id",
  verifyAnyAuth,
  retryMiddleware(gamesVariantController.findOne)
);
router.put(
  "/gamesVariant/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gamesVariantController.update)
);
router.delete(
  "/gamesVariant/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gamesVariantController.delete)
);

// GameRoomDevice routes
router.post(
  "/devices/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameRoomDeviceController.create)
);
router.get(
  "/devices",
  verifyAnyAuth,
  retryMiddleware(gameRoomDeviceController.findAll)
);
router.get(
  "/devices/:id",
  verifyAnyAuth,
  retryMiddleware(gameRoomDeviceController.findOne)
);
router.get(
  "/devices/deviceId/:deviceId",
  verifyAnyAuth,
  retryMiddleware(gameRoomDeviceController.findByDeviceId)
);
router.put(
  "/devices/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameRoomDeviceController.update)
);
router.delete(
  "/devices/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameRoomDeviceController.delete)
);

// Config routes
router.post(
  "/config/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(configController.create)
);
router.get(
  "/config/findAll",
  verifyAnyAuth,
  retryMiddleware(configController.findAll)
);
router.get(
  "/config/:id",
  verifyAnyAuth,
  retryMiddleware(configController.findOne)
);
router.get(
  "/config",
  verifyAnyAuth,
  retryMiddleware(configController.findByConfigKey)
);
router.put(
  "/config/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(configController.update)
);
router.delete(
  "/config/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(configController.delete)
);

// WristbandTran routes
router.post(
  "/wristbandtran/create",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.create)
);
router.get(
  "/wristbandtran/findAll",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.findAll)
);
router.get(
  "/wristbandtran/getplaysummary",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.getPlaySummary)
);
router.get(
  "/wristbandtran",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.findOne)
);
router.put(
  "/wristbandtran",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.update)
);
router.put(
  "/wristbandtran/addHours",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.addTimeToWristband)
);
router.delete(
  "/wristbandtran/:id",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.delete)
);
router.get(
  "/wristbandtran/validate",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.validate)
);
router.get(
  "/wristbandtran/validatePlayer",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.validatePlayer)
);
router.get(
  "/wristbandtran/lookupByUid",
  verifyAnyAuth,
  retryMiddleware(WristbandTranController.lookupByUid)
);

// Stats routes
router.get(
  "/stats/highestScores",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getHighestScores)
);
router.get(
  "/stats/game-stats",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getGameStats)
);
router.get(
  "/stats/plays/daily",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getDailyPlays)
);
router.get(
  "/stats/plays/hourly",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getHourlyPlaysForDay)
);
router.get(
  "/stats/variants/top",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getTopVariants)
);
router.get(
  "/stats/game/share",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getGameShareForDay)
);
router.get(
  "/stats/heatmap/weekday-hour",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getWeekdayHourHeatmap)
);
router.get(
  "/stats/game-length/averages",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getGameLengthAverages)
);
router.get(
  "/stats/game-variant/:variantId/analytics",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(statsController.getGameVariantAnalytics)
);

// Login routes
router.post("/login", authController.login);
router.get("/me", authController.getMe);
router.post(
  "/register",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(authController.register)
);
router.post("/logout", authController.logout);

// Smart device routes
router.get(
  "/smartDevices",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.findAll)
);
router.get(
  "/smartDevices/set",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.setStatus)
);
router.get(
  "/smartDevices/get",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.getStatus)
);
router.get(
  "/devices",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.findAll
);
router.post(
  "/devices/refresh",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.refreshDiscovery
);
router.get(
  "/device/status",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.getStatus
);
router.post(
  "/device/status",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.setStatus
);
router.get(
  "/device/status/mac",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.getStatusByMac
);
router.post(
  "/device/status/mac",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.setStatusByMac
);
router.get(
  "/device/status/alias",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.getStatusByAlias
);
router.post(
  "/device/status/alias",
  verifyToken,
  requireRole("admin", "manager"),
  smartDeviceController.setStatusByAlias
);

// Automation routes
router.get("/automations", verifyToken, requireRole("admin"), automations.list);
router.get(
  "/automations/:id",
  verifyToken,
  requireRole("admin"),
  automations.list
);
router.get(
  "/automations/:id",
  verifyToken,
  requireRole("admin"),
  automations.get
);
router.post(
  "/automations",
  verifyToken,
  requireRole("admin"),
  automations.create
);
router.put(
  "/automations/:id",
  verifyToken,
  requireRole("admin"),
  automations.update
);
router.delete(
  "/automations/:id",
  verifyToken,
  requireRole("admin"),
  automations.remove
);
router.post(
  "/automations/:id/enable",
  verifyToken,
  requireRole("admin"),
  automations.enable
);
router.post(
  "/automations/:id/disable",
  verifyToken,
  requireRole("admin"),
  automations.disable
);
router.get(
  "/automations/:id/logs",
  verifyToken,
  requireRole("admin"),
  automations.logs
);
router.post(
  "/automations/:id/bind",
  verifyToken,
  requireRole("admin"),
  automations.bindFromDiscovery
);
router.get(
  "/automations/:id/resolve",
  verifyToken,
  requireRole("admin"),
  automations.resolveTarget
);
router.post(
  "/automations/:id/force-on",
  verifyToken,
  requireRole("admin"),
  automations.forceOn
);
router.post(
  "/automations/:id/force-off",
  verifyToken,
  requireRole("admin"),
  automations.forceOff
);
router.post(
  "/automations/:id/pulse",
  verifyToken,
  requireRole("admin"),
  automations.pulseNow
);

// Api key routes
router.post(
  "/apikeys",
  verifyToken,
  requireRole("admin"),
  apiKeyController.create
);
router.get(
  "/apikeys",
  verifyToken,
  requireRole("admin"),
  apiKeyController.list
);
router.put(
  "/apikeys/:id/deactivate",
  verifyToken,
  requireRole("admin"),
  apiKeyController.deactivate
);

module.exports = router;
