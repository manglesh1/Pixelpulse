const asyncHandler = require("../middleware/asyncHandler");
const { scopedFindAll, scopedFindOne } = require("../utils/scopedQuery");

// POST: create a new game variant
exports.create = asyncHandler(async (req, res) => {
  const variant = await req.db.GamesVariant.create(req.body);
  res.status(201).json(variant);
});

// GET: list all variants (scoped to location)
// Returns variants with an effectiveConfig merged from:
// GameLocations (override) -> Games (default)
exports.findAll = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.name) where.name = req.query.name;

  const variants = await scopedFindAll(req, req.db.GamesVariant, {
    where,
    include: [
      {
        model: req.db.Game,
        as: "Game",
        required: false,
        include: [
          {
            model: req.db.GameLocation,
            as: "locations",
            required: false,
            include: [
              {
                model: req.db.Location,
                as: "location",
                required: false,
              },
            ],
          },
        ],
      },
    ],
    order: [["ID", "DESC"]],
  });

  const mergedVariants = variants.map((variant) => {
    const v = variant.toJSON();
    const game = v.Game;

    if (!game) return v;

    const currentLocationId = req.locationScope;

    const loc = game.locations?.find((l) => l.LocationID === currentLocationId);

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
