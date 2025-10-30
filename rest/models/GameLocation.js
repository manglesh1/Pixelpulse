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
