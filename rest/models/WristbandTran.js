module.exports = (sequelize, DataTypes) => {
  const WristbandTran = sequelize.define('WristbandTran', {
      WristbandTranID: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      src: {
          type: DataTypes.STRING(50)
      },
      wristbandCode: {
          type: DataTypes.STRING(200)
      },
      PosBookingid: {
          type: DataTypes.INTEGER,
          allowNull: true
      },
      WristbandTranDate: {
        type: 'DATETIME'
      },
      wristbandStatusFlag: {
          type: DataTypes.STRING(1)
      },
      CreatedDate: {
        type: 'DATETIME'
      },
      playerId: {
          type: DataTypes.INTEGER
      },
      playerStartDate: {
        type: 'DATETIME',
          allowNull: true
      },
      playerEndDate: {
        type: 'DATETIME',
          allowNull: true
      },
      GameroomTypeId: {
          type: DataTypes.INTEGER
      },
      updateDateTime: {
        type: 'DATETIME'
      }
  });

  WristbandTran.associate = models => {
      // Assuming PlayerScore should be WristbandTran based on your model's context
      WristbandTran.belongsTo(models.Player, { foreignKey: 'playerId' });
  };

  return WristbandTran;
};
