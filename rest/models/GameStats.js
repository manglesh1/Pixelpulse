module.exports = (sequelize, DataTypes) => {
  const GameStats = sequelize.define('GameStats', {
    StatID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    PlayerID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    GameID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    GamesVariantId: {
      type: DataTypes.INTEGER,
      allowNull: true, 
    },
    TotalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    HighestScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    AverageScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    GamesPlayed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
  GameStats.associate = models => {
    GameStats.belongsTo(models.Player, { foreignKey: 'PlayerID' });
    GameStats.belongsTo(models.Game, { foreignKey: 'GameID' });
    GameStats.belongsTo(models.GamesVariant, { foreignKey: 'GamesVariantId' });
  };

  return GameStats;
};
