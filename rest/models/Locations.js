module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define("Location", {
    LocationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    City: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Province: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Postal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    /**
     * Location-wide settings (shared across all games at this location).
     * Good place for per-site hardware like doorlock, hand scanner,
     * restart button, etc. — anything that's the same regardless of
     * which game is running.
     *
     * Example:
     *   {
     *     "comPorts": [
     *       { "Name": "DOORLOCK",   "Port": "COM12", "BeudRate": 9600   },
     *       { "Name": "HANDSCANNER","Port": "COM3",  "BeudRate": 115200 },
     *       { "Name": "RESTART",    "Port": "COM14", "BeudRate": 9600   }
     *     ]
     *   }
     *
     * Merged with GameLocation.config (game-specific) and
     * LocationVariant.customConfigJson (variant-specific) on the server
     * into a single effectiveConfig.
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
  });

  Location.associate = (models) => {
    // One location has many GameLocation rows (rooms/installations)
    Location.hasMany(models.GameLocation, {
      foreignKey: "LocationID",
      as: "gameLocations",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Convenience many-to-many: Location <-> Game via GameLocation
    Location.belongsToMany(models.Game, {
      through: models.GameLocation,
      foreignKey: "LocationID",
      otherKey: "GameID",
      as: "games",
    });

    // Existing relations already defined elsewhere:
    // LocationVariant belongsTo Location (as 'location')
    // SmartDeviceAutomation, Player, WristbandTran, etc may reference LocationID
  };

  return Location;
};
