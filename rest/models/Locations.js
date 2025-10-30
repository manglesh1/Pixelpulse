module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define("Location", {
    LocationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    City: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Province: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Postal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  Location.associate = (models) => {
    // One location has many GameLocation rows (rooms/installations)
    Location.hasMany(models.GameLocation, {
      foreignKey: "LocationID",
      as: "gameLocations",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Convenience many-to-many: Location <-> Game via GameLocation
    Location.belongsToMany(models.Game, {
      through: models.GameLocation,
      foreignKey: "LocationID",
      otherKey: "GameID",
      as: "games",
    });

    // Existing relations already defined elsewhere:
    // LocationVariant belongsTo Location (as 'location')
    // SmartDeviceAutomation, Player, WristbandTran, etc may reference LocationID
  };

  return Location;
};
