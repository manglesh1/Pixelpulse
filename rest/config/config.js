
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
