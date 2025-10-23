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
      type: DataTypes.TEXT
    },
    releaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    platforms: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    MaxPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false
      //,      defaultValue: 5
    },
    IpAddress: {
      type: DataTypes.STRING,
      allowNull: false
      //,      defaultValue: "127.0.0.1"
    },
    LocalPort: {
      type: DataTypes.INTEGER,
      allowNull: false //,      defaultValue: 21
    },
    RemotePort: {
      type: DataTypes.INTEGER,
      allowNull: false//,      defaultValue: 7113
    },
    SocketBReceiverPort: {
      type: DataTypes.INTEGER,
      allowNull: false//,      defaultValue: 20105
    },
    NoOfControllers: {
      type: DataTypes.INTEGER,
      allowNull: false //,      defaultValue: 1
    },
    NoofLedPerdevice: {
      type: DataTypes.INTEGER,
      allowNull: false//,      defaultValue: 1
    },
	
    SmartPlugip: {
      type: DataTypes.STRING(20),
      allowNull: true//,      defaultValue: 1
    },
    columns: {
      type: DataTypes.INTEGER,
      allowNull: true //,      defaultValue: 14
    },
    LocationID: {
      type: DataTypes.INTEGER,
      allowNull: true, // change back to false after migration
      references: {
        model: 'Locations',
        key: 'LocationID'
      }
    }
  });

  Game.associate = (models) => {
    Game.belongsTo(models.Location, {
      foreignKey: 'LocationID',
      as: 'location',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Game.hasMany(models.GamesVariant, {
      foreignKey: 'GameID',
      as: 'variants',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Game.hasMany(models.PlayerScore, {
      foreignKey: 'GameID',
      as: 'playerScores',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Game.hasMany(models.GameRoomDevice, {
      foreignKey: 'GameID',
      as: 'devices',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };
  
  return Game;
};
