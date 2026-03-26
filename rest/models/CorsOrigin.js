module.exports = (sequelize, DataTypes) => {
  const CorsOrigin = sequelize.define(
    "CorsOrigin",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      origin: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "CorsOrigins",
      timestamps: true,
    },
  );

  return CorsOrigin;
};
