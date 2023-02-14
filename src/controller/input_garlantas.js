const db = require("../config/database");
const response = require("../lib/response");
const moment = require("moment");
const Input_garlantas = require("../model/input_garlantas");
const pagination = require("../lib/pagination-parser");
const { Op, Sequelize, where } = require("sequelize");
const _ = require("lodash");
const { AESDecrypt } = require("../lib/encryption");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

const Count_polda_day = require("../model/count_garlantas_polda_day");
const Count_polda_month = require("../model/count_garlantas_polda_month");
const Count_polres_month = require("../model/count_garlantas_polres_month");
const Polda = require("../model/polda");
const Polres = require("../model/polres");

// const Etilang_perkara_pasal = require("../model/etilang_perkara_pasal");
// const Etilang_perkara = require("../model/etilang_perkara");

// Count_polda_month.belongsTo(Polda, { foreignKey: "polda_id", as: "polda" });
// Count_polda_day.belongsTo(Polda, { foreignKey: "polda_id", as: "polda" });

// Count_polres_month.belongsTo(Polda, { foreignKey: "polda_id", as: "polda" });
// Count_polres_month.belongsTo(Polres, { foreignKey: "polres_id", as: "polres" });
Polda.hasMany(Count_polda_day, { foreignKey: "polda_id", as: "garlantas" });
Polda.hasMany(Count_polda_month, {
  foreignKey: "polda_id",
  as: "garlantas-month",
});

Etilang_perkara.hasOne(Etilang_perkara_pasal, { foreignKey: "no_bayar" });
// Polda.hasMany(Input_garlantas, { foreignKey: "polda_id", as: "garlantas" });
// Polres.hasMany(Input_garlantas, { foreignKey: "polres_id", as: "garlantas" });

const decAes = (token) =>
  AESDecrypt(token, {
    isSafeUrl: true,
    parseMode: "string",
  });
