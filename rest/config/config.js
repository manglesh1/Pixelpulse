
module.exports = {
  development: {
    username: "admin",
    password: "Aero@password1",
    database: "games",
    host: "192.186.105.194",
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

