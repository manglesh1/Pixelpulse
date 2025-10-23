module.exports = (sequelize, DataTypes) => {
  const GamesVariant = sequelize.define('GamesVariant', {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    variantDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Levels: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    BackgroundImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    iconImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    video: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    MaxIterations: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    MaxIterationTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    MaxLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ReductionTimeEachLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    introAudio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    introAudioText: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    IsActive: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    GameId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    GameType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  }, {
    tableName: 'GamesVariants',
  });

  GamesVariant.associate = (models) => {
    GamesVariant.belongsTo(models.Game, {
      foreignKey: 'GameId',
      as: 'Game',
    });
  };

  return GamesVariant;
};
