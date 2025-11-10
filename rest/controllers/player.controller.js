const asyncHandler = require("../middleware/asyncHandler");
const { Op, QueryTypes } = require("sequelize");

// POST: Create or find a parent player
exports.findOrCreate = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const FirstName = b.FirstName ?? b.firstName;
  const LastName = b.LastName ?? b.lastName;
  const Email = b.Email ?? b.email;

  if (!Email || !FirstName?.trim())
    return res
      .status(400)
      .json({ message: "Email and first name are required" });

  if (!req.ctx.locationId)
    return res.status(403).json({ message: "Missing location scope" });

  const db = req.db;
  const normalizedEmail = Email.trim().toLowerCase();
  const fName = FirstName.trim();
  const lName = LastName?.trim() || ".";

  const anyPlayerWithEmail = await db.Player.findOne({
    where: { email: normalizedEmail },
  });

  // Check if parent already exists
  if (anyPlayerWithEmail && anyPlayerWithEmail.SigneeID) {
    const existing = await db.Player.findOne({
      where: {
        email: normalizedEmail,
        PlayerID: anyPlayerWithEmail.SigneeID,
      },
    });
    if (existing) return res.json(existing);
  }

  // Create new player
  const newPlayer = await db.Player.create({
    FirstName: fName,
    LastName: lName,
    email: normalizedEmail,
    SigneeID: anyPlayerWithEmail ? anyPlayerWithEmail.PlayerID : null,
    LocationID: req.ctx.locationId,
  });

  if (!anyPlayerWithEmail) {
    newPlayer.SigneeID = newPlayer.PlayerID;
    await newPlayer.save();
  }

  res.status(201).json(newPlayer);
});

// POST: Create or find a child player
exports.findOrCreateChild = asyncHandler(async (req, res) => {
  const { FirstName, LastName = " ", signeeId, Email = null } = req.body;
  const SigneeID = signeeId; // normalize

  if (!SigneeID || !FirstName?.trim())
    return res
      .status(400)
      .json({ message: "Signee ID and first name are required" });

  if (!req.ctx.locationId)
    return res.status(403).json({ message: "Missing location scope" });

  const db = req.db;
  const fName = FirstName.trim();
  const lName = LastName.trim() || " ";

  const existing = await db.Player.findOne({
    where: {
      FirstName: fName,
      LastName: lName,
      SigneeID: SigneeID,
      LocationID: req.ctx.locationId,
    },
  });

  if (existing) return res.json(existing);

  const newChild = await db.Player.create({
    FirstName: fName,
    LastName: lName,
    SigneeID: SigneeID,
    Email,
    LocationID: req.ctx.locationId,
  });

  res.status(201).json(newChild);
});

// POST: Create new player
exports.create = asyncHandler(async (req, res) => {
  if (!req.ctx.locationId)
    return res.status(403).json({ message: "Missing location scope" });

  const { FirstName, LastName, Email, ...rest } = req.body;

  // Validation
  if (!FirstName || typeof FirstName !== "string" || !FirstName.trim()) {
    return res.status(400).json({
      message: "FirstName is required and must be a non-empty string",
    });
  }
  if (!LastName || typeof LastName !== "string" || !LastName.trim()) {
    return res
      .status(400)
      .json({ message: "LastName is required and must be a non-empty string" });
  }
  if (!Email || typeof Email !== "string" || !Email.trim()) {
    return res
      .status(400)
      .json({ message: "Email is required and must be a non-empty string" });
  }

  const playerData = {
    FirstName: FirstName.trim(),
    LastName: LastName.trim(),
    Email: Email.trim(),
    ...rest,
    LocationID: req.ctx.locationId,
  };

  const player = await req.db.Player.create(playerData);
  res.status(201).json(player);
});

// GET: Find players (location-restricted)
exports.findAll = asyncHandler(async (req, res) => {
  const db = req.db;
  const where = {};

  if (req.query.email) where.email = req.query.email;
  else if (req.query.signeeid) where.SigneeID = req.query.signeeid;

  const locationId =
    req.locationScope || req.auth?.locationId || req.ctx?.locationId || null;

  const role = req.auth?.role || req.ctx?.role;

  if (role !== "admin" && locationId) {
    where.LocationID = locationId;
  }

  const players = await db.Player.findAll({ where });
  res.json(players);
});

