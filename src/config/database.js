const { Sequelize } = require("sequelize");
require("dotenv").config();
const moment = require("moment");
const fs = require("fs");

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    timezone: "+00:00",
    logging: (sql, time) => {
      if (process.env.APP_ENABLE_DB_LOG === "true") {
        fs.writeFileSync(
          `./logs/db/${moment().format("YYYY_MM_DD")}.log`,
          `[${moment().format("YYYY-MM-DD HH:MM:SS Z")}] : ${sql}\n`,
          { flag: "a" }
        );
      }
    },
  }
);

db.authenticate()
  .then(() => {
    console.log(`Connection to db has been established successfully.`);
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err.message);
  });
module.exports = db;
