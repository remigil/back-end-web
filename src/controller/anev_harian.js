const db = require("../config/database");
const response = require("../lib/response");
// const Pelanggaran = require("../model/count_garlantas_polda_day");
// const Kecelakaan = require("../model/count_lakalantas_polda_day");
const moment = require("moment");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const { AESDecrypt } = require("../lib/encryption");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const Polda = require("../model/polda");

const decAes = (token) =>
  AESDecrypt(token, {
    isSafeUrl: true,
    parseMode: "string",
  });

module.exports = class AnevHarianController {
  static topPolda_Kecelakaan = async (req, res) => {
    try {
      let {
        thisday = moment().subtract(1, "days").format("YYYY-MM-DD"),
        yesterday = moment().subtract(2, "days").format("YYYY-MM-DD"),
        limit = null,
        page = null,
        filter = null,
        first_date = null,
        second_date = null,
        date = null,
        topPolda = null,

      } = req.query;
      // let { limit, page, filter, start_date, end_date } = req.query;
      let count_now = await Polda.findAll({
        group: ["polda.id"],
        attributes: [
          "id",
          "name_polda",
          [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
          [Sequelize.fn("sum", Sequelize.col("luka_ringan")), "luka_ringan"],
          [Sequelize.fn("sum", Sequelize.col("meninggal_dunia")), "meninggal_dunia"],
          [
            Sequelize.literal(
              "SUM(luka_berat + luka_ringan + meninggal_dunia)"
            ),
            "today",
          ],
        ],
        include: [
          {
            model: Kecelakaan,
            required: false,
            as: "laka_lantas",
            attributes: [],
            where: {
              date: first_date,
            },
          },
        ],
        raw: true,
        nest: true,
        subQuery: false,
      });

      let count_yesterday = await Polda.findAll({
        group: ["polda.id"],
        attributes: [
          "id",
          "name_polda",
          [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
          [Sequelize.fn("sum", Sequelize.col("luka_ringan")), "luka_ringan"],
          [Sequelize.fn("sum", Sequelize.col("meninggal_dunia")), "meninggal_dunia"],
          [
            Sequelize.literal(
              "SUM(luka_berat + luka_ringan + meninggal_dunia)"
            ),
            "yesterday",
          ],
        ],
        include: [
          {
            model: Kecelakaan,
            required: false,
            as: "laka_lantas",
            attributes: [],
            where: {
              date: second_date,
            },
          },
        ],
        raw: true,
        nest: true,
        subQuery: false,
      });


      let result_now = count_now.map((element, index) => {
        if (element.today == null) {
          element.today = 0;
        } else {
          element.today = parseInt(element.today);
        }
        return element;
      });
      //   result_now.sort((a, b) => b.total - a.total);
      //   let row_now = result_now.slice(0, 10);

      let result_yesterday = count_yesterday.map((element, index) => {
        if (element.yesterday == null) {
          element.yesterday = 0;
        } else {
          element.yesterday = parseInt(element.yesterday);
        }
        return element;
      });

      let rows = [];

      for (let i = 0; i < result_now.length; i++) {
        rows.push({
          id: result_now[i].id,
          name_polda: result_now[i].name_polda,
          today : {
            date: first_date || thisday,
            luka_berat : result_now[i].luka_berat || 0,
            luka_ringan : result_now[i].luka_ringan || 0,
            meninggal_dunia : result_now[i].meninggal_dunia ||0,
            total: result_now[i].today,
          },

          yesterday : {
            date: second_date || yesterday,
            luka_berat_kemarin : result_yesterday[i].luka_berat || 0,
            luka_ringan_kemarin : result_yesterday[i].luka_ringan || 0,
            meninggal_dunia_kemarin : result_yesterday[i].meninggal_dunia || 0,
            total: result_yesterday[i].yesterday,
          }
        });
      }

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }

      // final_results.sort((a, b) => b.today - a.today);
      // let a = final_results.slice(0, 10);

      response(res, true, "Succeed", rows);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };
};
