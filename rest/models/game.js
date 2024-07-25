module.exports = (sequelize, DataTypes) => {
    const Game = sequelize.define('Game', {
      GameID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      gameCode: {
        type: DataTypes.STRING(20)
       
      },
      gameName: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      backgroundImage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      gameDescription: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
      ,
      updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false
      }
    });
    return Game;
  };
  