module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define("ApiKey", {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.Location, { foreignKey: "locationId" });
  };

  return ApiKey;
};
