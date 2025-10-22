module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Locations', {
    LocationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    City: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    State: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Zip: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Country: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Timezone: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  Location.associate = models => {
    Location.hasMany(models.Game, {
      foreignKey: 'LocationID',
      as: 'Game',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Location;
};
