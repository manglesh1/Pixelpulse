const { Router } = require("express");
const router = Router();

const {
  verifyAnyAuth,
  restrictToLocation,
  verifyToken,
  requireRole,
} = require("../../middleware/authMiddleware");
const retryMiddleware = require("../../middleware/retryMiddleware");
const attachDbAndCtx = require("../../middleware/attachDbAndCtx");
const forceLocationOnBody = require("../../middleware/forceLocationOnBody");
const ensureBelongsToLocationBody = require("../../middleware/ensureBelongsToLocationBody");
const ensureBelongsToLocation = require("../../middleware/ensureBelongsToLocation");

const playerScoreController = require("../../controllers/playerScore.controller");
const playerController = require("../../controllers/player.controller");
const gameController = require("../../controllers/game.controller");
const gameLocationsController = require("../../controllers/gameLocations.controller");
const locationVariantController = require("../../controllers/locationVariant.controller");
const gamesVariantController = require("../../controllers/gamesVariant.controller");
const configController = require("../../controllers/config.controller");
const wristbandTranController = require("../../controllers/wristbandTran.controller");
const statsController = require("../../controllers/stats.controller");
const smartDeviceController = require("../../controllers/smartDevices.controller");
const locationsController = require("../../controllers/location.controller");
const apiKeyController = require("../../controllers/apiKey.controller");
const authController = require("../../controllers/auth.controller");
const automations = require("../../controllers/automations.controller");
const { config } = require("dotenv");

// -------------------------------------------------------------
// Apply DB + ctx for everything under this router
// (If you already add this in app.js before mounting the router,
// you can remove this line here.)
router.use(attachDbAndCtx);
// -------------------------------------------------------------

// ----------------------- Location ----------------------------
router.post(
  "/location/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.create)
);

router.get(
  "/location/findAll",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(locationsController.findAll)
);

router.get(
  "/location/:LocationID",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(locationsController.findOne)
);

router.put(
  "/location/:LocationID/disable",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.disable)
);

router.put(
  "/location/:LocationID/enable",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(locationsController.enable)
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
  retryMiddleware(locationsController.remove)
);

// Configs
router.post(
  "/config/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(configController.create)
);

router.get(
  "/config/findAll",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(configController.findAll)
);

router.get(
  "/config/:id",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(configController.findOne)
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

// -------------------- GameLocations (junction) ----------------
router.post(
  "/gameLocations",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  forceLocationOnBody("GameLocation"), // ensures LocationID (or nested) is coerced to scope
  retryMiddleware(gameLocationsController.create)
);

router.get(
  "/gameLocations",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gameLocationsController.findAll)
);

router.get(
  "/gameLocations/findAllByGame/:gameId",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gameLocationsController.findByGame)
);

router.get(
  "/gameLocations/:id",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gameLocationsController.findOne)
);

router.put(
  "/gameLocations/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  ensureBelongsToLocation({ model: "GameLocation", idParam: "id" }),
  forceLocationOnBody("GameLocation"),
  retryMiddleware(gameLocationsController.update)
);

router.delete(
  "/gameLocations/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  ensureBelongsToLocation({ model: "GameLocation", idParam: "id" }),
  retryMiddleware(gameLocationsController.remove)
);

// --------------- LocationVariants (junction-ish) --------------
router.post(
  "/locationVariants",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  forceLocationOnBody("LocationVariant"),
  retryMiddleware(locationVariantController.create)
);

router.get(
  "/locationVariants",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(locationVariantController.findAll)
);

router.get(
  "/locationVariant/findAllByGameAndLocation/:gameId/:locationId",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(locationVariantController.findAllByGameAndLocation)
);

router.get(
  "/locationVariants/:id",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(locationVariantController.findOne)
);

router.put(
  "/locationVariants/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  ensureBelongsToLocation({ model: "LocationVariant", idParam: "id" }),
  forceLocationOnBody("LocationVariant"),
  retryMiddleware(locationVariantController.update)
);

router.delete(
  "/locationVariants/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  ensureBelongsToLocation({ model: "LocationVariant", idParam: "id" }),
  retryMiddleware(locationVariantController.remove)
);

