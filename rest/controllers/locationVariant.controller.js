const asyncHandler = require("../middleware/asyncHandler");
const { scopedFindAll, scopedFindOne } = require("../utils/scopedQuery");

// GET: list all LocationVariants (supports ?gameId & ?locationId)
exports.findAll = asyncHandler(async (req, res) => {
  try {
    const { gameId, locationId } = req.query;
    const { LocationVariant, GameLocation, GamesVariant } = req.db;

    if (gameId && locationId) {
      const gameLocs = await GameLocation.findAll({
        where: { GameID: gameId, LocationID: locationId },
        attributes: ["id"],
      });

      console.log(
        "DEBUG: found GameLocations ->",
        gameLocs.map((g) => g.id)
      );

      const gameLocationIds = gameLocs.map((g) => g.id);

      const results = await LocationVariant.findAll({
        where: {
          LocationID: locationId,
          ...(gameLocationIds.length
            ? { GameLocationID: gameLocationIds }
            : {}),
        },
        include: [
          {
            model: GameLocation,
            as: "room",
            attributes: ["GameID", "id"],
            required: false,
          },
          {
            model: GamesVariant,
            as: "variant",
            attributes: ["ID", "Name", "GameID"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return res.json(results);
    }

    // fallbacks...
  } catch (err) {
    console.error("❌ findAll error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// GET: list all variants assigned to a specific location
exports.findByLocation = asyncHandler(async (req, res) => {
  const locationId = req.params.locationId;

  if (
    req.ctx.role !== "admin" &&
    String(locationId) !== String(req.ctx.locationId)
  ) {
    return res.status(403).json({ error: "Cross-location access denied" });
  }

  const rows = await req.db.LocationVariant.findAll({
    where: { LocationID: locationId },
    include: [{ model: req.db.GamesVariant, as: "variant" }],
  });

  res.json(rows);
});

exports.findAllByGameAndLocation = async (req, res) => {
  const { gameId, locationId } = req.params;
  const { LocationVariant, GameLocation } = req.db.models;

  // Find all LocationVariants linked to this game/location combo
  const results = await LocationVariant.findAll({
    where: { LocationID: locationId },
    include: [
      {
        model: GameLocation,
        as: "room",
        attributes: ["GameID", "id"],
        where: { GameID: gameId },
        required: false,
      },
    ],
  });

  res.json(results);
};

// GET: list all locations assigned to a specific variant
exports.findByVariant = asyncHandler(async (req, res) => {
  const rows = await scopedFindAll(req, req.db.LocationVariant, {
    where: { VariantID: req.params.variantId },
    include: [{ model: req.db.Location, as: "location" }],
  });

  res.json(rows);
});

// POST: assign variant to location
exports.create = asyncHandler(async (req, res) => {
  const { LocationID, GamesVariantId } = req.body;

  // Try to find an existing mapping first
  const [record, created] = await req.db.LocationVariant.findOrCreate({
    where: { LocationID, GamesVariantId },
    defaults: req.body,
  });

  // If it already existed, update it (for example, reactivate)
  if (!created) {
    await record.update(req.body);
    return res.status(200).json(record);
  }

  res.status(201).json(record);
});

// DELETE: remove a mapping
exports.remove = asyncHandler(async (req, res) => {
  const record = await scopedFindOne(req, req.db.LocationVariant, {
    where: { id: req.params.id },
  });

  if (!record)
    return res.status(404).json({ message: "LocationVariant not found" });

  await record.destroy();
  res.status(204).end();
});
