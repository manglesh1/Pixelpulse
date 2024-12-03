require('dotenv').config({ path: './.env' });;

module.exports = {
  development: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
    host: process.env.DATABASE_HOST,
	  // host: "127.0.0.1",
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: true,
        enableArithAbort: true
      }
    }
  }
};
// module.exports = {
//   development: {
//     username: "postgres",
//     password: "postgres",
//     database: "pixelpulse",
//     host: "localhost",  // Change host if necessary
//     dialect: 'postgres',
//     dialectOptions: {
//       ssl: false // Optional, depending on your setup
//     }
//   }
// };

