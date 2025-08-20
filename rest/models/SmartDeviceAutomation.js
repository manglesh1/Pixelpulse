module.exports = (sequelize, DataTypes) => {
  const normalizeMac = (mac) =>
    (mac || "")
      .toUpperCase()
      .replace(/[^0-9A-F]/g, "")
      .match(/.{1,2}/g)
      ?.join(":") || null;

  const SmartDeviceAutomation = sequelize.define(
    "SmartDeviceAutomation",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // Targeting
      deviceAlias: {
        type: DataTypes.STRING(100),
        allowNull: false, // Keep a friendly label even when MAC is present
      },
      macAddress: {
        type: DataTypes.STRING(17), // AA:BB:CC:DD:EE:FF
        allowNull: true,
        validate: {
          len: [11, 23], // tolerate raw "AABB..." or with separators; we normalize in hooks
        },
      },
      deviceIp: {
        type: DataTypes.STRING(45),
        allowNull: true, // Resolved at runtime via discovery; optional fallback
      },
      adapter: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      // Enable/disable
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },

      // Behavior / policy
      action: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      onDurationMs: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      minIntervalMs: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stayOnWhileActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      requireActivePlayers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      activeGraceMs: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      maxOnMs: {
        type: DataTypes.INTEGER,
        allowNull: true, // optional safety cutoff
      },

      // Scheduling
      cron: {
        type: DataTypes.STRING(100),
        allowNull: true, // null/empty => always allowed (subject to other checks)
      },
      timezone: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      quietHoursJson: {
        // store JSON as text in MSSQL
        type: DataTypes.TEXT, // becomes NVARCHAR(MAX)
        allowNull: true,
        get() {
          const raw = this.getDataValue("quietHoursJson");
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        set(val) {
          if (val == null) return this.setDataValue("quietHoursJson", null);
          this.setDataValue("quietHoursJson", JSON.stringify(val));
        },
      },

      // State for dashboards / quick queries
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      lastOnAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastOffAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Optional scoping to your game content
      GameId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Games", key: "GameID" },
      },
      GamesVariantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "GamesVariants", key: "ID" },
      },

      // Notes / freeform
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "SmartDeviceAutomations", // default from name, but explicit is fine
      indexes: [
        { fields: ["enabled"] },
        { fields: ["deviceAlias"] },
        { fields: ["macAddress"] },
        { fields: ["GameId"] },
        { fields: ["GamesVariantId"] },
        { fields: ["status"] },
        { fields: ["updatedAt"] },
      ],
      // You can enforce row-level JSON schema in app layer if needed
      hooks: {
        beforeValidate: (row) => {
          if (row.macAddress) row.macAddress = normalizeMac(row.macAddress);
          if (row.cron === "") row.cron = null;
          if (row.deviceIp === "") row.deviceIp = null;

          if (row.adapter == null || row.adapter === "") row.adapter = "tplink";
          if (row.enabled == null) row.enabled = true;
          if (row.action == null || row.action === "") row.action = "power";
          if (row.onDurationMs == null) row.onDurationMs = 240000;
          if (row.minIntervalMs == null) row.minIntervalMs = 1800000;
          if (row.stayOnWhileActive == null) row.stayOnWhileActive = false;
          if (row.requireActivePlayers == null) row.requireActivePlayers = true;
          if (row.activeGraceMs == null) row.activeGraceMs = 0;
          if (row.timezone == null || row.timezone === "")
            row.timezone = "America/Toronto";
          if (row.status == null || row.status === "") row.status = "off";
        },
        beforeSave: (row) => {
          if (row.onDurationMs < 0) row.onDurationMs = 0;
          if (row.minIntervalMs < 0) row.minIntervalMs = 0;
          if (row.activeGraceMs < 0) row.activeGraceMs = 0;
          if (row.maxOnMs != null && row.maxOnMs < 0) row.maxOnMs = null;
        },
      },
    }
  );

  SmartDeviceAutomation.associate = (models) => {
    SmartDeviceAutomation.belongsTo(models.Game, { foreignKey: "GameId" });
    SmartDeviceAutomation.belongsTo(models.GamesVariant, {
      foreignKey: "GamesVariantId",
    });
    // If you add the logs model later:
    // SmartDeviceAutomation.hasMany(models.SmartDeviceAutomationLog, { foreignKey: 'automationId', as: 'logs' });
  };

  // Expose the helper if you want to reuse elsewhere
  SmartDeviceAutomation.normalizeMac = (mac) => normalizeMac(mac);

  return SmartDeviceAutomation;
};