// GET: Find one player (by ID or email)
exports.findOne = async (req, res, next) => {
  try {
    const db = req.db;
    const id = req.params.id;
    const { minimal } = req.query;

    const player = id.includes("@")
      ? await db.Player.findOne({ where: { Email: id } })
      : await db.Player.findByPk(id);

    if (!player) return res.status(404).json({ message: "Player not found" });

    const ctx = req.ctx || {};
    const userLoc = ctx.locationId ? String(ctx.locationId) : null;
    const playerLoc = player.LocationID ? String(player.LocationID) : null;

    if (!ctx.isAdmin && userLoc && playerLoc && userLoc !== playerLoc) {
      return res.status(403).json({
        message: "Forbidden: Player belongs to a different location",
        userLoc,
        playerLoc,
      });
    }

    if (!ctx.isAdmin && !userLoc) {
      return res.status(403).json({
        message: "Forbidden: Missing location scope in context",
      });
    }

    if (minimal === "true") {
      return res.json({
        PlayerID: player.PlayerID,
        FirstName: player.FirstName,
        LastName: player.LastName,
      });
    }

    res.json(player);
  } catch (err) {
    console.error("🔥 findOne crashed:", err); // 👈 log full error
    next(err);
  }
};

// PUT: Update player
exports.update = asyncHandler(async (req, res) => {
  const db = req.db;
  const [updated] = await db.Player.update(req.body, {
    where: { PlayerID: req.params.id },
  });
  if (!updated) return res.status(404).json({ message: "Player not found" });

  const record = await db.Player.findByPk(req.params.id);
  res.json(record);
});

// DELETE: Remove player (cascade children)
exports.delete = asyncHandler(async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Missing player ID" });
  }

  const player = await db.Player.findByPk(id);
  if (!player) {
    return res.status(404).json({ message: "Player not found" });
  }

  await player.destroy();
  res.json({ message: `Player ${id} deleted successfully` });
});

// GET: Get player with children by email
exports.getWithChildrenByEmail = asyncHandler(async (req, res) => {
  const email = req.params.email?.trim();
  if (!email || email.length < 3)
    return res.status(400).json({ message: "Invalid email input" });

  const db = req.db;
  const replacements = { email: `%${email}%` };
  const includeSignature = req.query.signature !== "false"; // 👈 new toggle

  const [parents] = await db.sequelize.query(
    `
    SELECT * FROM Players 
    WHERE email LIKE :email AND SigneeID = PlayerID
      ${req.ctx.locationId ? "AND LocationID = :loc" : ""}
    `,
    { replacements: { ...replacements, loc: req.ctx.locationId || null } }
  );

  if (!parents.length)
    return res.status(404).json({ message: "No matching players found" });

  const results = [];

  for (const parent of parents) {
    const [children] = await db.sequelize.query(
      `
      SELECT * FROM Players 
      WHERE SigneeID = :sid AND PlayerID != :sid
      ${req.ctx.locationId ? "AND LocationID = :loc" : ""}
      `,
      {
        replacements: { sid: parent.PlayerID, loc: req.ctx.locationId || null },
      }
    );

    const allIds = [parent.PlayerID, ...children.map((c) => c.PlayerID)];
    const [bands] = await db.sequelize.query(
      `
      SELECT * FROM WristbandTrans WHERE PlayerID IN (${allIds
        .map(() => "?")
        .join(",")})
      `,
      { replacements: allIds }
    );

    const wbMap = {};
    for (const wb of bands) {
      if (!wbMap[wb.PlayerID]) wbMap[wb.PlayerID] = [];
      wbMap[wb.PlayerID].push(
        includeSignature
          ? wb
          : (() => {
              const { Signature, ...rest } = wb;
              return rest;
            })()
      );
    }

    results.push({
      Parent: {
        ...parent,
        ...(includeSignature ? {} : { Signature: undefined }), // remove signature if false
        Wristbands: wbMap[parent.PlayerID] || [],
      },
      Children: children.map((c) => ({
        ...c,
        ...(includeSignature ? {} : { Signature: undefined }),
        Wristbands: wbMap[c.PlayerID] || [],
      })),
    });
  }

  res.json(results);
});

// GET: Get family by email (parents + children + wristbands)
exports.getFamilyByEmail = asyncHandler(async (req, res) => {
  const email = req.params.email?.trim();
  if (!email) return res.status(400).json({ message: "Invalid email input" });

  const db = req.db;
  const [parents] = await db.sequelize.query(
    `
    SELECT * FROM Players 
    WHERE email = :email AND SigneeID = PlayerID
      ${req.ctx.locationId ? "AND LocationID = :loc" : ""}
    `,
    { replacements: { email, loc: req.ctx.locationId || null } }
  );

  if (!parents.length) {
    // Instead of returning 404, return an empty array for the frontend
    return res.json([]);
  }

  // Get all parent IDs
  const parentIds = parents.map((p) => p.PlayerID);

  // Query children
  const [children] = await db.sequelize.query(
    `
    SELECT * FROM Players 
    WHERE SigneeID IN (:parentIds) AND SigneeID != PlayerID
    `,
    { replacements: { parentIds } }
  );

  // Query wristbands
  const [wristbands] = await db.sequelize.query(
    `
    SELECT * FROM WristbandTrans 
    WHERE PlayerID IN (:allIds)
    `,
    {
      replacements: {
        allIds: [...parentIds, ...children.map((c) => c.PlayerID)],
      },
    }
  );

  // Combine family data
  const families = parents.map((parent) => ({
    Parent: {
      ...parent,
      Wristbands: wristbands.filter((w) => w.PlayerID === parent.PlayerID),
    },
    Children: children
      .filter((c) => c.SigneeID === parent.PlayerID)
      .map((c) => ({
        ...c,
        Wristbands: wristbands.filter((w) => w.PlayerID === c.PlayerID),
      })),
  }));

  return res.json(families);
});

