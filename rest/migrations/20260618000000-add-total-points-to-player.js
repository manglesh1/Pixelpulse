"use strict";

/**
 * Adds a persisted `TotalPoints` accumulator to Players.
 *
 * Holds the lifetime sum of every game score the player has earned. Each game
 * completion increments it in playerScore.controller.addPlayerScores, and
 * wristbandTran.controller.getPlaySummary returns it as `totalScore` so the
 * kiosk shows the running total next to the player's name on scan-in.
 *
 * Existing players are backfilled from the sum of their PlayerScores so no one
 * starts back at zero.
 */
module.exports = {
  async up({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "Players"
        ADD COLUMN IF NOT EXISTS "TotalPoints" INTEGER NOT NULL DEFAULT 0;
    `);

    // Backfill from existing scores so current players keep their history.
    await sequelize.query(`
      UPDATE "Players" p
        SET "TotalPoints" = COALESCE((
          SELECT SUM(ps."Points")
          FROM "PlayerScores" ps
          WHERE ps."PlayerID" = p."PlayerID"
        ), 0);
    `);
  },

  async down({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "Players" DROP COLUMN IF EXISTS "TotalPoints";
    `);
  },
};
