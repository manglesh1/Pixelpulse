module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define("Player", {
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
    // NOTE: the persisted lifetime accumulator lives in the DB column
    // "Players"."TotalPoints" (added by migration), but is intentionally NOT
    // declared as a model attribute. Declaring it would make every Player
    // query SELECT the column, so a missing/unmigrated column would break all
    // wristband scans. Instead it is read/written only via guarded raw SQL in
    // wristbandTran.controller.getPlaySummary and
    // playerScore.controller.addPlayerScores, both of which degrade gracefully
    // if the column is absent.
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
        model: "Players",
        key: "PlayerID",
      },
    },
    LocationID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Locations",
        key: "LocationID",
      },
    },
  });
  Player.associate = (models) => {
    // Self-associations (Parent/Child)
    Player.hasMany(models.Player, {
      as: "SignedPlayers",
      foreignKey: "SigneeID",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Player.belongsTo(models.Player, {
      as: "Signer",
      foreignKey: "SigneeID",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Player.belongsTo(models.Location, {
      as: "location",
      foreignKey: "LocationID",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Player.hasMany(models.WristbandTran, {
      as: "wristbands",
      foreignKey: "PlayerID",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Player.hasMany(models.PlayerScore, {
      as: "playerScores",
      foreignKey: "PlayerID",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };
  return Player;
};
