module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define('Config', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    configKey: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    configValue: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    GamesVariantId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false
      
    },
    CreatedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    timestamps: false, // Disable automatic createdAt and updatedAt timestamps
    tableName: 'config' // Optional: Specify the table name if different from model name
  });

  // Define associations if any (optional)
   Config.associate = models => {
     Config.belongsTo(models.GamesVariant, { foreignKey: 'GamesVariantId' });
   };
  return Config;
};
