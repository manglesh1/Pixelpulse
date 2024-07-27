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
        type: DataTypes.STRING(500),
        allowNull: true
      },
      gameDescription: {
        type: DataTypes.STRING(500)
      }
      
    });
    return Game;
  };
  