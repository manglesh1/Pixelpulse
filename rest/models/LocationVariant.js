module.exports = (sequelize, DataTypes) => {
  const LocationVariant = sequelize.define(
    "LocationVariant",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      GamesVariantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "GamesVariants", key: "ID" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      LocationID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Locations", key: "LocationID" },
        onDelete: "NO ACTION",
        onUpdate: "CASCADE",
      },
      GameLocationID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "GameLocations", key: "id" },
        onDelete: "NO ACTION",
        onUpdate: "CASCADE",
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      customConfigJson: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const raw = this.getDataValue("customConfigJson");
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        set(v) {
          this.setDataValue(
            "customConfigJson",
            v == null ? null : JSON.stringify(v)
          );
        },
      },
    },
    {
      tableName: "LocationVariants",
      indexes: [
        {
          unique: true,
          fields: ["GamesVariantId", "LocationID", "GameLocationID"],
        },
        { fields: ["LocationID", "isActive"] },
      ],
      hooks: {
        async beforeValidate(row, options) {
          // Skip entirely if caller asks (used by backfill)
          if (options?.hooks === false || process.env.SKIP_LV_HOOKS === "1")
            return;

          const { GamesVariant, GameLocation } = sequelize.models;

          // If a specific room is set, compare only when both GameIDs are non-null
          if (row.GameLocationID) {
            const [variant, gl] = await Promise.all([
              GamesVariant.findByPk(row.GamesVariantId, {
                attributes: ["GameID"],
                transaction: options?.transaction,
              }),
              GameLocation.findByPk(row.GameLocationID, {
                attributes: ["GameID"],
                transaction: options?.transaction,
              }),
            ]);
            if (
              variant?.GameID != null &&
              gl?.GameID != null &&
              variant.GameID !== gl.GameID
            ) {
              throw new Error(
                "LocationVariant integrity: variant.GameID !== room.GameID"
              );
            }
            return; // ok if either side is null
          }

          // No room set: only enforce if the variant has a GameID
          const variant = await GamesVariant.findByPk(row.GamesVariantId, {
            attributes: ["GameID"],
            transaction: options?.transaction,
          });
          if (!variant || variant.GameID == null) return;

          const exists = await sequelize.models.GameLocation.findOne({
            where: { GameID: variant.GameID, LocationID: row.LocationID },
            attributes: ["id"],
            transaction: options?.transaction,
          });
          if (!exists)
            throw new Error(
              "LocationVariant integrity: Game is not assigned to this Location (missing GameLocation)."
            );
        },
      },
    }
  );

  LocationVariant.associate = (models) => {
    LocationVariant.belongsTo(models.GamesVariant, {
      foreignKey: "GamesVariantId",
      as: "variant",
    });
    LocationVariant.belongsTo(models.Location, {
      foreignKey: "LocationID",
      as: "location",
    });
    LocationVariant.belongsTo(models.GameLocation, {
      foreignKey: "GameLocationID",
      as: "room",
      constraints: false,
    });
  };

  return LocationVariant;
};
