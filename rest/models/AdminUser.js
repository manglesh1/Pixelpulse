module.exports = (sequelize, DataTypes) => {
  const AdminUser = sequelize.define('AdminUser', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
        isIn: [['user', 'manager', 'admin']],
    },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    LocationID: {
      type: DataTypes.INTEGER,
      allowNull: true, // change back to false after migration
      references: {
        model: 'Locations',
        key: 'LocationID'
      }
    }
  }, {
    tableName: 'AdminUsers',
    timestamps: true,
  });

  return AdminUser;
};
