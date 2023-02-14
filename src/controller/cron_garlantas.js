const cron = require("node-cron");
const db = require("../config/database");
const moment = require("moment");

const Count_polda_day = require("../model/count_garlantas_polda_day");
const Count_polda_month = require("../model/count_garlantas_polda_month");
const { namePolda, namePoldaGAR } = require("../lib/polda_nameParse");

// const Etilang_perkara_pasal = require("../model/etilang_perkara_pasal");
// const Etilang_perkara = require("../model/etilang_perkara");

const Polda = require("../model/polda");
const { Op, Sequelize } = require("sequelize");
exports.cronGarlantas = () => {
  const scheduledJobFunction_gar = cron.schedule(
    "0 */2 * * *",
    () => {
      console.log("Cron garlantas is running");
      // update_polda_month();
      update_polda_day();
    },
    {
      scheduled: true,
      timezone: "Asia/Jakarta",
    }
  );

  const scheduledJobFunction = cron.schedule("40 23 * * *", () => {
    console.log("Cron garlantas is running");
    update_polda_month();
  });

  scheduledJobFunction.start();
  scheduledJobFunction_gar.start();
};

const update_polda_day = async () => {
  const transaction = await db.transaction();
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
        polda_id: namePoldaGAR(result[i].kepolisian_induk),
        polda: result[i].kepolisian_induk,
        date: moment(finals[i].tgl_perkara).format("YYYY-MM-DD"),
        berat: countedNames.Berat || 0,
        sedang: countedNames.Sedang || 0,
        ringan: countedNames.Ringan || 0,
      });
    }

    for (let i = 0; i < rows.length; i++) {
      let checkData = await Count_polda_day.findOne({
        where: {
          polda_id: rows[i].polda_id,
          date: rows[i].date,
        },
      });

      let data = {
        polda_id: rows[i].polda_id,
        date: rows[i].date,
        pelanggaran_berat: rows[i].berat,
        pelanggaran_sedang: rows[i].sedang,
        pelanggran_ringan: rows[i].ringan,
      };

      if (checkData) {
        await Count_polda_day.update(data, {
          transaction: transaction,
          where: {
            polda_id: rows[i].polda_id,
            date: rows[i].date,
          },
        });
      } else {
        await Count_polda_day.create(data, {
          transaction: transaction,
        });
      }
    }
    await transaction.commit();

    console.log({ task: "update garlantas", data: rows });
  } catch (e) {
    await transaction.rollback();
    console.log({ task: "update_polda_day", massage: e.message });
  }
};


const update_polda_month = async () => {
  try {
    const transaction = await db.transaction();

    const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");
    let allCountPoldaDay = await Polda.findAll({
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
      ],
      include: [
        {
          model: Count_polda_day,
          required: false,
          as: "garlantas",
          attributes: [],
          where: {
            date: {
              [Op.between]: [startOfMonth, endOfMonth],
            },
          },
        },
      ],
      nest: true,
      subQuery: false,
      raw: true,
    });

    for (let i = 0; i < allCountPoldaDay.length; i++) {
      let checkData = await Count_polda_month.findOne({
        where: {
          polda_id: allCountPoldaDay[i].id,
          date: startOfMonth,
        },
      });

      let data = {
        polda_id: allCountPoldaDay[i].id,
        pelanggaran_berat: allCountPoldaDay[i].pelanggaran_berat,
        pelanggaran_ringan: allCountPoldaDay[i].pelanggaran_ringan,
        pelanggaran_sedang: allCountPoldaDay[i].pelanggaran_sedang,
        date: startOfMonth,
      };

      if (checkData) {
        let updateData = await Count_polda_month.update(data, {
          where: {
            polda_id: allCountPoldaDay[i].id,
            date: startOfMonth,
          },
        });
        console.log("update");
      } else {
        let insertData = await Count_polda_month.create(data);
        console.log("insert");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

