module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define(
    "Game",
    {
      GameID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gameCode: { type: DataTypes.STRING(20) },
      gameName: { type: DataTypes.STRING(100), allowNull: true },
      backgroundImage: { type: DataTypes.STRING(500), allowNull: true },
      gameDescription: { type: DataTypes.TEXT },
      releaseDate: { type: DataTypes.DATE, allowNull: true },
      genre: { type: DataTypes.STRING(100), allowNull: true },
      platforms: { type: DataTypes.STRING(100), allowNull: true },

      // Global defaults (per-location overrides live in GameLocation)
      MaxPlayers: { type: DataTypes.INTEGER, allowNull: false },
      IpAddress: { type: DataTypes.STRING, allowNull: false },
      LocalPort: { type: DataTypes.INTEGER, allowNull: false },
      RemotePort: { type: DataTypes.INTEGER, allowNull: false },
      SocketBReceiverPort: { type: DataTypes.INTEGER, allowNull: false },
      NoOfControllers: { type: DataTypes.INTEGER, allowNull: false },
      NoofLedPerdevice: { type: DataTypes.INTEGER, allowNull: false },
      SmartPlugip: { type: DataTypes.STRING(20), allowNull: true },
      columns: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "Games" }
  );

  Game.associate = (models) => {
    Game.hasMany(models.GamesVariant, { foreignKey: "GameID", as: "variants" });

    // One Game has many installed locations (rooms) via GameLocation
    Game.hasMany(models.GameLocation, {
      foreignKey: "GameID",
      as: "locations",
    });

    // Convenience many-to-many: Game <-> Location via GameLocation
    Game.belongsToMany(models.Location, {
      through: models.GameLocation,
      foreignKey: "GameID",
      otherKey: "LocationID",
      as: "locationsDirect",
    });
  };

  return Game;
};
