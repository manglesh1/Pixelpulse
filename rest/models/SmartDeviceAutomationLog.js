module.exports = (sequelize, DataTypes) => {
  const SmartDeviceAutomationLog = sequelize.define(
    "SmartDeviceAutomationLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      automationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "SmartDeviceAutomations", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      deviceAlias: { type: DataTypes.STRING(100), allowNull: false },
      macAddress: { type: DataTypes.STRING(17), allowNull: true },
      resolvedIp: { type: DataTypes.STRING(45), allowNull: true },

      event: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [["on", "off", "skip", "error", "override"]],
        },
      },

      reason: { type: DataTypes.STRING(160), allowNull: true },

      contextJson: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const raw = this.getDataValue("contextJson");
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        set(val) {
          this.setDataValue(
            "contextJson",
            val == null ? null : JSON.stringify(val)
          );
        },
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "SmartDeviceAutomationLogs",
      updatedAt: false,
      indexes: [
        { fields: ["automationId", "createdAt"] },
        { fields: ["createdAt"] },
        { fields: ["event"] },
      ],
      hooks: {
        beforeValidate: (row) => {
          if (row.macAddress) {
            row.macAddress =
              row.macAddress
                .toUpperCase()
                .replace(/[^0-9A-F]/g, "")
                .match(/.{1,2}/g)
                ?.join(":") || row.macAddress;
          }
        },
      },
      defaultScope: { order: [["createdAt", "DESC"]] },
      scopes: {
        recent: (limit = 200) => ({
          limit,
          order: [["createdAt", "DESC"]],
        }),
      },
    }
  );

  SmartDeviceAutomationLog.associate = (models) => {
    SmartDeviceAutomationLog.belongsTo(models.SmartDeviceAutomation, {
      foreignKey: "automationId",
      as: "automation",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return SmartDeviceAutomationLog;
};
