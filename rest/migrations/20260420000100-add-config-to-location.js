"use strict";

/**
 * Adds a nullable JSON `config` column to the Locations table.
 *
 * Stores location-wide settings that are the same regardless of which
 * game is running — e.g. doorlock, hand-scanner, restart button COM ports.
 * Merged on the server together with GameLocation.config and
 * LocationVariant.customConfigJson into a single effectiveConfig.
 */
module.exports = {
  async up({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE Name = N'config'
          AND Object_ID = Object_ID(N'Locations')
      )
      ALTER TABLE [Locations]
      ADD [config] NVARCHAR(MAX) NULL;
    `);
  },

  async down({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE Name = N'config'
          AND Object_ID = Object_ID(N'Locations')
      )
      ALTER TABLE [Locations] DROP COLUMN [config];
    `);
  },
};
