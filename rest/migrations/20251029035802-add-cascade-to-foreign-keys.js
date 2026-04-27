"use strict";

module.exports = {
  async up({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    // GameLocations → Locations
    await sequelize.query(`
      ALTER TABLE "GameLocations" DROP CONSTRAINT IF EXISTS "FK_GameLocations_Locations";
      ALTER TABLE "GameLocations"
        ADD CONSTRAINT "FK_GameLocations_Locations"
        FOREIGN KEY ("LocationID") REFERENCES "Locations"("LocationID")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    // Players → Locations
    await sequelize.query(`
      ALTER TABLE "Players" DROP CONSTRAINT IF EXISTS "FK_Players_Locations";
      ALTER TABLE "Players"
        ADD CONSTRAINT "FK_Players_Locations"
        FOREIGN KEY ("LocationID") REFERENCES "Locations"("LocationID")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    // WristbandTrans → Locations
    await sequelize.query(`
      ALTER TABLE "WristbandTrans" DROP CONSTRAINT IF EXISTS "FK_WristbandTrans_Locations";
      ALTER TABLE "WristbandTrans"
        ADD CONSTRAINT "FK_WristbandTrans_Locations"
        FOREIGN KEY ("LocationID") REFERENCES "Locations"("LocationID")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
  },

  async down({ context: queryInterface }) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE "GameLocations" DROP CONSTRAINT IF EXISTS "FK_GameLocations_Locations";
    `);

    await sequelize.query(`
      ALTER TABLE "Players" DROP CONSTRAINT IF EXISTS "FK_Players_Locations";
    `);

    await sequelize.query(`
      ALTER TABLE "WristbandTrans" DROP CONSTRAINT IF EXISTS "FK_WristbandTrans_Locations";
    `);
  },
};
