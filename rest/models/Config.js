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
    
  });
   Config.associate = models => {
     Config.belongsTo(models.GamesVariant, { foreignKey: 'GamesVariantId' });
   };
  return Config;
};
