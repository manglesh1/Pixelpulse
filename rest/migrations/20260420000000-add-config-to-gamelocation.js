"use strict";

/**
 * Adds a nullable JSON `config` column to the GameLocations table.
 *
 * The column holds free-form per-game, per-location settings (e.g. which
 * laser transport a LaserEscape-style game should use, custom firmware
 * overrides, etc.). On SQL Server, Sequelize's DataTypes.JSON maps to
 * NVARCHAR(MAX) and handles serialization in the app layer.
 */
module.exports = {
  async up({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE Name = N'config'
          AND Object_ID = Object_ID(N'GameLocations')
      )
      ALTER TABLE [GameLocations]
      ADD [config] NVARCHAR(MAX) NULL;
    `);
  },

  async down({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE Name = N'config'
          AND Object_ID = Object_ID(N'GameLocations')
      )
      ALTER TABLE [GameLocations] DROP COLUMN [config];
    `);
  },
};
