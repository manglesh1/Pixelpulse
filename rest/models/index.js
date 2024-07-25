const Sequelize = require('sequelize');
const config = require('../config/config.js');
const env = 'development';
const sequelize = new Sequelize(config[env].database, config[env].username, config[env].password, {
  host: config[env].host,
  logging: console.log, // Enable logging to see the SQL queries
  dialect: config[env].dialect,dialectOptions: {
   
    options: {
      encrypt: false,
      enableArithAbort: true,
    }
}
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.GameroomType = require('./gameroomType')(sequelize, Sequelize);
db.Game = require('./game')(sequelize, Sequelize);
db.GamesVariant = require('./gamesVariant')(sequelize, Sequelize);
db.Config = require('./config')(sequelize, Sequelize);
db.Player = require('./player')(sequelize, Sequelize);
db.WristbandTran = require('./WristbandTran')(sequelize, Sequelize);
db.Notification = require('./notification')(sequelize, Sequelize);
db.PlayerScore = require('./playerScore')(sequelize, Sequelize);

db.sequelize.sync({ alter: true }) // or { force: true }
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
module.exports = db;
