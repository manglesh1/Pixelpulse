module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    PlayerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    FirstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    LastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    DateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Signature: {
      type: DataTypes.TEXT, // Stores the signature as a base64 encoded string    
    },
    DateSigned: {
      type: DataTypes.DATE,     
      defaultValue: DataTypes.NOW,
    },
    SigneeID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Players', // Name of the target model
        key: 'PlayerID', // Key in the target model that SigneeID references
      }
    }
  });
  Player.associate = (models) => {
    // Self-associations (Parent/Child)
    Player.hasMany(models.Player, {
      as: 'SignedPlayers',
      foreignKey: 'SigneeID',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Player.belongsTo(models.Player, {
      as: 'Signer',
      foreignKey: 'SigneeID',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Wristbands
    Player.hasMany(models.WristbandTran, {
      as: 'wristbands',
      foreignKey: 'PlayerID',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // PlayerScores
    Player.hasMany(models.PlayerScore, {
      as: 'playerScores',
      foreignKey: 'PlayerID',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };
  return Player;
};
