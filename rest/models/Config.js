module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define("Config", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    configKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    configValue: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    GamesVariantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    LocationID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Locations", key: "LocationID" },
    },
  });
  Config.associate = (models) => {
    Config.belongsTo(models.GamesVariant, { foreignKey: "GamesVariantId" });
    Config.belongsTo(models.Location, {
      foreignKey: "LocationID",
      as: "location",
      constraints: false,
    });
  };
  return Config;
};
