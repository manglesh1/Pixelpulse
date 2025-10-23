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
        allowNull: false,
      },
      macAddress: {
        type: DataTypes.STRING(17),
        allowNull: true,
        validate: { len: [11, 23] },
      },
      deviceIp: {
        type: DataTypes.STRING(45),
        allowNull: true,
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

      // Behavior
      action: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      onDurationMs: { type: DataTypes.INTEGER, allowNull: false },
      minIntervalMs: { type: DataTypes.INTEGER, allowNull: false },
      stayOnWhileActive: { type: DataTypes.BOOLEAN, allowNull: false },
      requireActivePlayers: { type: DataTypes.BOOLEAN, allowNull: false },
      activeGraceMs: { type: DataTypes.INTEGER, allowNull: false },
      maxOnMs: { type: DataTypes.INTEGER, allowNull: true },

      // Scheduling
      cron: { type: DataTypes.STRING(100), allowNull: true },
      timezone: { type: DataTypes.STRING(64), allowNull: false },
      quietHoursJson: {
        type: DataTypes.TEXT,
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
          this.setDataValue(
            "quietHoursJson",
            val == null ? null : JSON.stringify(val)
          );
        },
      },

      // State tracking
      status: { type: DataTypes.STRING(20), allowNull: false },
      lastOnAt: { type: DataTypes.DATE, allowNull: true },
      lastOffAt: { type: DataTypes.DATE, allowNull: true },

      // Game linkage
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

      // Notes
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "SmartDeviceAutomations",
      indexes: [
        { fields: ["enabled"] },
        { fields: ["deviceAlias"] },
        { fields: ["macAddress"] },
        { fields: ["GameId"] },
        { fields: ["GamesVariantId"] },
        { fields: ["status"] },
        { fields: ["updatedAt"] },
      ],
      hooks: {
        beforeValidate: (row) => {
          if (row.macAddress) row.macAddress = normalizeMac(row.macAddress);
          if (row.cron === "") row.cron = null;
          if (row.deviceIp === "") row.deviceIp = null;

          // Default values
          row.adapter ??= "tplink";
          row.enabled ??= true;
          row.action ??= "power";
          row.onDurationMs ??= 240000;
          row.minIntervalMs ??= 1800000;
          row.stayOnWhileActive ??= false;
          row.requireActivePlayers ??= true;
          row.activeGraceMs ??= 0;
          row.timezone ||= "America/Toronto";
          row.status ||= "off";
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
    SmartDeviceAutomation.belongsTo(models.Game, {
      foreignKey: "GameId",
      as: "game",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    SmartDeviceAutomation.belongsTo(models.GamesVariant, {
      foreignKey: "GamesVariantId",
      as: "GamesVariant",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    SmartDeviceAutomation.hasMany(models.SmartDeviceAutomationLog, {
      foreignKey: "automationId",
      as: "logs",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  SmartDeviceAutomation.normalizeMac = normalizeMac;

  return SmartDeviceAutomation;
};
