const asyncHandler = require("../middleware/asyncHandler");
const { Op, QueryTypes } = require("sequelize");

// POST: Create or find a parent player
exports.findOrCreate = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const FirstName = b.FirstName ?? b.firstName;
  const LastName = b.LastName ?? b.lastName;
  const Email = b.Email ?? b.email;

  if (!Email || !FirstName?.trim()) {
    return res
      .status(400)
      .json({ message: "Email and first name are required" });
  }

  if (!req.ctx.locationId) {
    return res.status(403).json({ message: "Missing location scope" });
  }

  const db = req.db;
  const normalizedEmail = Email.trim().toLowerCase();
  const fName = FirstName.trim();
  const lName = LastName?.trim() || "";

  const existingInCurrentLocation = await db.Player.findOne({
    where: {
      email: normalizedEmail,
      LocationID: req.ctx.locationId,
    },
  });

  const existingInOtherLocation = await db.Player.findOne({
    where: {
      email: normalizedEmail,
      LocationID: { [Op.ne]: req.ctx.locationId },
    },
  });

  // Block use of an email that already belongs to another location
  if (!existingInCurrentLocation && existingInOtherLocation) {
    return res.status(409).json({
      message: "This email is already used at another location. Please use a different email.",
      code: "EMAIL_OTHER_LOCATION",
    });
  }

  // If parent already exists in THIS location, return the parent record
  if (existingInCurrentLocation && existingInCurrentLocation.SigneeID) {
    const existingParent = await db.Player.findOne({
      where: {
        email: normalizedEmail,
        PlayerID: existingInCurrentLocation.SigneeID,
        LocationID: req.ctx.locationId,
      },
    });

    if (existingParent) {
      return res.json(existingParent);
    }
  }

  // Create new parent player in THIS location only
  const newPlayer = await db.Player.create({
    FirstName: fName,
    LastName: lName,
    email: normalizedEmail,
    Signature: b.Signature ?? null,
    DateSigned: b.DateSigned ?? new Date(),
    SigneeID: null,
    LocationID: req.ctx.locationId,
  });

  // Parent should always self-reference
  newPlayer.SigneeID = newPlayer.PlayerID;
  await newPlayer.save();

  return res.status(201).json(newPlayer);
});

// POST: Create or find a child player
exports.findOrCreateChild = asyncHandler(async (req, res) => {
  const b = req.body || {};

  const FirstName = b.FirstName ?? b.firstName;
  const LastName = b.LastName ?? b.lastName ?? " ";
  const Email = b.Email ?? b.email ?? null;
  const SigneeID = b.SigneeID ?? b.signeeId ?? b.signeeID ?? null;

  if (!SigneeID || !FirstName?.trim()) {
    return res
      .status(400)
      .json({ message: "Signee ID and first name are required" });
  }

  if (!req.ctx.locationId)
    return res.status(403).json({ message: "Missing location scope" });

  const db = req.db;
  const fName = FirstName.trim();
  const lName = (LastName || " ").trim() || " ";

  const existing = await db.Player.findOne({
    where: {
      FirstName: fName,
      LastName: lName,
      SigneeID,
      LocationID: req.ctx.locationId,
    },
  });

  if (existing) return res.json(existing);

  const newChild = await db.Player.create({
    FirstName: fName,
    LastName: lName,
    SigneeID,
    email: Email ? String(Email).trim().toLowerCase() : null, // <-- use "email" consistently
    LocationID: req.ctx.locationId,
  });

  return res.status(201).json(newChild);
});