// GET: Find players (basic)
exports.findPaged = asyncHandler(async (req, res) => {
  const db = req.db;
  const sequelize = db.sequelize;

  // parse & sanitize params
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 10);
  const offset = (page - 1) * pageSize;

  const validOnly = req.query.validOnly === "true";
  const masterOnly = req.query.masterOnly === "true";
  const playingNow = req.query.playingNow === "true";

  const search = decodeURIComponent(req.query.search || "")
    .trim()
    .replace(/'/g, "''")
    .replace(/[%_]/g, (char) => `\\${char}`);

  const sortByRaw = (req.query.sortBy || "PlayerID").toLowerCase();
  const sortDirRaw = (req.query.sortDir || "DESC").toUpperCase();

  const allowedSortColumns = {
    playerid: "p.PlayerID",
    firstname: "p.FirstName",
    lastname: "p.LastName",
    email: "p.email",
    dateofbirth: "p.DateOfBirth",
    signeeid: "p.SigneeID",
  };
  const orderColumn = allowedSortColumns[sortByRaw] || "p.PlayerID";
  const orderDir = sortDirRaw === "ASC" ? "ASC" : "DESC";

  // build WHERE clauses
  const wh = [];

  // location filter (if context exists)
  if (req.ctx?.locationId) {
    wh.push(`p.LocationID = ${req.ctx.locationId}`);
  }

  // search filter
  if (search) {
    const searchTerms = search.split(/\s+/).filter((t) => t.length > 0);
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(
        (term) => `(
          p.FirstName LIKE '%${term}%' ESCAPE '\\'
          OR p.LastName LIKE '%${term}%' ESCAPE '\\'
          OR p.email LIKE '%${term}%' ESCAPE '\\'
          OR CAST(p.PlayerID AS VARCHAR) LIKE '%${term}%' ESCAPE '\\'
        )`
      );
      wh.push(`(${searchConditions.join(" AND ")})`);
    }
  }

  // validOnly filter
  if (validOnly) {
    wh.push(`
      p.PlayerID IN (
        SELECT DISTINCT wt.PlayerID
        FROM WristbandTrans wt
        WHERE wt.wristbandStatusFlag IN ('R','V')
          AND wt.playerStartTime <= GETUTCDATE()
          AND wt.playerEndTime   >= GETUTCDATE()
      )
    `);
  }

  // playingNow filter (valid within same day)
  if (playingNow) {
    wh.push(`
      p.PlayerID IN (
        SELECT DISTINCT wt.PlayerID
        FROM WristbandTrans wt
        WHERE wt.wristbandStatusFlag IN ('R','V')
          AND wt.playerStartTime <= GETUTCDATE()
          AND wt.playerEndTime   >= GETUTCDATE()
          AND DATEDIFF(DAY, wt.playerStartTime, wt.playerEndTime) <= 1
      )
    `);
  }

  // masterOnly filter (valid 10+ day wristbands)
  if (masterOnly) {
    wh.push(`
      p.PlayerID IN (
        SELECT DISTINCT wt.PlayerID
        FROM WristbandTrans wt
        WHERE DATEDIFF(DAY, wt.playerStartTime, wt.playerEndTime) >= 10
          AND wt.wristbandStatusFlag IN ('R','V')
      )
    `);
  }

  const whereClause = wh.length ? `WHERE ${wh.join(" AND ")}` : "";

  const sql = `
    SELECT 
      p.PlayerID,
      p.FirstName,
      p.LastName,
      p.DateOfBirth,
      p.email,
      p.SigneeID,
      COUNT(*) OVER() AS total
    FROM Players p
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${pageSize} ROWS ONLY;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT });
  const total = rows.length ? rows[0].total : 0;

  res.json({
    total,
    page,
    pageSize,
    players: rows.map(({ total, ...p }) => p),
  });
});

// GET: Get email suggestions
exports.getEmailSuggestions = asyncHandler(async (req, res) => {
  const prefix = req.query.prefix?.trim();
  if (!prefix || prefix.length < 2)
    return res.status(400).json({ message: "Prefix too short" });

  const db = req.db;
  const [rows] = await db.sequelize.query(
    `
    SELECT DISTINCT TOP 10 email
    FROM Players
    WHERE email LIKE :search AND email IS NOT NULL AND email != ''
    ${req.ctx.locationId ? "AND LocationID = :loc" : ""}
    ORDER BY email ASC
  `,
    { replacements: { search: `${prefix}%`, loc: req.ctx.locationId || null } }
  );

  res.json(rows.map((r) => r.email));
});
