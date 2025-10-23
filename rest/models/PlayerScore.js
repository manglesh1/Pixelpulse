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
PlayerScore.associate = (models) => {
    PlayerScore.belongsTo(models.Player, {
      foreignKey: 'PlayerID',
      as: 'player',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    PlayerScore.belongsTo(models.Game, {
      foreignKey: 'GameID',
      as: 'game', // lowercase to match your Game model association
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    PlayerScore.belongsTo(models.GamesVariant, {
      foreignKey: 'GamesVariantId',
      as: 'GamesVariant',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    PlayerScore.belongsTo(models.WristbandTran, {
      foreignKey: 'WristbandTranID',
      as: 'WristbandTran',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };


  return PlayerScore;
};