// POST: Create new player
exports.create = asyncHandler(async (req, res) => {
  if (!req.ctx.locationId)
    return res.status(403).json({ message: "Missing location scope" });

  const { FirstName, LastName, Email, email, ...rest } = req.body;
  const normalizedEmail = Email ?? email;

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
  if (
    !normalizedEmail ||
    typeof normalizedEmail !== "string" ||
    !normalizedEmail.trim()
  ) {
    return res
      .status(400)
      .json({ message: "Email is required and must be a non-empty string" });
  }

  const playerData = {
    FirstName: FirstName.trim(),
    LastName: LastName.trim(),
    email: normalizedEmail.trim().toLowerCase(),
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

const waiverTableExists = async (sequelize) => {
  const rows = await sequelize.query(
    "SELECT to_regclass('public.waivers') AS table_name",
    { type: QueryTypes.SELECT },
  );
  return Boolean(rows[0]?.table_name);
};

const normalizeWaiverParticipant = (
  row,
  participant,
  index,
  role,
  { includeDetails = false } = {},
) => {
  const primary = row.primary_participant || {};
  const visit = row.visit || {};
  const email = participant.email || primary.email || "";
  const fullName =
    participant.fullLegalName ||
    [participant.firstName, participant.lastName].filter(Boolean).join(" ");

  const normalized = {
    waiverId: row.id,
    participantIndex: index,
    participantRole: role,
    source: "pixelpulse-web-waiver",
    FirstName: participant.firstName || "",
    LastName: participant.lastName || "",
    DateOfBirth: participant.dob || null,
    email,
    Email: email,
    fullName,
    phone: participant.phone || primary.phone || "",
    city: participant.city || primary.city || "",
    visitDate: visit.visitDate || "",
    visitTime: visit.visitTime || "",
    partyId: visit.partyId || "",
    partyName: visit.partyName || "",
    passType: visit.passType || "",
    submittedAt: row.submitted_at || row.submittedAt || null,
  };

  if (!includeDetails) return normalized;

  return {
    ...normalized,
    signatureDataUrl: row.signature_data_url || "",
    participant,
    primaryParticipant: primary,
  };
};

const getWaiverParticipant = async (sequelize, waiverId, participantIndex) => {
  if (!(await waiverTableExists(sequelize))) return null;

  const rows = await sequelize.query(
    `
    SELECT id, primary_participant, family_members, visit, signature_data_url, submitted_at
    FROM waivers
    WHERE id = :waiverId
    LIMIT 1
    `,
    { replacements: { waiverId }, type: QueryTypes.SELECT },
  );

  const row = rows[0];
  if (!row) return null;

  const members = Array.isArray(row.family_members) ? row.family_members : [];
  const index = Number(participantIndex) || 0;
  const participant = index === 0 ? row.primary_participant : members[index - 1];
  if (!participant) return null;

  return normalizeWaiverParticipant(
    row,
    participant,
    index,
    index === 0 ? "primary" : "family",
    { includeDetails: true },
  );
};

const reqLocationId = (dbOrReq) =>
  dbOrReq?.ctx?.locationId ||
  dbOrReq?.locationScope ||
  dbOrReq?.auth?.locationId ||
  null;

const ensureParentPlayerForWaiver = async (req, waiverParticipant) => {
  const db = req.db;
  const locationId = reqLocationId(req);
  const primary = waiverParticipant.primaryParticipant || waiverParticipant.participant || {};
  const email = (primary.email || waiverParticipant.email || "").trim().toLowerCase();
  const firstName = (primary.firstName || waiverParticipant.FirstName || "").trim();
  const lastName = (primary.lastName || waiverParticipant.LastName || " ").trim() || " ";

  if (!firstName || !email) {
    throw Object.assign(new Error("Primary waiver participant needs first name and email."), {
      statusCode: 400,
    });
  }

  let parent = await db.Player.findOne({
    where: {
      email,
      ...(locationId ? { LocationID: locationId } : {}),
    },
    order: [["PlayerID", "ASC"]],
  });

  if (parent?.SigneeID && parent.SigneeID !== parent.PlayerID) {
    const signer = await db.Player.findOne({
      where: {
        PlayerID: parent.SigneeID,
        ...(locationId ? { LocationID: locationId } : {}),
      },
    });
    if (signer) parent = signer;
  }

  if (!parent) {
    parent = await db.Player.create({
      FirstName: firstName,
      LastName: lastName,
      DateOfBirth: primary.dob || null,
      email,
      Signature: waiverParticipant.signatureDataUrl || null,
      DateSigned: waiverParticipant.submittedAt || new Date(),
      SigneeID: null,
      LocationID: locationId,
    });
    parent.SigneeID = parent.PlayerID;
    await parent.save();
  }

  return parent;
};

// GET: Website waiver participants waiting to be assigned in POS
exports.findWaiverParticipants = asyncHandler(async (req, res) => {
  const sequelize = req.db.sequelize;
  if (!(await waiverTableExists(sequelize))) {
    return res.json([]);
  }

  const search = String(req.query.search || "").trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);

  const rows = await sequelize.query(
    `
    SELECT id, primary_participant, family_members, visit, submitted_at
    FROM waivers
    ORDER BY submitted_at DESC NULLS LAST
    LIMIT :limit
    `,
    { replacements: { limit }, type: QueryTypes.SELECT },
  );

  const participants = rows.flatMap((row) => {
    const primary = row.primary_participant || {};
    const familyMembers = Array.isArray(row.family_members)
      ? row.family_members
      : [];

    return [
      normalizeWaiverParticipant(row, primary, 0, "primary"),
      ...familyMembers.map((member, index) =>
        normalizeWaiverParticipant(row, member, index + 1, "family"),
      ),
    ].filter((participant) => participant.FirstName || participant.LastName);
  });

  const filtered = search
    ? participants.filter((participant) =>
        [
          participant.FirstName,
          participant.LastName,
          participant.email,
          participant.waiverId,
          participant.partyName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    : participants;

  res.json(filtered);
});

// POST: Convert one website waiver participant into a POS player record
exports.importWaiverParticipant = asyncHandler(async (req, res) => {
  const { waiverId, participantIndex = 0 } = req.body || {};
  if (!waiverId) {
    return res.status(400).json({ message: "waiverId is required" });
  }

  const waiverParticipant = await getWaiverParticipant(
    req.db.sequelize,
    waiverId,
    participantIndex,
  );

  if (!waiverParticipant) {
    return res.status(404).json({ message: "Waiver participant not found" });
  }

  const db = req.db;
  const locationId = reqLocationId(req);
  const parent = await ensureParentPlayerForWaiver(req, waiverParticipant);

  if (Number(participantIndex) === 0) {
    return res.status(200).json({
      player: parent,
      source: "existing-or-created-primary",
    });
  }

  const firstName = waiverParticipant.FirstName.trim();
  const lastName = (waiverParticipant.LastName || " ").trim() || " ";
  if (!firstName) {
    return res.status(400).json({ message: "Participant first name is required" });
  }

  let child = await db.Player.findOne({
    where: {
      FirstName: firstName,
      LastName: lastName,
      SigneeID: parent.PlayerID,
      ...(locationId ? { LocationID: locationId } : {}),
    },
  });

  if (!child) {
    child = await db.Player.create({
      FirstName: firstName,
      LastName: lastName,
      DateOfBirth: waiverParticipant.DateOfBirth || null,
      email: waiverParticipant.email ? waiverParticipant.email.trim().toLowerCase() : null,
      Signature: waiverParticipant.signatureDataUrl || null,
      DateSigned: waiverParticipant.submittedAt || new Date(),
      SigneeID: parent.PlayerID,
      LocationID: locationId,
    });
  }

  res.status(200).json({
    player: child,
    parent,
    source: "existing-or-created-family",
  });
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
    console.error("🔥 findOne crashed:", err);
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
  const includeSignature = req.query.signature !== "false";

  const [parents] = await db.sequelize.query(
    `
    SELECT * FROM "Players"
    WHERE email LIKE :email AND "SigneeID" = "PlayerID"
      ${req.ctx.locationId ? `AND "LocationID" = :loc` : ""}
    `,
    { replacements: { ...replacements, loc: req.ctx.locationId || null } },
  );

  if (!parents.length)
    return res.status(404).json({ message: "No matching players found" });

  const results = [];

  for (const parent of parents) {
    const [children] = await db.sequelize.query(
      `
      SELECT * FROM "Players"
      WHERE "SigneeID" = :sid AND "PlayerID" != :sid
      ${req.ctx.locationId ? `AND "LocationID" = :loc` : ""}
      `,
      {
        replacements: { sid: parent.PlayerID, loc: req.ctx.locationId || null },
      },
    );

    const allIds = [parent.PlayerID, ...children.map((c) => c.PlayerID)];
    const [bands] = await db.sequelize.query(
      `
      SELECT * FROM "WristbandTrans" WHERE "PlayerID" IN (${allIds
        .map(() => "?")
        .join(",")})
      `,
      { replacements: allIds },
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
            })(),
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
    SELECT * FROM "Players"
    WHERE email = :email AND "SigneeID" = "PlayerID"
      ${req.ctx.locationId ? `AND "LocationID" = :loc` : ""}
    `,
    { replacements: { email, loc: req.ctx.locationId || null } },
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
    SELECT * FROM "Players"
    WHERE "SigneeID" IN (:parentIds) AND "SigneeID" != "PlayerID"
    `,
    { replacements: { parentIds } },
  );

  // Query wristbands
  const [wristbands] = await db.sequelize.query(
    `
    SELECT * FROM "WristbandTrans"
    WHERE "PlayerID" IN (:allIds)
    `,
    {
      replacements: {
        allIds: [...parentIds, ...children.map((c) => c.PlayerID)],
      },
    },
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
    playerid: `p."PlayerID"`,
    firstname: `p."FirstName"`,
    lastname: `p."LastName"`,
    email: `p.email`,
    dateofbirth: `p."DateOfBirth"`,
    signeeid: `p."SigneeID"`,
  };
  const orderColumn = allowedSortColumns[sortByRaw] || `p."PlayerID"`;
  const orderDir = sortDirRaw === "ASC" ? "ASC" : "DESC";

  // build WHERE clauses
  const wh = [];

  // location filter (if context exists)
  if (req.ctx?.locationId) {
    wh.push(`p."LocationID" = ${Number(req.ctx.locationId)}`);
  }

  // search filter
  if (search) {
    const searchTerms = search.split(/\s+/).filter((t) => t.length > 0);
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(
        (term) => `(
          p."FirstName" LIKE '%${term}%' ESCAPE '\\'
          OR p."LastName" LIKE '%${term}%' ESCAPE '\\'
          OR p.email LIKE '%${term}%' ESCAPE '\\'
          OR CAST(p."PlayerID" AS TEXT) LIKE '%${term}%' ESCAPE '\\'
        )`,
      );
      wh.push(`(${searchConditions.join(" AND ")})`);
    }
  }

  // validOnly filter
  if (validOnly) {
    wh.push(`
      p."PlayerID" IN (
        SELECT DISTINCT wt."PlayerID"
        FROM "WristbandTrans" wt
        WHERE wt."wristbandStatusFlag" IN ('R','V')
          AND wt."playerStartTime" <= NOW()
          AND wt."playerEndTime"   >= NOW()
      )
    `);
  }

  // playingNow filter (valid within same day)
  if (playingNow) {
    wh.push(`
      p."PlayerID" IN (
        SELECT DISTINCT wt."PlayerID"
        FROM "WristbandTrans" wt
        WHERE wt."wristbandStatusFlag" IN ('R','V')
          AND wt."playerStartTime" <= NOW()
          AND wt."playerEndTime"   >= NOW()
          AND (wt."playerEndTime"::date - wt."playerStartTime"::date) <= 1
      )
    `);
  }

  // masterOnly filter (valid 10+ day wristbands)
  if (masterOnly) {
    wh.push(`
      p."PlayerID" IN (
        SELECT DISTINCT wt."PlayerID"
        FROM "WristbandTrans" wt
        WHERE (wt."playerEndTime"::date - wt."playerStartTime"::date) >= 10
          AND wt."wristbandStatusFlag" IN ('R','V')
      )
    `);
  }

  const whereClause = wh.length ? `WHERE ${wh.join(" AND ")}` : "";

  const sql = `
    SELECT
      p."PlayerID",
      p."FirstName",
      p."LastName",
      p."DateOfBirth",
      p.email,
      p."SigneeID",
      COUNT(*) OVER() AS total
    FROM "Players" p
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDir}
    LIMIT ${pageSize} OFFSET ${offset};
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
    SELECT DISTINCT email
    FROM "Players"
    WHERE email LIKE :search AND email IS NOT NULL AND email != ''
    ${req.ctx.locationId ? `AND "LocationID" = :loc` : ""}
    ORDER BY email ASC
    LIMIT 10
  `,
    { replacements: { search: `${prefix}%`, loc: req.ctx.locationId || null } },
  );

  res.json(rows.map((r) => r.email));
});
