module.exports = (sequelize, DataTypes) => {
    const GamesVariant = sequelize.define('GamesVariant', {
      ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      variantDescription: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      Levels: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      BackgroundImage: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      iconImage: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      video: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      GameId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Games', // Name of the Game model
          key: 'GameID'
        }
      }
    });
    // Define associations
    GamesVariant.associate = models => {
      GamesVariant.belongsTo(models.Game, { foreignKey: 'GameId' });
    };
    return GamesVariant;
  };

  