// ------------------------ PlayerScore -------------------------
router.get(
  "/playerScore/topAllTime",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.getTopAllTime)
);

router.get(
  "/playerScore/topRecent",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.getTopRecent)
);

router.post(
  "/playerScore/addPlayerScores",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.addPlayerScores)
);

router.post(
  "/playerScore/create",
  verifyAnyAuth,
  restrictToLocation,
  forceLocationOnBody("PlayerScore"), // no LocationID on score, but middleware can noop; keeping consistent
  retryMiddleware(playerScoreController.create)
);

router.get(
  "/playerScore/findAll",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.findAll)
);

router.get(
  "/playerScore/findPaged",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.findPaged)
);

router.get(
  "/playerScore/:id",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.findOne)
);

router.put(
  "/playerScore/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  retryMiddleware(playerScoreController.update)
);

router.delete(
  "/playerScore/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation,
  retryMiddleware(playerScoreController.delete)
);

router.get(
  "/playerScore/getTopScoreForPlayer/:gamesVariantId/:playerId",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.getTopScoresForPlayerinGameVariant)
);

router.get(
  "/playerScore/allForVariant/:gamesVariantId",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.getAllScoresForVariant)
);

router.get(
  "/playerScore/player/:playerID",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerScoreController.findAllScoresByPlayerID)
);

// -------------------------- Player ----------------------------
router.post(
  "/player/create",
  verifyAnyAuth,
  restrictToLocation,
  forceLocationOnBody("Player"),
  retryMiddleware(playerController.create)
);

router.get(
  "/player/findAll",
  verifyAnyAuth, // get JWT or API key
  restrictToLocation, // set req.locationScope
  attachDbAndCtx, // rebuild ctx with location + auth
  retryMiddleware(playerController.findAll)
);

router.post(
  "/player/findOrCreate",
  verifyAnyAuth,
  restrictToLocation,
  forceLocationOnBody("Player"),
  retryMiddleware(playerController.findOrCreate)
);

router.post(
  "/player/findOrCreateChild",
  verifyAnyAuth,
  restrictToLocation,
  forceLocationOnBody("Player"),
  ensureBelongsToLocationBody({
    // makes sure provided signeeId belongs to your Location
    model: "Player",
    bodyField: "signeeId",
    asForeignKey: true,
  }),
  retryMiddleware(playerController.findOrCreateChild)
);

router.get(
  "/player/with-kids/:email",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerController.getWithChildrenByEmail)
);

router.get(
  "/player/family/:email",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerController.getFamilyByEmail)
);

router.get(
  "/player/email-suggestions",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(playerController.getEmailSuggestions)
);

router.put(
  "/player/:id",
  verifyAnyAuth,
  restrictToLocation,
  ensureBelongsToLocation("Player", "id"),
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
  restrictToLocation,
  retryMiddleware(playerController.findPaged)
);

router.get(
  "/player/:id",
  verifyAnyAuth,
  restrictToLocation,
  ensureBelongsToLocation("Player", "id"),
  retryMiddleware(playerController.findOne)
);

// --------------------------- Game -----------------------------
router.post(
  "/game/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gameController.create)
);

router.get(
  "/game/findAll",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gameController.findAll)
);

router.get(
  "/game/findByGameCode",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gameController.findByGameCode)
);

router.get(
  "/game/findActiveGamesByGameCode",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gameController.findActiveGamesByGameCode)
);

router.get(
  "/game/:GameID",
  verifyAnyAuth,
  restrictToLocation,
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

// ---------------------- GamesVariant --------------------------
router.post(
  "/gamesVariant/create",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gamesVariantController.create)
);

router.get(
  "/gamesVariant/findAll",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gamesVariantController.findAll)
);

router.get(
  "/gamesVariant/:id",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(gamesVariantController.findOne)
);

router.put(
  "/gamesVariant/:id",
  verifyToken,
  requireRole("admin"),
  restrictToLocation, // for nested views hitting PlayerScores lookups by variant
  retryMiddleware(gamesVariantController.update)
);

router.delete(
  "/gamesVariant/:id",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(gamesVariantController.remove)
);

