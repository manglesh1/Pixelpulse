"use strict";

/**
 * Adds a nullable `config` column to Locations.
 *
 * Holds location-wide settings independent of which game is running
 * (doorlock, hand-scanner, restart button COM ports, etc.). Merged on the
 * server with GameLocation.config and LocationVariant.customConfigJson into
 * a single effectiveConfig. Model uses DataTypes.TEXT + JSON.parse on read.
 */
module.exports = {
  async up({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "Locations"
        ADD COLUMN IF NOT EXISTS "config" TEXT NULL;
    `);
  },

  async down({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "Locations" DROP COLUMN IF EXISTS "config";
    `);
  },
};
