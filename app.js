const express = require("express");
const app = express();
const router = require("./src/config/router");
const middlewareGlobal = require("./src/config/global_middleware");
const dotenv = require("dotenv");
const moment = require("moment");
const path = require("path");
const http = require("http");
const socketInstace = require("./src/config/socketConnetion");
const bodyParser = require("body-parser");
const fs = require("fs");

// const cronDikmaslantas = require("./src/controller/cron_dikmaslantas");
// const cronPenyebaran = require("./src/controller/cron_penyebaran");
// const cronLakalantas = require("./src/controller/cron_lakalantas");
// const cronGarlantas = require("./src/controller/cron_garlantas");
// const cronLakalanggar = require("./src/controller/cron_lakalanggar");
// const cronTurjagwali = require("./src/controller/cron_turjagwali");
// const cronSim = require("./src/controller/cron_sim");
// const cronStnk = require("./src/controller/cron_stnk");
// const cronBpkb = require("./src/controller/cron_bpkb");
// const cronRanmor = require("./src/controller/cron_ranmor");
// const cronLapmasyarakat = require("./src/controller/cron_lapMasyarakat");
// const cronLaporanHarian = require("./src/controller/cron_laporanHarian");

//console.log(options)
const server = http.createServer(app);
//const server = https.createServer(options,app);
dotenv.config();
const port = process.env.APP_PORT;
process.env.TZ = "Etc/Greenwich"; //locked to GMT

const staticFolder = JSON.parse(process.env.STATIC_FOLDER_PATHS ?? "[]");
if (typeof staticFolder !== "undefined" && staticFolder?.length > 0) {
  staticFolder.forEach((f) => {
    app.use(f.url, express.static(path.join(__dirname, f.path)));
  });
}
app.use(express.static(path.join(__dirname, "./public")));

socketInstace(server);
// socketInstace(server);

// Cronjob
// cronDikmaslantas.cronDikmaslantas();
// cronPenyebaran.cronPenyebaran();
// cronLakalantas.cronLakalantas();
// cronLaporanHarian.Laporan_Harian();
// cronGarlantas.cronGarlantas();
// cronLakalanggar.cronLakalanggar();
// cronTurjagwali.cronTurjagwali();
// cronSim.cronSim();
// cronStnk.cronStnk();
// cronBpkb.cronBpkb();
// cronRanmor.cronRanmor();
// cronLapmasyarakat.cronLapmasyarakat();

//ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/src/view"));

middlewareGlobal.beforeRouter(app);
app.use(router);
middlewareGlobal.afterRouter(app);
server.listen(port, () => {
  console.log("[SERVER]", `Start at ${moment()} on Port ${port}`);
});
//serverHttps.listen(3005, () => {
//  console.log("[SERVER]", `Start at ${moment()} on Port ${port}`);
//});
