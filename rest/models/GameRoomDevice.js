module.exports = (sequelize, DataTypes) => {
    const GameRoomDevice = sequelize.define('GameRoomDevice', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      GameID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Games',
          key: 'GameID'
        },
        onDelete: 'CASCADE'
      },
      deviceId: {
        type: DataTypes.STRING,       // e.g., 'restartButton', 'doorLock', 'ledController1'
        allowNull: false
      },
      deviceType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      comPort: {
        type: DataTypes.STRING,
        allowNull: false
      },
      baudRate: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      parity: {
        type: DataTypes.STRING,
        allowNull: true
      },
      stopBits: {
        type: DataTypes.STRING,
        allowNull: true
      },
      dataBits: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isOptional: {
        type: DataTypes.BOOLEAN,
        allowNull: true      
      }
    }, {
      timestamps: true,
      tableName: 'GameRoomDevices'
    });
  
  GameRoomDevice.associate = (models) => {
    GameRoomDevice.belongsTo(models.Game, {
      foreignKey: 'GameID',
      as: 'game',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };
  
    return GameRoomDevice;
  };
  