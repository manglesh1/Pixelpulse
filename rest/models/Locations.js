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
  });

  Location.associate = (models) => {
    Location.hasMany(models.Game, {
      foreignKey: "LocationID",
      as: "games",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Location;
};
