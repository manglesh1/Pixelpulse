module.exports = (sequelize, DataTypes) => {
  const GameRoomDevice = sequelize.define(
    "GameRoomDevice",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      GameLocationID: {
        type: DataTypes.INTEGER,
        allowNull: false, // set to true during migration, then false
        references: { model: "GameLocations", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      // DEPRECATED: GameID (keep temporarily for migration/backfill)
      GameID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Games", key: "GameID" },
      },

      deviceId: { type: DataTypes.STRING, allowNull: false },
      deviceType: { type: DataTypes.STRING, allowNull: false },
      comPort: { type: DataTypes.STRING, allowNull: false },
      baudRate: { type: DataTypes.INTEGER, allowNull: true },
      parity: { type: DataTypes.STRING, allowNull: true },
      stopBits: { type: DataTypes.STRING, allowNull: true },
      dataBits: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.STRING, allowNull: true },
      isOptional: { type: DataTypes.BOOLEAN, allowNull: true },
    },
    {
      timestamps: true,
      tableName: "GameRoomDevices",
    }
  );

  GameRoomDevice.associate = (models) => {
    GameRoomDevice.belongsTo(models.GameLocation, {
      foreignKey: "GameLocationID",
      as: "room",
    });
    GameRoomDevice.belongsTo(models.Game, {
      foreignKey: "GameID",
      as: "game",
      constraints: false,
    }); // temp for migration
  };

  return GameRoomDevice;
};
