const db = require("../config/database");
const response = require("../lib/response");
const moment = require("moment");
const { Op, Sequelize, where } = require("sequelize");
const _ = require("lodash");
const { AESDecrypt } = require("../lib/encryption");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

// const LakaLantasMonth = require("../model/count_lakalantas_polda_month");
// const LakaLantasDay = require("../model/count_lakalantas_polda_day");

// const SimMonth = require("../model/count_sim_polda_month");
// const SimDay = require("../model/count_sim_polda_day");

// const GarlantasMonth = require("../model/count_garlantas_polda_month");
// const GarlantasDay = require("../model/count_garlantas_polda_day");

// const RanmorDay = require("../model/count_ranmor_polda_day");
// const RanmorMonth = require("../model/count_ranmor_polda_month");

// const Turjagwali = require("../model/count_turjagwali_polda_day");

let thisday = moment().subtract(0, "days");
let yesterday = moment().subtract(1, "days");
let thisweek = moment().subtract(6, "days").toDate();
let lastweek = moment().subtract(13, "days").toDate();
let thismonth = moment().endOf("month").format("YYYY-MM-DD");
let lastmonth = moment()
  .subtract(1, "month")
  .endOf("month")
  .format("YYYY-MM-DD");

let StartDateThisMonth = moment().startOf("month").format("YYYY-MM-DD");
let EndDateThisMonth = moment().endOf("month").format("YYYY-MM-DD");

let StartDateYesterdayMonth = moment()
  .subtract(1, "month")
  .startOf("month")
  .format("YYYY-MM-DD");
let EndDateYesterdayMonth = moment()
  .subtract(1, "month")
  .endOf("month")
  .format("YYYY-MM-DD");

let StartDateThisYear = moment().startOf("year").format("YYYY-MM-DD");
let EndDateThisYear = moment().endOf("year").format("YYYY-MM-DD");

let StartDateYesterdayYear = moment()
  .subtract(1, "year")
  .startOf("year")
  .format("YYYY-MM-DD");

let EndDateYesterdatYear = moment()
  .subtract(1, "year")
  .endOf("year")
  .format("YYYY-MM-DD");

let thisstartyear = moment().startOf("year").format("YYYY-MM-DD");
let thisendyear = moment().endOf("year").format("YYYY-MM-DD");
let laststartyear = moment()
  .subtract(1, "year")
  .startOf("year")
  .format("YYYY-MM-DD");
let lastendyear = moment()
  .subtract(1, "year")
  .endOf("year")
  .format("YYYY-MM-DD");