module.exports = class GarlantasController {
  static get = async (req, res) => {
    try {
      const dates = moment(new Date())
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");

      let start_date = moment().subtract(1, "days").startOf("day").unix();
      // let start_date = moment(dates).startOf("day").subtract(1, "days").unix();
      let end_date = moment(dates).endOf("day").unix();

      let changes = moment(dates).unix();

      console.log({
        tgl: `${moment().subtract(1, "days").startOf("day")} - ${moment(
          dates
        ).endOf("day")}`,
        toUnix: changes,
        start: start_date - 25200,
        end: end_date,
      });

      let data = await Etilang_perkara.findAll({
        include: [
          {
            model: Etilang_perkara_pasal,
            foreignKey: "no_bayar",
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
            required: false,
          },
        ],
        where: {
          tgl_perkara: {
            [Op.between]: [start_date - 25200, end_date],
          },
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
        order: [["tgl_perkara", "DESC"]],
      });

      let finals = [];
      data.map((element, index) => {
        finals.push({
          no_bayar: element.dataValues.no_bayar,
          kepolisian_induk: element.dataValues.kepolisian_induk,
          tgl_perkara: moment.unix(element.dataValues.tgl_perkara),
          jenis_pelanggaran: element.dataValues.perkara_pasal.klasifikasi,
          tgl: element.dataValues.tgl_perkara,
          start_date: moment(dates).subtract(1, "days"),
          end_date: moment(dates).endOf("day"),
        });
      });

      let result = Object.values(
        finals.reduce((a, { kepolisian_induk, ...props }) => {
          if (!a[kepolisian_induk])
            a[kepolisian_induk] = Object.assign(
              {},
              { kepolisian_induk, data: [props] }
            );
          else a[kepolisian_induk].data.push(props);
          return a;
        }, {})
      );
      let rows = [];
      for (let i = 0; i < result.length; i++) {
        let asd = [];
        for (let j = 0; j < result[i].data.length; j++) {
          asd.push(result[i].data[j].jenis_pelanggaran);
        }

        let countedNames = asd.reduce((allNames, name) => {
          const currCount = allNames[name] ?? 0;
          return {
            ...allNames,
            [name]: currCount + 1,
          };
        }, {});
        rows.push({
          polda: result[i].kepolisian_induk,
          date: moment(finals[i].tgl_perkara).format("YYYY-MM-DD"),
          start_date: result[i].start_date,
          end_date: result[i].end_date,
          berat: countedNames.Berat || 0,
          sedang: countedNames.Sedang || 0,
          ringan: countedNames.Ringan || 0,
        });
      }

      response(res, true, "Succeed", rows);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static get_daily = async (req, res) => {
    const modelAttr = Object.keys(Count_polda_day.getAttributes());
    try {
      const {
        start_date = null,
        end_date = null,
        filter = null,
        date = null,
        serverSide = null,
        length = null,
        start = null,
        polda_id = null,
        topPolda = null,
        limit = 34,
      } = req.query;
      const getDataRules = {
        group: ["polda.id"],
        attributes: [
          "id",
          "name_polda",
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
            "pelanggaran_berat",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
            "pelanggaran_sedang",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
            "pelanggaran_ringan",
          ],
          [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
          [
            Sequelize.literal(
              "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang + teguran)"
            ),
            "total",
          ],
        ],
        include: [
          {
            model: Count_polda_day,
            required: false,
            as: "garlantas",
            attributes: [],
          },
        ],
        nest: true,
        subQuery: false,
      };

      if (date) {
        getDataRules.include[0].where = {
          date: date,
        };
      }

      if (filter) {
        getDataRules.include[0].where = {
          date: {
            [Op.between]: [start_date, end_date],
          },
        };
      }

      if (polda_id) {
        getDataRules.where = {
          id: decAes(polda_id),
        };
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let finals = await Polda.findAll(getDataRules);
      const count = await Polda.count({
        where: getDataRules?.where,
      });

      let rows = [];

      finals.map((element, index) => {
        rows.push({
          id: element.id,
          name_polda: element.name_polda,
          pelanggaran_berat:
            parseInt(element.dataValues.pelanggaran_berat) || 0,
          pelanggaran_ringan:
            parseInt(element.dataValues.pelanggaran_ringan) || 0,
          pelanggaran_sedang:
            parseInt(element.dataValues.pelanggaran_sedang) || 0,
          teguran: parseInt(element.dataValues.teguran) || 0,
          total: parseInt(element.dataValues.total) || 0,
        });
      });

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, limit);
      }
      response(res, true, "Succeed", {
        rows,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static get_monthly = async (req, res) => {
    const modelAttr = Object.keys(Count_polda_day.getAttributes());
    try {
      const {
        start_month = null,
        end_month = null,
        filter = null,
        month = null,
        serverSide = null,
        length = null,
        start = null,
        polda_id = null,
        topPolda = null,
        limit = 34,
      } = req.query;
      const getDataRules = {
        group: ["polda.id"],
        attributes: [
          "id",
          "name_polda",
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
            "pelanggaran_berat",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
            "pelanggaran_sedang",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
            "pelanggaran_ringan",
          ],
          [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
          [
            Sequelize.literal(
              "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang + teguran)"
            ),
            "total",
          ],
        ],
        include: [
          {
            model: Count_polda_month,
            required: false,
            as: "garlantas-month",
            attributes: [],
          },
        ],
        nest: true,
        subQuery: false,
      };

      if (month) {
        getDataRules.include[0].where = {
          date: month,
        };
      }

      if (filter) {
        getDataRules.include[0].where = {
          date: {
            [Op.between]: [start_month, end_month],
          },
        };
      }

      if (polda_id) {
        getDataRules.where = {
          id: decAes(polda_id),
        };
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let finals = await Polda.findAll(getDataRules);
      const count = await Polda.count({
        where: getDataRules?.where,
      });

      let rows = [];

      finals.map((element, index) => {
        rows.push({
          id: element.id,
          name_polda: element.name_polda,
          pelanggaran_berat:
            parseInt(element.dataValues.pelanggaran_berat) || 0,
          pelanggaran_ringan:
            parseInt(element.dataValues.pelanggaran_ringan) || 0,
          pelanggaran_sedang:
            parseInt(element.dataValues.pelanggaran_sedang) || 0,
          teguran: parseInt(element.dataValues.teguran) || 0,
          total: parseInt(element.dataValues.total) || 0,
        });
      });

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, limit);
      }
      response(res, true, "Succeed", {
        rows,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static get_by_date = async (req, res) => {
    let start_of_month = moment().startOf("years").format("YYYY-MM-DD");
    let end_of_month = moment().endOf("years").format("YYYY-MM-DD");

    let start_of_day = moment().startOf("month").format("YYYY-MM-DD");
    let end_of_day = moment().endOf("month").format("YYYY-MM-DD");
    try {
      const {
        type = null,
        start_date = null,
        end_date = null,
        filter = null,
        date = null,
        serverSide = null,
        length = null,
        start = null,
        polda_id = null,
        topPolda = null,
      } = req.query;

      var list_day = [];
      var list_month = [];
      var list_year = [];

      for (
        var m = moment(start_date);
        m.isSameOrBefore(end_date);
        m.add(1, "days")
      ) {
        list_day.push(m.format("YYYY-MM-DD"));
      }

      for (
        var m = moment(start_date);
        m.isSameOrBefore(end_date);
        m.add(1, "month")
      ) {
        list_month.push(m.format("MMMM"));
      }

      for (
        var m = moment(start_date);
        m.isSameOrBefore(end_date);
        m.add(1, "year")
      ) {
        list_year.push(m.format("YYYY"));
      }

      let wheres = {};
      if (date) {
        wheres.date = date;
      }

      if (filter) {
        wheres.date = {
          [Op.between]: [start_date, end_date],
        };
      }

      if (polda_id) {
        wheres.polda_id = decAes(polda_id);
      }

      const getDataRules = {
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
            "pelanggaran_berat",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
            "pelanggaran_sedang",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
            "pelanggaran_ringan",
          ],
          // [Sequelize.fn("date_trunc", "month", Sequelize.col("date")), "year"],
          [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
        ],
        where: wheres,
      };

      if (type === "day") {
        getDataRules.group = "date";
        getDataRules.attributes.push("date");
      } else if (type === "month") {
        getDataRules.group = "month";
        getDataRules.attributes.push([
          Sequelize.fn("date_trunc", "month", Sequelize.col("date")),
          "month",
        ]);
      } else if (type === "year") {
        getDataRules.group = "year";
        getDataRules.attributes.push([
          Sequelize.fn("date_trunc", "year", Sequelize.col("date")),
          "year",
        ]);
      }

      let rows = await Count_polda_day.findAll(getDataRules);

      let finals = [];
      if (type === "day") {
        const asd = list_day.map((item, index) => {
          const data = rows.find((x) => x.dataValues.date == item);
          if (data) {
            finals.push({
              pelanggaran_berat: parseInt(data.pelanggaran_berat),
              pelanggaran_ringan: parseInt(data.pelanggaran_ringan),
              pelanggaran_sedang: parseInt(data.pelanggaran_sedang),
              teguran: parseInt(data.teguran),
              date: data.date,
            });
          } else {
            finals.push({
              pelanggaran_berat: 0,
              pelanggaran_ringan: 0,
              pelanggaran_sedang: 0,
              teguran: 0,
              date: item,
            });
          }
        });
      } else if (type === "month") {
        let abc = rows.map((element, index) => {
          return {
            pelanggaran_berat: parseInt(element.dataValues.pelanggaran_berat),
            pelanggaran_ringan: parseInt(element.dataValues.pelanggaran_ringan),
            pelanggaran_sedang: parseInt(element.dataValues.pelanggaran_sedang),
            teguran: parseInt(element.dataValues.teguran),
            date: moment(element.dataValues.month).format("MMMM"),
          };
        });

        const asd = list_month.map((item, index) => {
          const data = abc.find((x) => x.date == item);
          if (data) {
            finals.push({
              pelanggaran_berat: parseInt(data.pelanggaran_berat),
              pelanggaran_ringan: parseInt(data.pelanggaran_ringan),
              pelanggaran_sedang: parseInt(data.pelanggaran_sedang),
              teguran: parseInt(data.teguran),
              date: data.date,
            });
          } else {
            finals.push({
              pelanggaran_berat: 0,
              pelanggaran_ringan: 0,
              pelanggaran_sedang: 0,
              teguran: 0,
              date: item,
            });
          }
        });
      } else if (type === "year") {
        let abc = rows.map((element, index) => {
          return {
            pelanggaran_berat: parseInt(element.dataValues.pelanggaran_berat),
            pelanggaran_ringan: parseInt(element.dataValues.pelanggaran_ringan),
            pelanggaran_sedang: parseInt(element.dataValues.pelanggaran_sedang),
            teguran: parseInt(element.dataValues.teguran),
            date: moment(element.dataValues.year).format("YYYY"),
          };
        });

        const asd = list_year.map((item, index) => {
          const data = abc.find((x) => x.date == item);
          if (data) {
            finals.push({
              pelanggaran_berat: parseInt(data.pelanggaran_berat),
              pelanggaran_ringan: parseInt(data.pelanggaran_ringan),
              pelanggaran_sedang: parseInt(data.pelanggaran_sedang),
              teguran: parseInt(data.teguran),
              date: data.date,
            });
          } else {
            finals.push({
              pelanggaran_berat: 0,
              pelanggaran_ringan: 0,
              pelanggaran_sedang: 0,
              teguran: 0,
              date: item,
            });
          }
        });
      }
      response(res, true, "Succeed", finals);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static grafik_mobile = async (req, res) => {
    try {
      let { limit, page, filter } = req.query;
      const modelAttr = Object.keys(Count_polda_day.getAttributes());
      let getDataRules = {
        group: ["polda.id"],
        include: [
          {
            model: Count_polda_day,
            required: false,
            as: "garlantas",
            attributes: [],
          },
        ],
        raw: true,
        nest: true,
        subQuery: false,
      };
      let whereBuilder = ["id", ["name_polda", "label"]];
      if (filter != null) {
        modelAttr.forEach((key) => {
          if (filter === key) {
            whereBuilder.push([
              Sequelize.fn("sum", Sequelize.col(`${key}`)),
              "value",
            ]);
          } else if (filter === "jumlah_pelanggaran") {
            whereBuilder.push([
              Sequelize.literal(
                "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang)"
              ),
              "value",
            ]);
          }
        });
      } else {
        modelAttr.forEach((key) => {
          if (
            key == "pelanggaran_berat" ||
            key == "pelanggaran_sedang" ||
            key == "pelanggaran_ringan"
          ) {
            whereBuilder.push(
              [Sequelize.fn("sum", Sequelize.col(`${key}`)), key],
              [
                Sequelize.literal(
                  "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang)"
                ),
                "jumlah_pelanggaran",
              ]
            );
          }
        });
      }

      console.log(whereBuilder);

      getDataRules.attributes = whereBuilder;

      let finals = await Polda.findAll(getDataRules);
      let rows = finals.map((element, index) => {
        if (element.value == null) {
          element.value = 0;
        } else {
          element.value = parseInt(element.value);
        }
        return element;
      });
      response(res, true, "Succeed", rows);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static top_polda = async (req, res) => {
    try {
      let { limit, page, filter } = req.query;
      const modelAttr = Object.keys(Count_polda_day.getAttributes());
      let getDataRules = {
        group: ["polda.id"],
        include: [
          {
            model: Count_polda_day,
            required: false,
            as: "garlantas",
            attributes: [],
          },
        ],
        raw: true,
        nest: true,
        subQuery: false,
      };
      let whereBuilder = ["id", ["name_polda", "label"]];
      if (filter != null) {
        modelAttr.forEach((key) => {
          if (filter === key) {
            whereBuilder.push([
              Sequelize.fn("sum", Sequelize.col(`${key}`)),
              "value",
            ]);
          } else if (filter === "jumlah_pelanggaran") {
            whereBuilder.push([
              Sequelize.literal(
                "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang)"
              ),
              "value",
            ]);
          }
        });
      } else {
        modelAttr.forEach((key) => {
          if (
            key == "pelanggaran_berat" ||
            key == "pelanggaran_sedang" ||
            key == "pelanggaran_ringan"
          ) {
            whereBuilder.push(
              [Sequelize.fn("sum", Sequelize.col(`${key}`)), key],
              [
                Sequelize.literal(
                  "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang)"
                ),
                "jumlah_pelanggaran",
              ]
            );
          }
        });
      }

      console.log(whereBuilder);

      getDataRules.attributes = whereBuilder;

      let finals = await Polda.findAll(getDataRules);
      let rows = finals.map((element, index) => {
        if (element.value == null) {
          element.value = 0;
        } else {
          element.value = parseInt(element.value);
        }
        return element;
      });
      rows.sort((a, b) => b.value - a.value);
      let row = rows.slice(0, 10);
      response(res, true, "Succeed", row);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  // static add = async (req, res) => {
  //   const transaction = await db.transaction();
  //   try {
  //     const { polda } = req.query;
  //     if (polda) {
  //       let dataInputPolda = [];
  //       req.body?.value.map((item) => {
  //         dataInputPolda.push({
  //           polda_id: decAes(req.body.polda_id),
  //           date: req.body.date,
  //           polres_id: decAes(item.polres_id),
  //           pelanggaran_berat: item.pelanggaran_berat,
  //           pelanggaran_ringan: item.pelanggaran_ringan,
  //           pelanggaran_sedang: item.pelanggaran_sedang,
  //           teguran: item.teguran,
  //         });
  //       });
  //       let insertDataPolda = await Input_garlantas.bulkCreate(dataInputPolda, {
  //         transaction: transaction,
  //       });
  //     } else {
  //       let checkData = await Input_garlantas.findOne({
  //         where: {
  //           polda_id: decAes(req.body.polda_id),
  //           polres_id: decAes(req.body.polres_id),
  //           date: req.body.date,
  //         },
  //       });

  //       let InputData = {
  //         polda_id: decAes(req.body.polda_id),
  //         polres_id: decAes(req.body.polres_id),
  //         date: req.body.date,
  //         pelanggaran_berat: req.body.pelanggaran_berat,
  //         pelanggaran_sedang: req.body.pelanggaran_sedang,
  //         pelanggaran_ringan: req.body.pelanggaran_ringan,
  //         teguran: req.body.teguran,
  //       };
  //       if (checkData) {
  //         let updateData = await Input_garlantas.update(InputData, {
  //           where: {
  //             polda_id: decAes(req.body.polda_id),
  //             polres_id: decAes(req.body.polres_id),
  //             date: req.body.date,
  //           },
  //           transaction: transaction,
  //         });
  //       } else {
  //         let insertData = await Input_garlantas.create(InputData, {
  //           transaction: transaction,
  //         });
  //       }
  //     }
  //     await transaction.commit();
  //     response(res, true, "Succeed", null);
  //   } catch (error) {
  //     await transaction.rollback();
  //     response(res, false, "Failed", error.message);
  //   }
  // };

  static add = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let dataInputPolda = [];
      req.body?.value.map((item) => {
        dataInputPolda.push({
          polda_id: decAes(item.polda_id),
          date: item.date,
          pelanggaran_berat: item.pelanggaran_berat,
          pelanggaran_ringan: item.pelanggaran_ringan,
          pelanggaran_sedang: item.pelanggaran_sedang,
          teguran: item.teguran,
        });
      });

      let insertDataPolda = await Count_polda_day.bulkCreate(dataInputPolda, {
        transaction: transaction,
      });

      await transaction.commit();
      response(res, true, "Succeed", null);
    } catch (error) {
      await transaction.rollback();
      response(res, false, "Failed", error.message);
    }
  };
};
