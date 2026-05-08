const asyncHandler = require("../middleware/asyncHandler");
const { scopedFindAll, scopedFindOne } = require("../utils/scopedQuery");
const { deepMerge } = require("../utils/deepMerge");

// POST: create a new game variant
exports.create = asyncHandler(async (req, res) => {
  const variant = await req.db.GamesVariant.create(req.body);
  res.status(201).json(variant);
});

// GET: list all variants (scoped to location)
// Returns variants with an effectiveConfig merged from (low → high priority):
//   1. Location.config             (location-wide: doorlock, handscanner, restart)
//   2. GameLocation.config         (per game + location: ESP32 server, laser ports)
//   3. LocationVariant.customConfigJson (per variant + location, most specific)
//
// Special handling: `comPorts` is concatenated across all layers instead of
// replaced, so the full list of devices for this location+game+variant is
// available in one place.
//
// Column-level scalar overrides from GameLocation (IpAddress, ports, etc.)
// are still applied on top of Game defaults.
exports.findAll = asyncHandler(async (req, res) => {
  // Hide variants disabled at the GamesVariants level (IsActive=0). Without
  // this filter the kiosks would still see, list, and default-launch any
  // variant the operator has turned off — which is how LaserHeist ended up
  // as LaserEscape's default even after being disabled in admin.
  const where = { IsActive: 1 };
  if (req.query.name) where.name = req.query.name;

  const locationId =
    req.ctx?.locationId ||
    req.ctx?.locationScope?.LocationID ||
    req.locationScope?.LocationID ||
    null;

  if (!locationId) {
    return res.status(403).json({ message: "No location scope found" });
  }

  const variants = await req.db.GamesVariant.findAll({
    where,
    include: [
      {
        model: req.db.Game,
        as: "Game",
        required: true,
        include: [
          {
            model: req.db.GameLocation,
            as: "locations",
            required: true,
            where: { LocationID: locationId },
            include: [
              {
                model: req.db.Location,
                as: "location",
                required: false,
                // pull the Location row including its config column
              },
            ],
          },
        ],
      },
      {
        // Variant-level per-location config (generate_patterns.js etc.)
        model: req.db.LocationVariant,
        as: "locationVariants",
        required: false,
        where: { LocationID: locationId, isActive: true },
      },
    ],
    order: [["ID", "DESC"]],
  });

  const mergedVariants = variants.map((variant) => {
    const v = variant.toJSON();
    const game = v.Game;

    if (!game) return v;

    const loc = game.locations?.find(
      (l) => Number(l.LocationID) === Number(locationId)
    );

    const resolve = (overrideVal, baseVal) =>
      overrideVal !== null && overrideVal !== undefined ? overrideVal : baseVal;

    game.IpAddress = resolve(loc?.IpAddress, game.IpAddress);
    game.LocalPort = resolve(loc?.LocalPort, game.LocalPort);
    game.RemotePort = resolve(loc?.RemotePort, game.RemotePort);
    game.SocketBReceiverPort = resolve(
      loc?.SocketBReceiverPort,
      game.SocketBReceiverPort
    );
    game.NoOfControllers = resolve(loc?.NoOfControllers, game.NoOfControllers);
    game.NoOfLedPerDevice = resolve(
      loc?.NoOfLedPerDevice,
      game.NoOfLedPerDevice
    );
    game.columns = resolve(loc?.columns, game.columns);
    game.MaxPlayers = resolve(loc?.MaxPlayers, game.MaxPlayers);
    game.SmartPlugIP = resolve(loc?.SmartPlugIP, game.SmartPlugIP);

    // ---- Unified effectiveConfig (low → high priority) ----
    const locationConfig = loc?.location?.config ?? null;  // location-wide
    const gameLocationConfig = loc?.config ?? null;         // game+location
    // Variant-specific (most specific):

    // Pick the most specific variant row. Prefer one matching this game's
    // room (GameLocationID === loc.id); fall back to any active row.
    let variantRow = null;
    if (Array.isArray(v.locationVariants) && v.locationVariants.length > 0) {
      variantRow =
        v.locationVariants.find(
          (lv) => loc && Number(lv.GameLocationID) === Number(loc.id)
        ) ||
        v.locationVariants.find((lv) => lv.GameLocationID == null) ||
        v.locationVariants[0];
    }

    // customConfigJson is an accessor on the model (returns parsed JSON);
    // after .toJSON() it may already be a string (TEXT column) — handle both.
    let variantConfig = variantRow?.customConfigJson ?? null;
    if (typeof variantConfig === "string") {
      try {
        variantConfig = JSON.parse(variantConfig);
      } catch {
        variantConfig = null;
      }
    }

    v.effectiveConfig = deepMerge(
      locationConfig || {},
      gameLocationConfig || {},
      variantConfig || {}
    );

    // Special case: comPorts should accumulate from all three layers, not
    // be replaced by the most specific one. Location adds site-wide devices
    // (DOORLOCK, HANDSCANNER, RESTART), GameLocation adds game-specific ones
    // (ESP32SERVER, laser ports), variant can add more.
    const allComPorts = [
      ...(Array.isArray(locationConfig?.comPorts) ? locationConfig.comPorts : []),
      ...(Array.isArray(gameLocationConfig?.comPorts) ? gameLocationConfig.comPorts : []),
      ...(Array.isArray(variantConfig?.comPorts) ? variantConfig.comPorts : []),
    ];
    if (allComPorts.length > 0) {
      v.effectiveConfig.comPorts = allComPorts;
    }

    return v;
  });

  res.json(mergedVariants);
});

// GET: find a specific variant
exports.findOne = asyncHandler(async (req, res) => {
  const variant = await scopedFindOne(req, req.db.GamesVariant, {
    where: { ID: req.params.id },
    include: [
      {
        model: req.db.Game,
        as: "Game",
        include: [
          {
            model: req.db.GameLocation,
            as: "locations",
            required: false,
            include: [
              { model: req.db.Location, as: "location", required: false },
            ],
          },
        ],
        required: false,
      },
    ],
  });

  if (!variant)
    return res.status(404).json({ message: "GamesVariant not found" });
  res.json(variant);
});

// PUT: update a variant
exports.update = asyncHandler(async (req, res) => {
  const [updated] = await req.db.GamesVariant.update(req.body, {
    where: { ID: req.params.id },
  });

  if (!updated)
    return res.status(404).json({ message: "GamesVariant not found" });

  const record = await req.db.GamesVariant.findByPk(req.params.id);
  res.json(record);
});

// DELETE: remove a variant
exports.remove = asyncHandler(async (req, res) => {
  const variant = await scopedFindOne(req, req.db.GamesVariant, {
    where: { ID: req.params.id },
  });

  if (!variant)
    return res.status(404).json({ message: "GamesVariant not found" });

  await variant.destroy();
  res.status(204).end();
});
