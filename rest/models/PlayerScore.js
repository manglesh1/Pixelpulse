module.exports = (sequelize, DataTypes) => {
  const PlayerScore = sequelize.define('PlayerScore', {
    ScoreID: {
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
      allowNull: false,
    },
    GamesVariantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    WristbandTranID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    LevelPlayed: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    numberOfPlayers: {
      type: DataTypes.INTEGER,
    },
    Points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    StartTime: {
       type: DataTypes.DATE
     
    },
    EndTime: {
        type: DataTypes.DATE,
    
    },
  });

  // Define associations
  PlayerScore.associate = models => {
    PlayerScore.belongsTo(models.Player, { foreignKey: 'PlayerID' });
    PlayerScore.belongsTo(models.Game, { foreignKey: 'GameID' });
    PlayerScore.belongsTo(models.GamesVariant, { foreignKey: 'GamesVariantId' });
    PlayerScore.belongsTo(models.WristbandTran, { foreignKey: 'WristbandTranID' });
  };

  return PlayerScore;
};
