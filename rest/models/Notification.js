module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      NotificationID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      WristbandTranID: {
        type: DataTypes.INTEGER,
        references: {
          model: 'WristbandTrans',
          key: 'WristbandTranID'
        }
      },
      GameID: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Games', 
          key: 'GameID'
        }
      },
      NotificationType: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      NotificationValue: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    });
  
    Notification.associate = function(models) {
      Notification.belongsTo(models.WristbandTran, { foreignKey: 'WristbandTranID', as: 'WristbandTran' });
      Notification.belongsTo(models.Game, { foreignKey: 'GameID', as: 'game' });
    };
  
    return Notification;
  };
  