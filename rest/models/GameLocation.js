module.exports = (sequelize, DataTypes) => {
  const GameLocation = sequelize.define(
    "GameLocation",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      GameID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Games", key: "GameID" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      LocationID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Locations", key: "LocationID" },
        onDelete: "NO ACTION",
        onUpdate: "CASCADE",
      },

      alias: { type: DataTypes.STRING(100), allowNull: true },
      isEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },

      IpAddress: { type: DataTypes.STRING, allowNull: true },
      LocalPort: { type: DataTypes.INTEGER, allowNull: true },
      RemotePort: { type: DataTypes.INTEGER, allowNull: true },
      SocketBReceiverPort: { type: DataTypes.INTEGER, allowNull: true },
      NoOfControllers: { type: DataTypes.INTEGER, allowNull: true },
      NoOfLedPerDevice: { type: DataTypes.INTEGER, allowNull: true },
      MaxPlayers: { type: DataTypes.INTEGER, allowNull: true },
      SmartPlugIP: { type: DataTypes.STRING(20), allowNull: true },
      columns: { type: DataTypes.INTEGER, allowNull: true },

      /**
       * Free-form JSON bag for per-game, per-location settings that don't
       * fit as dedicated columns. Example:
       *   { "laserTransport": "serial", "customField": "value" }
       */
      config: {
        // SQL Server has no native JSON type; store as TEXT/NVARCHAR(MAX) and
        // parse/stringify in the model so callers always get an object.
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        get() {
          const raw = this.getDataValue("config");
          if (!raw) return null;
          try {
            return typeof raw === "string" ? JSON.parse(raw) : raw;
          } catch {
            return null;
          }
        },
        set(v) {
          this.setDataValue(
            "config",
            v == null ? null : typeof v === "string" ? v : JSON.stringify(v)
          );
        },
      },
    },
    {
      tableName: "GameLocations",
      indexes: [
        { unique: true, fields: ["GameID", "LocationID"] },
        { fields: ["LocationID", "isEnabled"] },
        { fields: ["GameID"] },
      ],
    }
  );

  GameLocation.associate = (models) => {
    GameLocation.belongsTo(models.Game, { foreignKey: "GameID", as: "game" });
    GameLocation.belongsTo(models.Location, {
      foreignKey: "LocationID",
      as: "location",
    });

    GameLocation.hasMany(models.GameRoomDevice, {
      foreignKey: "GameLocationID",
      as: "devices",
    });
    GameLocation.hasMany(models.SmartDeviceAutomation, {
      foreignKey: "GameLocationID",
      as: "automations",
    });
    GameLocation.hasMany(models.LocationVariant, {
      foreignKey: "GameLocationID",
      as: "locationVariants",
    });
  };

  return GameLocation;
};