// ---------------------- WristbandTrans ------------------------
router.post(
  "/wristbandtran/create",
  verifyAnyAuth,
  restrictToLocation,
  // If body includes playerID, ensure it belongs to this location:
  ensureBelongsToLocation({
    model: "Player",
    bodyField: "playerID",
    asForeignKey: true,
  }),
  retryMiddleware(wristbandTranController.create)
);

router.get(
  "/wristbandtran/findAll",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.findAll)
);

router.get(
  "/wristbandtran/getplaysummary",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.getPlaySummary)
);

router.get(
  "/wristbandtran",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.findOne)
);

router.put(
  "/wristbandtran",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.update)
);

router.put(
  "/wristbandtran/addHours",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.addTimeToWristband)
);

router.delete(
  "/wristbandtran/:id",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.delete)
);

router.get(
  "/wristbandtran/validate",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.validate)
);

router.get(
  "/wristbandtran/validatePlayer",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.validatePlayer)
);

router.get(
  "/wristbandtran/lookupByUid",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(wristbandTranController.lookupByUid)
);

// -------------------------- Stats -----------------------------
router.get(
  "/stats/highestScores",
  verifyAnyAuth,
  restrictToLocation,
  retryMiddleware(statsController.getHighestScores)
);

router.get(
  "/stats/game-stats",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation, // pass ctx for scoping even for managers
  retryMiddleware(statsController.getGameStats)
);

router.get(
  "/stats/plays/daily",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getDailyPlays)
);

router.get(
  "/stats/plays/hourly",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getHourlyPlaysForDay)
);

router.get(
  "/stats/variants/top",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getTopVariants)
);

router.get(
  "/stats/game/share",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getGameShareForDay)
);

router.get(
  "/stats/heatmap/weekday-hour",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getWeekdayHourHeatmap)
);

router.get(
  "/stats/game-length/averages",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getGameLengthAverages)
);

router.get(
  "/stats/game-variant/:variantId/analytics",
  verifyToken,
  requireRole("admin", "manager"),
  restrictToLocation,
  retryMiddleware(statsController.getGameVariantAnalytics)
);

// --------------------------- Auth -----------------------------
router.post("/login", retryMiddleware(authController.login));
router.get("/me", retryMiddleware(authController.getMe));
router.post(
  "/register",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(authController.register)
);
router.post("/logout", retryMiddleware(authController.logout));

// ---------------------- Smart Devices -------------------------
// (Kept both modern and legacy paths for compatibility)
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

// Legacy aliases
router.get(
  "/devices",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.findAll)
);

router.post(
  "/devices/refresh",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.refreshDiscovery)
);

router.get(
  "/device/status",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.getStatus)
);

router.post(
  "/device/status",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.setStatus)
);

router.get(
  "/device/status/mac",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.getStatusByMac)
);

router.post(
  "/device/status/mac",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.setStatusByMac)
);

router.get(
  "/device/status/alias",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.getStatusByAlias)
);

router.post(
  "/device/status/alias",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(smartDeviceController.setStatusByAlias)
);

// ------------------------ Automations -------------------------
router.get(
  "/automations",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.list)
);

router.get(
  "/automations/:id",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.get)
);

router.post(
  "/automations",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.create)
);

router.put(
  "/automations/:id",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.update)
);

router.delete(
  "/automations/:id",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.remove)
);

router.post(
  "/automations/:id/enable",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.enable)
);

router.post(
  "/automations/:id/disable",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.disable)
);

router.get(
  "/automations/:id/logs",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.logs)
);

router.post(
  "/automations/:id/bind",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.bindFromDiscovery)
);

router.get(
  "/automations/:id/resolve",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.resolveTarget)
);

router.post(
  "/automations/:id/force-on",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.forceOn)
);

router.post(
  "/automations/:id/force-off",
  verifyToken,
  requireRole("admin", "manager"),
  retryMiddleware(automations.forceOff)
);

router.post(
  "/automations/:id/pulse",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(automations.pulseNow)
);

// ------------------------- API Keys ---------------------------
router.post(
  "/apikeys",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(apiKeyController.create)
);

router.get(
  "/apikeys",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(apiKeyController.list)
);

router.put(
  "/apikeys/:id/deactivate",
  verifyToken,
  requireRole("admin"),
  retryMiddleware(apiKeyController.deactivate)
);

module.exports = router;
