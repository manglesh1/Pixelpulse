"use strict";

/**
 * Adds a nullable `config` column to GameLocations.
 *
 * Holds free-form per-game, per-location settings (laser transport choice,
 * firmware overrides, etc.). The model uses DataTypes.TEXT and JSON.parses
 * in the getter, so we just need a plain nullable text column here.
 */
module.exports = {
  async up({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "GameLocations"
        ADD COLUMN IF NOT EXISTS "config" TEXT NULL;
    `);
  },

  async down({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "GameLocations" DROP COLUMN IF EXISTS "config";
    `);
  },
};
