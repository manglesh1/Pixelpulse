module.exports = (sequelize, DataTypes) => {
  const GameroomType = sequelize.define('GameroomType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomtypeCode: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    roomDescription: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'GameroomTypes', // Ensure this matches your table name
    timestamps: true
  });
  return GameroomType;
};
