module.exports = (sequelize, DataTypes) => {
    const WristbandTran = sequelize.define('WristbandTran', {
      WristbandTranID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wristbandCode: {
        type : DataTypes.STRING(200)
      },
      PosBookingid: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      WristbandTranDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      wristbandStatusFlag:{
        type: DataTypes.STRING(1) //I, R,P,C
      },
      CreatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      playerId: {
        type: DataTypes.INTEGER
      },
    
      playerStartDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      playerEndDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      GameroomTypeId: {
        type: DataTypes.INTEGER
       
      },
      updateDateTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false 
      }
});
WristbandTran.associate = models => {
  PlayerScore.belongsTo(models.Player, { foreignKey: 'PlayerID' }); 
};
  
    return WristbandTran;
  };
  