module.exports = class CountHomeMobileController {
  static kecelakaan = async (req, res) => {
    try {
      console.log(thisday, yesterday);
      let lakaPerhariKemarin = await LakaLantasDay.findAll({
        where: {
          date: yesterday,
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPerhariIni = await LakaLantasDay.findAll({
        where: {
          date: thisday,
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPermingguKemarin = await LakaLantasDay.findAll({
        where: {
          date: {
            [Op.between]: [lastweek, thisweek],
          },
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPermingguIni = await LakaLantasDay.findAll({
        where: {
          date: {
            [Op.gte]: thisweek,
          },
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPerbulanKemarin = await LakaLantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayMonth, EndDateYesterdayMonth],
          },
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPerbulanIni = await LakaLantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisMonth, EndDateThisMonth],
          },
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPertahunKemarin = await LakaLantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayYear, EndDateYesterdatYear],
          },
        },
        attributes: ["insiden_kecelakaan"],
      });

      let lakaPertahunIni = await LakaLantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisYear, EndDateThisYear],
          },
        },
        attributes: ["insiden_kecelakaan"],
      });

      let result_lakaPerhariKemarin =
        lakaPerhariKemarin.length > 0
          ? lakaPerhariKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPerhariIni =
        lakaPerhariIni.length > 0
          ? lakaPerhariIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPermingguKemarin =
        lakaPermingguKemarin.length > 0
          ? lakaPermingguKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPermingguIni =
        lakaPermingguIni.length > 0
          ? lakaPermingguIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPerbulanKemarin =
        lakaPerbulanKemarin.length > 0
          ? lakaPerbulanKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPerbulanIni =
        lakaPerbulanIni.length > 0
          ? lakaPerbulanIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPertahunKemarin =
        lakaPertahunKemarin.length > 0
          ? lakaPertahunKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_lakaPertahunIni =
        lakaPertahunIni.length > 0
          ? lakaPertahunIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let laka_perhari = result_lakaPerhariIni;
      let laka_perminggu = result_lakaPermingguIni;
      let laka_perbulan = result_lakaPerbulanIni;
      let laka_pertahun = result_lakaPertahunIni;

      let finalResponse = {
        laka_perhari,
        laka_perminggu,
        laka_perbulan,
        laka_pertahun,
      };

      //   let resultPerhariKemarin = Object.values();

      response(res, true, "Succeed", finalResponse);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static sim = async (req, res) => {
    try {
      let ranmorPerhariKemarin = await Turjagwali.findAll({
        where: {
          date: thisday,
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPerhariIni = await Turjagwali.findAll({
        where: {
          date: yesterday,
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPermingguKemarin = await Turjagwali.findAll({
        where: {
          date: {
            [Op.between]: [lastweek, thisweek],
          },
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPermingguIni = await Turjagwali.findAll({
        where: {
          date: {
            [Op.gte]: thisweek,
          },
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPerbulanKemarin = await Turjagwali.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayMonth, EndDateYesterdayMonth],
          },
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPerbulanIni = await Turjagwali.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisMonth, EndDateThisMonth],
          },
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPertahunKemarin = await Turjagwali.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayYear, EndDateYesterdatYear],
          },
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let ranmorPertahunIni = await Turjagwali.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisYear, EndDateThisYear],
          },
        },
        attributes: ["pengaturan", "penjagaan", "pengawalan", "patroli"],
      });

      let result_ranmorPerhariKemarin =
        ranmorPerhariKemarin.length > 0
          ? ranmorPerhariKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPerhariIni =
        ranmorPerhariIni.length > 0
          ? ranmorPerhariIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPermingguKemarin =
        ranmorPermingguKemarin.length > 0
          ? ranmorPermingguKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPermingguIni =
        ranmorPermingguIni.length > 0
          ? ranmorPermingguIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPerbulanKemarin =
        ranmorPerbulanKemarin.length > 0
          ? ranmorPerbulanKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPerbulanIni =
        ranmorPerbulanIni.length > 0
          ? ranmorPerbulanIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPertahunKemarin =
        ranmorPertahunKemarin.length > 0
          ? ranmorPertahunKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPertahunIni =
        ranmorPertahunIni.length > 0
          ? ranmorPertahunIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let sim_perhari = result_ranmorPerhariIni;
      let sim_perminggu = result_ranmorPermingguIni;
      let sim_perbulan = result_ranmorPerbulanIni;
      let sim_pertahun = result_ranmorPertahunIni;

      let finalResponse = {
        sim_perhari,
        sim_perminggu,
        sim_perbulan,
        sim_pertahun,
      };

      //   let resultPerhariKemarin = Object.values();

      response(res, true, "Succeed", finalResponse);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static pelanggaran = async (req, res) => {
    try {
      let garlantasPerhariKemarin = await GarlantasDay.findAll({
        where: {
          date: yesterday,
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPerhariIni = await GarlantasDay.findAll({
        where: {
          date: thisday,
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPemingguKemarin = await GarlantasDay.findAll({
        where: {
          date: {
            [Op.between]: [lastweek, thisweek],
          },
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPermingguIni = await GarlantasDay.findAll({
        where: {
          date: {
            [Op.gte]: thisweek,
          },
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPerbulanKemarin = await GarlantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayMonth, EndDateYesterdayMonth],
          },
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPerbulanIni = await GarlantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisMonth, EndDateThisMonth],
          },
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPertahunKemarin = await GarlantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayYear, EndDateYesterdatYear],
          },
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let garlantasPertahunIni = await GarlantasDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisYear, EndDateThisYear],
          },
        },
        attributes: [
          "pelanggaran_berat",
          "pelanggaran_sedang",
          "pelanggaran_ringan",
        ],
      });

      let result_garlantasPerhariKemarin =
        garlantasPerhariKemarin.length > 0
          ? garlantasPerhariKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPerhariIni =
        garlantasPerhariIni.length > 0
          ? garlantasPerhariIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPemingguKemarin =
        garlantasPemingguKemarin.length > 0
          ? garlantasPemingguKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPermingguIni =
        garlantasPermingguIni.length > 0
          ? garlantasPermingguIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPerbulanKemarin =
        garlantasPerbulanKemarin.length > 0
          ? garlantasPerbulanKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPerbulanIni =
        garlantasPerbulanIni.length > 0
          ? garlantasPerbulanIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPertahunKemarin =
        garlantasPertahunKemarin.length > 0
          ? garlantasPertahunKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_garlantasPertahunIni =
        garlantasPertahunIni.length > 0
          ? garlantasPertahunIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let pelanggaran_perhari = result_garlantasPerhariIni;
      let pelanggaran_perminggu = result_garlantasPermingguIni;
      let pelanggaran_perbulan = result_garlantasPerbulanIni;
      let pelanggaran_pertahun = result_garlantasPertahunIni;

      let finalResponse = {
        pelanggaran_perhari,
        pelanggaran_perminggu,
        pelanggaran_perbulan,
        pelanggaran_pertahun,
      };

      //   let resultPerhariKemarin = Object.values();

      response(res, true, "Succeed", finalResponse);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static kendaraan = async (req, res) => {
    try {
      let ranmorPerhariKemarin = await RanmorDay.findAll({
        where: {
          date: yesterday,
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPerhariIni = await RanmorDay.findAll({
        where: {
          date: thisday,
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPemingguKemarin = await RanmorDay.findAll({
        where: {
          date: {
            [Op.between]: [lastweek, thisweek],
          },
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPermingguIni = await RanmorDay.findAll({
        where: {
          date: {
            [Op.gte]: thisweek,
          },
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPerbulanKemarin = await RanmorDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayMonth, EndDateYesterdayMonth],
          },
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPerbulanIni = await RanmorDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisMonth, EndDateThisMonth],
          },
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPertahunKemarin = await RanmorDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateYesterdayYear, EndDateYesterdatYear],
          },
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let ranmorPertahunIni = await RanmorDay.findAll({
        where: {
          date: {
            [Op.between]: [StartDateThisYear, EndDateThisYear],
          },
        },
        attributes: [
          "mobil_penumpang",
          "mobil_barang",
          "mobil_bus",
          "ransus",
          "sepeda_motor",
        ],
      });

      let result_ranmorPerhariKemarin =
        ranmorPerhariKemarin.length > 0
          ? ranmorPerhariKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPerhariIni =
        ranmorPerhariIni.length > 0
          ? ranmorPerhariIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPemingguKemarin =
        ranmorPemingguKemarin.length > 0
          ? ranmorPemingguKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPermingguIni =
        ranmorPermingguIni.length > 0
          ? ranmorPermingguIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPerbulanKemarin =
        ranmorPerbulanKemarin.length > 0
          ? ranmorPerbulanKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPerbulanIni =
        ranmorPerbulanIni.length > 0
          ? ranmorPerbulanIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPertahunKemarin =
        ranmorPertahunKemarin.length > 0
          ? ranmorPertahunKemarin
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let result_ranmorPertahunIni =
        ranmorPertahunIni.length > 0
          ? ranmorPertahunIni
              .map((element) => {
                let a = Object.values(element.dataValues).reduce((c, d) => {
                  return c + d;
                });
                return a;
              })
              .reduce((f, g) => {
                return f + g;
              })
          : 0;

      let ranmor_perhari = result_ranmorPerhariIni;
      let ranmor_perminggu = result_ranmorPermingguIni;
      let ranmor_perbulan = result_ranmorPerbulanIni;
      let ranmor_pertahun = result_ranmorPertahunIni;

      let finalResponse = {
        ranmor_perhari,
        ranmor_perminggu,
        ranmor_perbulan,
        ranmor_pertahun,
      };

      //   let resultPerhariKemarin = Object.values();

      response(res, true, "Succeed", finalResponse);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };
};
