module.exports = (sequelize, DataTypes) => {
  const PlayerScore = sequelize.define(
    "PlayerScore",
    {
      ScoreID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      PlayerID: { type: DataTypes.INTEGER, allowNull: false },
      GameID: { type: DataTypes.INTEGER, allowNull: false },
      GamesVariantId: { type: DataTypes.INTEGER, allowNull: false },
      WristbandTranID: { type: DataTypes.INTEGER, allowNull: false },
      LevelPlayed: { type: DataTypes.STRING(100), allowNull: true },
      numberOfPlayers: { type: DataTypes.INTEGER },
      Points: { type: DataTypes.INTEGER, allowNull: false },
      StartTime: { type: DataTypes.DATE },
      EndTime: { type: DataTypes.DATE },

      LocationID: {
        type: DataTypes.INTEGER,
        allowNull: false, // set true for migration; then false
        references: { model: "Locations", key: "LocationID" },
      },
      GameLocationID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "GameLocations", key: "id" },
      },
    },
    {
      indexes: [
        { fields: ["LocationID", "Points"] },
        { fields: ["LocationID", "StartTime"] },
        { fields: ["GameLocationID"] },
        { fields: ["GameID"] },
        { fields: ["GamesVariantId"] },
      ],
      defaultScope: {
        order: [
          ["Points", "DESC"],
          ["ScoreID", "DESC"],
        ],
      },
      scopes: {
        byLocation(locationId) {
          return { where: { LocationID: locationId } };
        },
        byRoom(gameLocationId) {
          return { where: { GameLocationID: gameLocationId } };
        },
        byVariant(variantId) {
          return { where: { GamesVariantId: variantId } };
        },
        topN(locationId, limit = 10) {
          return {
            where: { LocationID: locationId },
            order: [
              ["Points", "DESC"],
              ["ScoreID", "DESC"],
            ],
            limit,
          };
        },
        recent(locationId, limit = 50) {
          return {
            where: { LocationID: locationId },
            order: [
              ["StartTime", "DESC"],
              ["ScoreID", "DESC"],
            ],
            limit,
          };
        },
      },
      tableName: "PlayerScores",
    }
  );

  PlayerScore.associate = (models) => {
    PlayerScore.belongsTo(models.Player, {
      foreignKey: "PlayerID",
      as: "player",
    });
    PlayerScore.belongsTo(models.Game, { foreignKey: "GameID", as: "game" });
    PlayerScore.belongsTo(models.GamesVariant, {
      foreignKey: "GamesVariantId",
      as: "GamesVariant",
    });
    PlayerScore.belongsTo(models.WristbandTran, {
      foreignKey: "WristbandTranID",
      as: "WristbandTran",
    });

    PlayerScore.belongsTo(models.Location, {
      foreignKey: "LocationID",
      as: "location",
    });
    PlayerScore.belongsTo(models.GameLocation, {
      foreignKey: "GameLocationID",
      as: "room",
      constraints: false,
    });
  };

  return PlayerScore;
};
