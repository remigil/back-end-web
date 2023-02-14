// const { Sequelize } = require("sequelize");
// require("dotenv").config();
// const moment = require("moment");
// const fs = require("fs");

// const dbEtilang = new Sequelize(
//   process.env.DB_NAME_ETILANG,
//   process.env.DB_USER_ETILANG,
//   process.env.DB_PASS_ETILANG,
//   {
//     host: process.env.DB_HOST_ETILANG,
//     dialect: process.env.DB_DIALECT_ETILANG,
//     port: process.env.DB_PORT_ETILANG,
//     dialectOptions: {
//       timezone: "+00:00",
//     },
//   }
// );

// dbEtilang
//   .authenticate()
//   .then(() => {
//     console.log(`Connection to Etilang has been established successfully.`);
//   })
//   .catch((err) => {
//     console.error("Unable to connect to the database ETILANG:", err.message);
//   });
// module.exports = dbEtilang;
