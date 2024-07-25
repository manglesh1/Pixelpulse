module.exports = (sequelize, DataTypes) => {
    const Player = sequelize.define('Player', {
      PlayerID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      FirstName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      LastName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      DateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    });
    return Player;
  };
  