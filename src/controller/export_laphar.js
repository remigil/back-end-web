const XLSX = require("xlsx");
const response = require("../lib/response");
const moment = require("moment");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const cron = require("node-cron");
const { IDDays } = require("../lib/generalhelper");
const {
  tempalteLaphar,
  templateLapharNew,
  tempLaka,
  tempLanggar,
  tempTurjagwali,
  tempRanmor,
  tempSim,
  tempStnk,
  tempBpkb,
} = require("../lib/template_laphar");
const { tempAnevGakkum } = require("../lib/anev_ditgakkum");
const { tempAnevKamsel } = require("../lib/anev_ditkamsel");
const { AESDecrypt } = require("../lib/encryption");
const { Sequelize, Op } = require("sequelize");
const { existsSync } = require("fs");
const path = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// const Lakalanggar_polda_day = require("../model/count_lakalanggar_polda_day");
// const Lakalantas_polda_day = require("../model/count_lakalantas_polda_day");
// const Garlantas_polda_day = require("../model/count_garlantas_polda_day");
// const Turjagwali_polda_day = require("../model/count_turjagwali_polda_day");

// const Dikmaslantas_polda_day = require("../model/count_dikmaslantas_polda_day");
// const Penyebaran_polda_day = require("../model/count_penyebaran_polda_day");

// const Sim_polda_day = require("../model/count_sim_polda_day");
// const Bpkb_polda_day = require("../model/count_bpkb_polda_day");
// const Stnk_polda_day = require("../model/count_stnk_polda_day");
// const Ranmor_polda_day = require("../model/count_ranmor_polda_day");

const Laporan_Harian = require("../model/laporan_harian");

const Polda = require("../model/polda");
const { subtract } = require("lodash");
const decAes = (token) =>
  AESDecrypt(token, {
    isSafeUrl: true,
    parseMode: "string",
  });
module.exports = class ExportLapharController {
  static export_laphar = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = moment().format("YYYY-MM-DD");
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditgakkum = await Polda.findAll({
        group: [
          "polda.id",
          "garlantas.id",
          "laka_lantas.id",
          "turjagwali.id",
          "laka_langgar.id",
        ],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Garlantas_polda_day,
            required: false,
            as: "garlantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
                "pelanggaran_berat",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
                "pelanggaran_ringan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
                "pelanggaran_sedang",
              ],
              [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
              [
                Sequelize.literal(
                  "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang + teguran)"
                ),
                "total_garlantas",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Turjagwali_polda_day,
            required: false,
            as: "turjagwali",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("pengaturan")), "pengaturan"],
              [Sequelize.fn("sum", Sequelize.col("penjagaan")), "penjagaan"],
              [Sequelize.fn("sum", Sequelize.col("pengawalan")), "pengawalan"],
              [Sequelize.fn("sum", Sequelize.col("patroli")), "patroli"],
              [
                Sequelize.literal(
                  "SUM(turjagwali.pengawalan + turjagwali.penjagaan + turjagwali.patroli + turjagwali.pengaturan)"
                ),
                "total_turjagwali",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Lakalantas_polda_day,
            required: false,
            as: "laka_lantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("meninggal_dunia")),
                "meninggal_dunia",
              ],
              [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
              [
                Sequelize.fn("sum", Sequelize.col("luka_ringan")),
                "luka_ringan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("kerugian_material")),
                "kerugian_material",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("insiden_kecelakaan")),
                "total_lakalantas",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Lakalanggar_polda_day,
            required: false,
            as: "laka_langgar",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("capture_camera")),
                "capture_camera",
              ],
              [Sequelize.fn("sum", Sequelize.col("statis")), "statis"],
              [Sequelize.fn("sum", Sequelize.col("posko")), "posko"],
              [Sequelize.fn("sum", Sequelize.col("mobile")), "mobile"],
              [Sequelize.fn("sum", Sequelize.col("online")), "online"],
              [Sequelize.fn("sum", Sequelize.col("preemtif")), "preemtif"],
              [Sequelize.fn("sum", Sequelize.col("preventif")), "preventif"],
              [Sequelize.fn("sum", Sequelize.col("odol_227")), "odol_227"],
              [Sequelize.fn("sum", Sequelize.col("odol_307")), "odol_307"],
              [
                Sequelize.literal(
                  "SUM(laka_langgar.capture_camera + laka_langgar.statis + laka_langgar.posko + laka_langgar.mobile +  laka_langgar.online + laka_langgar.preemtif + laka_langgar.preventif + laka_langgar.odol_227 + laka_langgar.odol_307)"
                ),
                "total_lakalanggar",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let ditkamsel = await Polda.findAll({
        group: ["polda.id", "dikmaslantas.id", "penyebaran.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Dikmaslantas_polda_day,
            required: false,
            as: "dikmaslantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("media_cetak")),
                "media_cetak",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("media_elektronik")),
                "media_elektronik",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("media_sosial")),
                "media_sosial",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("laka_langgar")),
                "laka_langgar",
              ],
              [
                Sequelize.literal(
                  "SUM(dikmaslantas.media_elektronik + dikmaslantas.media_sosial + dikmaslantas.media_cetak + dikmaslantas.laka_langgar)"
                ),
                "total_dikmaslantas",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Penyebaran_polda_day,
            required: false,
            as: "penyebaran",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("spanduk")), "spanduk"],
              [Sequelize.fn("sum", Sequelize.col("leaflet")), "leaflet"],
              [Sequelize.fn("sum", Sequelize.col("stiker")), "stiker"],
              [Sequelize.fn("sum", Sequelize.col("billboard")), "billboard"],
              [
                Sequelize.fn("sum", Sequelize.col("jemensosprek")),
                "jemensosprek",
              ],
              [
                Sequelize.literal(
                  "SUM(penyebaran.stiker + penyebaran.spanduk + penyebaran.leaflet + penyebaran.billboard + penyebaran.jemensosprek)"
                ),
                "total_penyebaran",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let ditregident = await Polda.findAll({
        group: ["bpkb.id", "stnk.id", "sim.id", "ranmor.id", "polda.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Bpkb_polda_day,
            required: false,
            as: "bpkb",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("bpkb.baru")), "bpkb_baru"],
              [
                Sequelize.fn("sum", Sequelize.col("bpkb.perpanjangan")),
                "bpkb_perpanjangan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("bpkb.rubentina")),
                "bpkb_rubentina",
              ],
              [
                Sequelize.literal(
                  "SUM(bpkb.baru + bpkb.perpanjangan + bpkb.rubentina)"
                ),
                "total_bpkb",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Stnk_polda_day,
            required: false,
            as: "stnk",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("stnk.baru")), "stnk_baru"],
              [
                Sequelize.fn("sum", Sequelize.col("stnk.perpanjangan")),
                "stnk_perpanjangan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("stnk.rubentina")),
                "stnk_rubentina",
              ],
              [
                Sequelize.literal(
                  "SUM(stnk.baru + stnk.perpanjangan + stnk.rubentina)"
                ),
                "total_stnk",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Sim_polda_day,
            required: false,
            as: "sim",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("sim.baru")), "sim_baru"],
              [
                Sequelize.fn("sum", Sequelize.col("sim.perpanjangan")),
                "sim_perpanjangan",
              ],
              [
                Sequelize.literal("SUM(sim.baru + sim.perpanjangan)"),
                "total_sim",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
          {
            model: Ranmor_polda_day,
            required: false,
            as: "ranmor",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("mobil_penumpang")),
                "mobil_penumpang",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mobil_barang")),
                "mobil_barang",
              ],
              [Sequelize.fn("sum", Sequelize.col("mobil_bus")), "mobil_bus"],
              [Sequelize.fn("sum", Sequelize.col("ransus")), "ransus"],
              [
                Sequelize.fn("sum", Sequelize.col("sepeda_motor")),
                "sepeda_motor",
              ],
              [
                Sequelize.literal(
                  "SUM(ranmor.mobil_penumpang + ranmor.mobil_barang + ranmor.mobil_bus + ranmor.ransus + ranmor.sepeda_motor)"
                ),
                "total_ranmor",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];
      let rows_pelanggaran_berat = [];
      let rows_pelanggaran_sedang = [];
      let rows_pelanggaran_ringan = [];
      let rows_teguran = [];
      let rows_jumlah_garlantas = [];

      let rows_meninggal_dunia = [];
      let rows_luka_berat = [];
      let rows_luka_ringan = [];
      let rows_kerugian_material = [];
      let rows_jumlah_lakalantas = [];

      let rows_pengaturan = [];
      let rows_penjagaan = [];
      let rows_pengawalan = [];
      let rows_patroli = [];
      let rows_jumlah_turjagwali = [];

      let rows_media_cetak = [];
      let rows_media_sosial = [];
      let rows_media_elektronik = [];
      let rows_laka_langgar = [];
      let rows_jumlah_dikmaslantas = [];

      let rows_stiker = [];
      let rows_leaflet = [];
      let rows_billboard = [];
      let rows_spanduk = [];
      let rows_jemensosprek = [];
      let rows_jumlah_penyebaran = [];

      let rows_bpkb_baru = [];
      let rows_bpkb_gantinama = [];
      let rows_bpkb_rubentina = [];
      let rows_jumlah_bpkb = [];

      let rows_stnk_baru = [];
      let rows_stnk_perpanjangan = [];
      let rows_stnk_rubentina = [];
      let rows_jumlah_stnk = [];

      let rows_sim_baru = [];
      let rows_sim_perpanjangan = [];
      let rows_jumlah_sim = [];

      let rows_mobil_barang = [];
      let rows_mobil_bus = [];
      let rows_mobil_penumpang = [];
      let rows_ransus = [];
      let rows_sepeda_motor = [];
      let rows_jumlah_ranmor = [];

      for (let i = 0; i < ditgakkum.length; i++) {
        let pelanggaran_berat = 0;
        let pelanggaran_sedang = 0;
        let pelanggaran_ringan = 0;
        let teguran = 0;
        let jumlah_garlantas = 0;

        let meninggal_dunia = 0;
        let luka_berat = 0;
        let luka_ringan = 0;
        let kerugian_material = 0;
        let jumlah_lakalantas = 0;

        let pengaturan = 0;
        let pengawalan = 0;
        let patroli = 0;
        let penjagaan = 0;
        let jumlah_turjagwali = 0;

        for (let j = 0; j < ditgakkum[i].garlantas.length; j++) {
          pelanggaran_berat += parseInt(
            ditgakkum[i].garlantas[j].dataValues.pelanggaran_berat
          );
          pelanggaran_sedang += parseInt(
            ditgakkum[i].garlantas[j].dataValues.pelanggaran_sedang
          );
          pelanggaran_ringan += parseInt(
            ditgakkum[i].garlantas[j].dataValues.pelanggaran_ringan
          );
          teguran += parseInt(ditgakkum[i].garlantas[j].dataValues.teguran);
          jumlah_garlantas += parseInt(
            ditgakkum[i].garlantas[j].dataValues.total_garlantas
          );
        }

        for (let j = 0; j < ditgakkum[i].laka_lantas.length; j++) {
          meninggal_dunia += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.meninggal_dunia
          );
          luka_berat += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.luka_berat
          );
          luka_ringan += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.luka_ringan
          );
          kerugian_material += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.kerugian_material
          );
          jumlah_lakalantas += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.total_lakalantas
          );
        }

        for (let j = 0; j < ditgakkum[i].turjagwali.length; j++) {
          pengaturan += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.pengaturan
          );
          penjagaan += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.penjagaan
          );
          pengawalan += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.pengawalan
          );
          patroli += parseInt(ditgakkum[i].turjagwali[j].dataValues.patroli);
          jumlah_turjagwali += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.total_turjagwali
          );
        }

        rows_name_polda.push(ditgakkum[i].dataValues.name_polda);
        rows_pelanggaran_berat.push(pelanggaran_berat);
        rows_pelanggaran_sedang.push(pelanggaran_sedang);
        rows_pelanggaran_ringan.push(pelanggaran_ringan);
        rows_teguran.push(teguran);
        rows_jumlah_garlantas.push(jumlah_garlantas);

        rows_meninggal_dunia.push(meninggal_dunia);
        rows_luka_berat.push(luka_berat);
        rows_luka_ringan.push(luka_ringan);
        rows_kerugian_material.push(kerugian_material);
        rows_jumlah_lakalantas.push(jumlah_lakalantas);

        rows_pengaturan.push(pengaturan);
        rows_penjagaan.push(penjagaan);
        rows_pengawalan.push(pengawalan);
        rows_patroli.push(patroli);
        rows_jumlah_turjagwali.push(jumlah_turjagwali);
      }

      for (let i = 0; i < ditkamsel.length; i++) {
        let media_cetak = 0;
        let media_elektronik = 0;
        let media_sosial = 0;
        let laka_langgar = 0;
        let jumlah_dikmaslantas = 0;

        let stiker = 0;
        let leaflet = 0;
        let billboard = 0;
        let spanduk = 0;
        let jemensosprek = 0;
        let jumlah_penyebaran = 0;

        for (let j = 0; j < ditkamsel[i].dikmaslantas.length; j++) {
          media_cetak += parseInt(
            ditkamsel[i].dikmaslantas[j].dataValues.media_cetak
          );
          media_elektronik += parseInt(
            ditkamsel[i].dikmaslantas[j].dataValues.media_elektronik
          );
          media_sosial += parseInt(
            ditkamsel[i].dikmaslantas[j].dataValues.media_sosial
          );
          laka_langgar += parseInt(
            ditkamsel[i].dikmaslantas[j].dataValues.laka_langgar
          );
          jumlah_dikmaslantas += parseInt(
            ditkamsel[i].dikmaslantas[j].dataValues.total_dikmaslantas
          );
        }

        for (let j = 0; j < ditkamsel[i].penyebaran.length; j++) {
          spanduk += parseInt(ditkamsel[i].penyebaran[j].dataValues.spanduk);
          stiker += parseInt(ditkamsel[i].penyebaran[j].dataValues.stiker);
          leaflet += parseInt(ditkamsel[i].penyebaran[j].dataValues.leaflet);
          billboard += parseInt(
            ditkamsel[i].penyebaran[j].dataValues.billboard
          );
          jemensosprek += parseInt(
            ditkamsel[i].penyebaran[j].dataValues.jemensosprek
          );
          jumlah_penyebaran += parseInt(
            ditkamsel[i].penyebaran[j].dataValues.total_penyebaran
          );
        }

        rows_media_cetak.push(media_cetak);
        rows_media_elektronik.push(media_elektronik);
        rows_media_sosial.push(media_sosial);
        rows_laka_langgar.push(laka_langgar);
        rows_jumlah_dikmaslantas.push(jumlah_dikmaslantas);

        rows_spanduk.push(spanduk);
        rows_stiker.push(stiker);
        rows_billboard.push(billboard);
        rows_leaflet.push(leaflet);
        rows_jemensosprek.push(jemensosprek);
        rows_jumlah_penyebaran.push(jumlah_penyebaran);
      }

      for (let i = 0; i < ditregident.length; i++) {
        let bpkb_baru = 0;
        let bpkb_gantinama = 0;
        let bpkb_rubentina = 0;
        let jumlah_bpkb = 0;

        let stnk_baru = 0;
        let stnk_perpanjangan = 0;
        let stnk_rubentina = 0;
        let jumlah_stnk = 0;

        let sim_baru = 0;
        let sim_perpanjangan = 0;
        let jumlah_sim = 0;

        let mobil_barang = 0;
        let mobil_bus = 0;
        let mobil_penumpang = 0;
        let ransus = 0;
        let sepeda_motor = 0;
        let jumlah_ranmor = 0;

        for (let j = 0; j < ditregident[i].bpkb.length; j++) {
          bpkb_baru += parseInt(ditregident[i].bpkb[j].dataValues.bpkb_baru);
          bpkb_gantinama += parseInt(
            ditregident[i].bpkb[j].dataValues.bpkb_perpanjangan
          );
          bpkb_rubentina += parseInt(
            ditregident[i].bpkb[j].dataValues.bpkb_rubentina
          );
          jumlah_bpkb += parseInt(ditregident[i].bpkb[j].dataValues.total_bpkb);
        }

        for (let j = 0; j < ditregident[i].stnk.length; j++) {
          stnk_baru += parseInt(ditregident[i].stnk[j].dataValues.stnk_baru);
          stnk_perpanjangan += parseInt(
            ditregident[i].stnk[j].dataValues.stnk_perpanjangan
          );
          stnk_rubentina += parseInt(
            ditregident[i].stnk[j].dataValues.stnk_rubentina
          );
          jumlah_stnk += parseInt(ditregident[i].stnk[j].dataValues.total_stnk);
        }

        for (let j = 0; j < ditregident[i].sim.length; j++) {
          sim_baru += parseInt(ditregident[i].sim[j].dataValues.sim_baru);
          sim_perpanjangan += parseInt(
            ditregident[i].sim[j].dataValues.sim_perpanjangan
          );
          jumlah_sim += parseInt(ditregident[i].sim[j].dataValues.total_sim);
        }

        for (let j = 0; j < ditregident[i].ranmor.length; j++) {
          mobil_barang += parseInt(
            ditregident[i].ranmor[j].dataValues.mobil_barang
          );
          mobil_bus += parseInt(ditregident[i].ranmor[j].dataValues.mobil_bus);
          mobil_penumpang += parseInt(
            ditregident[i].ranmor[j].dataValues.mobil_penumpang
          );
          ransus += parseInt(ditregident[i].ranmor[j].dataValues.ransus);
          sepeda_motor += parseInt(
            ditregident[i].ranmor[j].dataValues.sepeda_motor
          );
          jumlah_ranmor += parseInt(
            ditregident[i].ranmor[j].dataValues.total_ranmor
          );
        }

        rows_bpkb_baru.push(bpkb_baru);
        rows_bpkb_gantinama.push(bpkb_gantinama);
        rows_bpkb_rubentina.push(bpkb_rubentina);
        rows_jumlah_bpkb.push(jumlah_bpkb);

        rows_stnk_baru.push(stnk_baru);
        rows_stnk_perpanjangan.push(stnk_perpanjangan);
        rows_stnk_perpanjangan.push(stnk_perpanjangan);
        rows_jumlah_stnk.push(jumlah_stnk);

        rows_sim_baru.push(sim_baru);
        rows_sim_perpanjangan.push(sim_perpanjangan);
        rows_jumlah_sim.push(jumlah_sim);

        rows_mobil_barang.push(mobil_barang);
        rows_mobil_penumpang.push(mobil_penumpang);
        rows_mobil_bus.push(mobil_bus);
        rows_sepeda_motor.push(sepeda_motor);
        rows_ransus.push(ransus);
        rows_jumlah_ranmor.push(jumlah_ranmor);
      }
      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_pelanggaran_berat,
        rows_pelanggaran_sedang,
        rows_pelanggaran_ringan,
        rows_teguran,
        rows_jumlah_garlantas,

        rows_meninggal_dunia,
        rows_luka_berat,
        rows_luka_ringan,
        rows_kerugian_material,
        rows_jumlah_lakalantas,

        rows_pengaturan,
        rows_penjagaan,
        rows_pengawalan,
        rows_patroli,
        rows_jumlah_turjagwali,

        rows_media_cetak,
        rows_media_elektronik,
        rows_media_sosial,
        rows_laka_langgar,
        rows_jumlah_dikmaslantas,

        rows_spanduk,
        rows_leaflet,
        rows_stiker,
        rows_billboard,
        rows_jemensosprek,
        rows_jumlah_penyebaran,

        rows_bpkb_baru,
        rows_bpkb_gantinama,
        rows_bpkb_rubentina,
        rows_jumlah_bpkb,

        rows_stnk_baru,
        rows_stnk_perpanjangan,
        rows_stnk_rubentina,
        rows_jumlah_stnk,

        rows_sim_baru,
        rows_sim_perpanjangan,
        rows_jumlah_sim,

        rows_mobil_barang,
        rows_mobil_bus,
        rows_mobil_penumpang,
        rows_sepeda_motor,
        rows_ransus,
        rows_jumlah_ranmor,
      };
      let results = templateLapharNew(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_${tgl}.xlsx`
      );
      res.download(`./public/export_laphar/laporan_harian_${tgl}.xlsx`);
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_laphar_new = async (req, res) => {
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
      } = req.query;

      const getDataRules = {
        group: [
          "polda.id",
          "garlantas.id",
          "turjagwali.id",
          "laka_lantas.id",
          "laka_langgar.id",
          "dikmaslantas.id",
          "penyebaran.id",
          "bpkb.id",
          "stnk.id",
          "sim.id",
          "ranmor.id",
        ],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Garlantas_polda_day,
            required: false,
            as: "garlantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
                "pelanggaran_berat",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
                "pelanggaran_ringan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
                "pelanggaran_sedang",
              ],
              [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
              [
                Sequelize.literal(
                  "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang + teguran)"
                ),
                "total_garlantas",
              ],
            ],
          },
          {
            model: Turjagwali_polda_day,
            required: false,
            as: "turjagwali",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("pengaturan")), "pengaturan"],
              [Sequelize.fn("sum", Sequelize.col("penjagaan")), "penjagaan"],
              [Sequelize.fn("sum", Sequelize.col("pengawalan")), "pengawalan"],
              [Sequelize.fn("sum", Sequelize.col("patroli")), "patroli"],
              [
                Sequelize.literal(
                  "SUM(turjagwali.pengawalan + turjagwali.penjagaan + turjagwali.patroli + turjagwali.pengaturan)"
                ),
                "total_turjagwali",
              ],
            ],
          },
          {
            model: Lakalantas_polda_day,
            required: false,
            as: "laka_lantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("meninggal_dunia")),
                "meninggal_dunia",
              ],
              [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
              [
                Sequelize.fn("sum", Sequelize.col("luka_ringan")),
                "luka_ringan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("kerugian_material")),
                "kerugian_material",
              ],
              [
                Sequelize.literal(
                  "SUM(laka_lantas.meninggal_dunia + laka_lantas.luka_berat + laka_lantas.luka_ringan)"
                ),
                "total_lakalantas",
              ],
            ],
          },
          {
            model: Lakalanggar_polda_day,
            required: false,
            as: "laka_langgar",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("capture_camera")),
                "capture_camera",
              ],
              [Sequelize.fn("sum", Sequelize.col("statis")), "statis"],
              [Sequelize.fn("sum", Sequelize.col("posko")), "posko"],
              [Sequelize.fn("sum", Sequelize.col("mobile")), "mobile"],
              [Sequelize.fn("sum", Sequelize.col("online")), "online"],
              [Sequelize.fn("sum", Sequelize.col("preemtif")), "preemtif"],
              [Sequelize.fn("sum", Sequelize.col("preventif")), "preventif"],
              [Sequelize.fn("sum", Sequelize.col("odol_227")), "odol_227"],
              [Sequelize.fn("sum", Sequelize.col("odol_307")), "odol_307"],
              [
                Sequelize.literal(
                  "SUM(laka_langgar.capture_camera + laka_langgar.statis + laka_langgar.posko + laka_langgar.mobile +  laka_langgar.online + laka_langgar.preemtif + laka_langgar.preventif + laka_langgar.odol_227 + laka_langgar.odol_307)"
                ),
                "total_lakalanggar",
              ],
            ],
          },
          {
            model: Dikmaslantas_polda_day,
            required: false,
            as: "dikmaslantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("media_cetak")),
                "media_cetak",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("media_elektronik")),
                "media_elektronik",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("media_sosial")),
                "media_sosial",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("laka_langgar")),
                "laka_langgar",
              ],
              [
                Sequelize.literal(
                  "SUM(dikmaslantas.media_elektronik + dikmaslantas.media_sosial + dikmaslantas.media_cetak + dikmaslantas.laka_langgar)"
                ),
                "total_dikmaslantas",
              ],
            ],
          },
          {
            model: Penyebaran_polda_day,
            required: false,
            as: "penyebaran",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("spanduk")), "spanduk"],
              [Sequelize.fn("sum", Sequelize.col("leaflet")), "leaflet"],
              [Sequelize.fn("sum", Sequelize.col("stiker")), "stiker"],
              [Sequelize.fn("sum", Sequelize.col("billboard")), "billboard"],
              [
                Sequelize.fn("sum", Sequelize.col("jemensosprek")),
                "jemensosprek",
              ],
              [
                Sequelize.literal(
                  "SUM(penyebaran.stiker + penyebaran.spanduk + penyebaran.leaflet + penyebaran.billboard + penyebaran.jemensosprek)"
                ),
                "total_penyebaran",
              ],
            ],
          },
          {
            model: Bpkb_polda_day,
            required: false,
            as: "bpkb",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("bpkb.baru")), "bpkb_baru"],
              [
                Sequelize.fn("sum", Sequelize.col("bpkb.perpanjangan")),
                "bpkb_perpanjangan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("bpkb.rubentina")),
                "bpkb_rubentina",
              ],
              [
                Sequelize.literal(
                  "SUM(bpkb.baru + bpkb.perpanjangan + bpkb.rubentina)"
                ),
                "total_bpkb",
              ],
            ],
          },
          {
            model: Stnk_polda_day,
            required: false,
            as: "stnk",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("stnk.baru")), "stnk_baru"],
              [
                Sequelize.fn("sum", Sequelize.col("stnk.perpanjangan")),
                "stnk_perpanjangan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("stnk.rubentina")),
                "stnk_rubentina",
              ],
              [
                Sequelize.literal(
                  "SUM(stnk.baru + stnk.perpanjangan + stnk.rubentina)"
                ),
                "total_stnk",
              ],
            ],
          },
          {
            model: Sim_polda_day,
            required: false,
            as: "sim",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("sim.baru")), "sim_baru"],
              [
                Sequelize.fn("sum", Sequelize.col("sim.perpanjangan")),
                "sim_perpanjangan",
              ],
              [
                Sequelize.literal("SUM(sim.baru + sim.perpanjangan)"),
                "total_sim",
              ],
            ],
          },
          {
            model: Ranmor_polda_day,
            required: false,
            as: "ranmor",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("mobil_penumpang")),
                "mobil_penumpang",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mobil_barang")),
                "mobil_barang",
              ],
              [Sequelize.fn("sum", Sequelize.col("mobil_bus")), "mobil_bus"],
              [Sequelize.fn("sum", Sequelize.col("ransus")), "ransus"],
              [
                Sequelize.fn("sum", Sequelize.col("sepeda_motor")),
                "sepeda_motor",
              ],
              [
                Sequelize.literal(
                  "SUM(ranmor.mobil_penumpang + ranmor.mobil_barang + ranmor.mobil_bus + ranmor.ransus + ranmor.sepeda_motor)"
                ),
                "total_ranmor",
              ],
            ],
          },
        ],
        nest: true,
        subQuery: false,
      };

      let path = "Laporan-Harian-Rekapitulasi.xlsx";
      let tgl = "Keseluruhan";
      if (date) {
        path = `Laporan-Harian-${date}.xlsx`;
        tgl = date;
        for (let i = 0; i < getDataRules.include.length; i++) {
          getDataRules.include[i].where = {
            date: date,
          };
        }
      }

      if (filter) {
        path = `Laporan-Harian-${start_date}-s.d-${end_date}.xlsx`;
        tgl = `${start_date} s.d ${end_date}`;
        for (let i = 0; i < getDataRules.include.length; i++) {
          getDataRules.include[i].where = {
            date: {
              [Op.between]: [start_date, end_date],
            },
          };
        }
      }

      if (polda_id) {
        let asd = "";
        let bsd = "";
        if (filter) {
          asd = `${start_date}-s.d-${end_date}`;
          bsd = `${start_date} s.d ${end_date}`;
        }

        if (date) {
          asd = date;
          bsd = date;
        }
        path = `Laporan-Harian-${polda_id}-${asd}.xlsx`;
        tgl = bsd;
        getDataRules.where = {
          id: decAes(polda_id),
        };
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let finals = await Polda.findAll(getDataRules);

      let polda_name = [];
      for (let i = 0; i < finals.length; i++) {
        polda_name.push(finals[i].dataValues.name_polda);
      }
      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      // let results = templateLapharNew(polda_name);
      // const workSheet = XLSX.utils.table_to_sheet(results);
      // const workBook = XLSX.utils.book_new();
      // XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      // XLSX.writeFile(workBook, `./public/export_laphar/asd.xlsx`);
      response(res, true, "Succeed", finals);

      // console.log("file ada");
      // res.download(`./public/export_laphar/asd.xlsx`);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_anev_ditgakkum = async (req, res) => {
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
        type = null,
      } = req.query;
      let rules_today = "";
      let rules_yesterday = "";
      let today = "";
      let yesterday = "";
      let name_todays = "";
      let name_yesterdays = "";
      let full_date = moment(date).locale("id").format("LL");
      if (type === "day") {
        rules_today = { date: date };
        today = date;
        rules_yesterday = {
          date: moment(date, "YYYY-MM-DD").subtract(1, "days"),
        };
        yesterday = moment(date).subtract(1, "days").format("YYYY-MM-DD");

        name_todays = moment(today).locale("id").format("dddd DD-MM-YYYY");

        name_yesterdays = moment(yesterday)
          .locale("id")
          .format("dddd DD-MM-YYYY");
      } else if (type === "month") {
        console.log(date);
        let start_today_date = moment(date)
          .startOf("month")
          .format("YYYY-MM-DD");
        let end_today_date = moment(date).endOf("month").format("YYYY-MM-DD");

        let start_yesterday_date = moment(date)
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD");
        let end_yesterday_date = moment(date)
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD");

        rules_today = {
          date: {
            [Op.between]: [start_today_date, end_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [start_yesterday_date, end_yesterday_date],
          },
        };

        today = moment(date).format("MMMM");
        yesterday = moment(date).subtract(1, "month").format("MMMM");

        name_todays = moment(date).locale("id").format("MMMM");

        name_yesterdays = moment(date)
          .subtract(1, "month")
          .locale("id")
          .format("MMMM");
      } else if (type === "years") {
        let start_today_date = moment(date)
          .startOf("years")
          .format("YYYY-MM-DD");
        let end_today_date = moment(date)
          .endOf("years")
          .format("YYYY-MM-DD");

        let start_yesterday_date = moment(date)
          .subtract(1, "years")
          .startOf("years")
          .format("YYYY-MM-DD");
        let end_yesterday_date = moment(date)
          .subtract(1, "years")
          .endOf("years")
          .format("YYYY-MM-DD");
        
        rules_today = {
          date: {
            [Op.between]: [start_today_date, end_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [start_yesterday_date, end_yesterday_date],
          },
        };

        today = moment(date).format("YYYY");
        yesterday = moment(date).subtract(1, "years").format("YYYY");

        name_todays = today;

        name_yesterdays = yesterday;
      } else if (type === "weeks") {
        let start_today_date = moment(date)
          .clone()
          .startOf("week")
          .format("YYYY-MM-DD");
        let end_today_date = moment(date)
          .clone()
          .endOf("week")
          .format("YYYY-MM-DD");

        let start_yesterday_date = moment(date)
          .clone()
          .subtract(1, "week")
          .startOf("week")
          .format("YYYY-MM-DD");
        let end_yesterday_date = moment(date)
          .clone()
          .subtract(1, "week")
          .endOf("week")
          .format("YYYY-MM-DD");

        rules_today = {
          date: {
            [Op.between]: [start_today_date, end_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [start_yesterday_date, end_yesterday_date],
          },
        };

        name_todays =
          moment(start_today_date).locale("id").format("dddd DD-MM-YYYY") +
          " s.d " +
          moment(end_today_date).locale("id").format("dddd DD-MM-YYYY");

        name_yesterdays =
          moment(start_yesterday_date).locale("id").format("dddd DD-MM-YYYY") +
          " s.d " +
          moment(end_yesterday_date).locale("id").format("dddd DD-MM-YYYY");
      } else if (type === "triwulan") {
        let start_today_date = moment(date).format("MM");
        let end_today_date = moment(date).subtract(2, "month").format("MM");

        let start_yesterday_date = moment(date)
          .subtract(3, "month")
          .format("MM");
        let end_yesterday_date = moment(date).subtract(5, "month").format("MM");

        rules_today = {
          date: {
            [Op.between]: [end_today_date, start_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [end_yesterday_date, start_yesterday_date],
          },
        };

        name_todays =
          moment(end_today_date).locale("id").format("MMMM") +
          " s.d " +
          moment(start_today_date).locale("id").format("MMMM");

        name_yesterdays =
          moment(end_yesterday_date).locale("id").format("MMMM") +
          " s.d " +
          moment(start_yesterday_date).locale("id").format("MMMM");
      }

      let getLakaToday = await Lakalantas_polda_day.findAll({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("meninggal_dunia")),
            "meninggal_dunia",
          ],
          [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
          [Sequelize.fn("sum", Sequelize.col("luka_ringan")), "luka_ringan"],
          // [Sequelize.fn("date_trunc", "month", Sequelize.col("date")), "year"],
          [
            Sequelize.fn("sum", Sequelize.col("kerugian_material")),
            "kerugian_material",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("insiden_kecelakaan")),
            "insiden_kecelakaan",
          ],
        ],
        where: rules_today,
      });
      let getLakaYesterday = await Lakalantas_polda_day.findAll({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("meninggal_dunia")),
            "meninggal_dunia",
          ],
          [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
          [Sequelize.fn("sum", Sequelize.col("luka_ringan")), "luka_ringan"],
          // [Sequelize.fn("date_trunc", "month", Sequelize.col("date")), "year"],
          [
            Sequelize.fn("sum", Sequelize.col("kerugian_material")),
            "kerugian_material",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("insiden_kecelakaan")),
            "insiden_kecelakaan",
          ],
        ],
        where: rules_yesterday,
      });

      let getGarToday = await Garlantas_polda_day.findAll({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
            "pelanggaran_berat",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
            "pelanggaran_ringan",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
            "pelanggaran_sedang",
          ],
          // [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
          [
            Sequelize.literal(
              "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang)"
            ),
            "total_garlantas",
          ],
        ],
        where: rules_today,
      });

      let getGarYesterday = await Garlantas_polda_day.findAll({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
            "pelanggaran_berat",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
            "pelanggaran_ringan",
          ],
          [
            Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
            "pelanggaran_sedang",
          ],
          // [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
          [
            Sequelize.literal(
              "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang)"
            ),
            "total_garlantas",
          ],
        ],
        where: rules_yesterday,
      });

      let getTurjagwaliToday = await Turjagwali_polda_day.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("pengaturan")), "pengaturan"],
          [Sequelize.fn("sum", Sequelize.col("penjagaan")), "penjagaan"],
          [Sequelize.fn("sum", Sequelize.col("pengawalan")), "pengawalan"],
          [Sequelize.fn("sum", Sequelize.col("patroli")), "patroli"],
          [
            Sequelize.literal(
              "SUM(pengawalan + penjagaan + patroli + pengaturan)"
            ),
            "total_turjagwali",
          ],
        ],
        where: rules_today,
      });

      let getTurjagwaliYesterday = await Turjagwali_polda_day.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("pengaturan")), "pengaturan"],
          [Sequelize.fn("sum", Sequelize.col("penjagaan")), "penjagaan"],
          [Sequelize.fn("sum", Sequelize.col("pengawalan")), "pengawalan"],
          [Sequelize.fn("sum", Sequelize.col("patroli")), "patroli"],
          [
            Sequelize.literal(
              "SUM(pengawalan + penjagaan + patroli + pengaturan)"
            ),
            "total_turjagwali",
          ],
        ],
        where: rules_yesterday,
      });

      let anev_laka = [];
      for (let i = 0; i < getLakaToday.length; i++) {
        let insiden_kecelakaan_today =
          parseInt(getLakaToday[i].dataValues.insiden_kecelakaan) || 0;
        let insiden_kecelakaan_yesterday =
          parseInt(getLakaYesterday[i].dataValues.insiden_kecelakaan) || 0;

        let meninggal_dunia_today =
          parseInt(getLakaToday[i].dataValues.meninggal_dunia) || 0;
        let meninggal_dunia_yesterday =
          parseInt(getLakaYesterday[i].dataValues.meninggal_dunia) || 0;

        let luka_berat_today =
          parseInt(getLakaToday[i].dataValues.luka_berat) || 0;
        let luka_berat_yesterday =
          parseInt(getLakaYesterday[i].dataValues.luka_berat) || 0;

        let luka_ringan_today =
          parseInt(getLakaToday[i].dataValues.luka_ringan) || 0;
        let luka_ringan_yesterday =
          parseInt(getLakaYesterday[i].dataValues.luka_ringan) || 0;

        let kerugian_material_today =
          parseInt(getLakaToday[i].dataValues.kerugian_material) || 0;
        let kerugian_material_yesterday =
          parseInt(getLakaYesterday[i].dataValues.kerugian_material) || 0;

        let angka_insiden_kecelakaan =
          insiden_kecelakaan_today - insiden_kecelakaan_yesterday;
        let angka_meninggal_dunia =
          meninggal_dunia_today - meninggal_dunia_yesterday;
        let angka_luka_berat = luka_berat_today - luka_berat_yesterday;
        let angka_luka_ringan = luka_ringan_today - luka_ringan_yesterday;
        let angka_kerugian_material =
          kerugian_material_today - kerugian_material_yesterday;

        let persen_insiden_kecelakaan = (
          (angka_insiden_kecelakaan / insiden_kecelakaan_yesterday) *
          100
        ).toFixed(0);
        let persen_meninggal_dunia = (
          (angka_meninggal_dunia / meninggal_dunia_yesterday) *
          100
        ).toFixed(0);
        let persen_luka_berat = (
          (angka_luka_berat / luka_berat_yesterday) *
          100
        ).toFixed(0);
        let persen_luka_ringan = (
          (angka_luka_ringan / luka_ringan_yesterday) *
          100
        ).toFixed(0);
        let persen_kerugian_material = (
          (angka_kerugian_material / kerugian_material_yesterday) *
          100
        ).toFixed(0);

        let status_meninggal_dunia = "SAMA";
        let status_luka_berat = "SAMA";
        let status_luka_ringan = "SAMA";
        let status_kerugian_material = "SAMA";
        let status_insiden_kecelakaan = "SAMA";

        if (
          getLakaToday[i].dataValues.insiden_kecelakaan >
          getLakaYesterday[i].dataValues.insiden_kecelakaan
        ) {
          status_insiden_kecelakaan = "NAIK";
        } else if (
          getLakaToday[i].dataValues.insiden_kecelakaan <
          getLakaYesterday[i].dataValues.insiden_kecelakaan
        ) {
          status_insiden_kecelakaan = "TURUN";
        } else if (
          getLakaToday[i].dataValues.insiden_kecelakaan ==
          getLakaYesterday[i].dataValues.insiden_kecelakaan
        ) {
          status_insiden_kecelakaan = "SAMA";
        }

        if (
          getLakaToday[i].dataValues.meninggal_dunia >
          getLakaYesterday[i].dataValues.meninggal_dunia
        ) {
          status_meninggal_dunia = "NAIK";
        } else if (
          getLakaToday[i].dataValues.meninggal_dunia <
          getLakaYesterday[i].dataValues.meninggal_dunia
        ) {
          status_meninggal_dunia = "TURUN";
        } else if (
          getLakaToday[i].dataValues.meninggal_dunia ==
          getLakaYesterday[i].dataValues.meninggal_dunia
        ) {
          status_meninggal_dunia = "SAMA";
        }

        if (insiden_kecelakaan_today > insiden_kecelakaan_yesterday) {
          status_insiden_kecelakaan = "NAIK";
        } else if (insiden_kecelakaan_today < insiden_kecelakaan_yesterday) {
          status_insiden_kecelakaan = "TURUN";
        } else if (insiden_kecelakaan_today == insiden_kecelakaan_yesterday) {
          status_insiden_kecelakaan = "SAMA";
        }

        if (meninggal_dunia_today > meninggal_dunia_yesterday) {
          status_meninggal_dunia = "NAIK";
        } else if (meninggal_dunia_today < meninggal_dunia_yesterday) {
          status_meninggal_dunia = "TURUN";
        } else if (meninggal_dunia_today == meninggal_dunia_yesterday) {
          status_meninggal_dunia = "SAMA";
        }

        if (luka_berat_today > luka_berat_yesterday) {
          status_luka_berat = "NAIK";
        } else if (luka_berat_today < luka_berat_yesterday) {
          status_luka_berat = "TURUN";
        } else if (luka_berat_today == luka_berat_yesterday) {
          status_luka_berat = "SAMA";
        }

        if (luka_ringan_today > luka_ringan_yesterday) {
          status_luka_ringan = "NAIK";
        } else if (luka_ringan_today < luka_ringan_yesterday) {
          status_luka_ringan = "TURUN";
        } else if (luka_ringan_today == luka_ringan_yesterday) {
          status_luka_ringan = "SAMA";
        }

        if (kerugian_material_today > kerugian_material_yesterday) {
          status_kerugian_material = "NAIK";
        } else if (kerugian_material_today < kerugian_material_yesterday) {
          status_kerugian_material = "TURUN";
        } else if (kerugian_material_today == kerugian_material_yesterday) {
          status_kerugian_material = "SAMA";
        }

        anev_laka.push({
          today,
          yesterday,
          insiden_kecelakaan_today,
          insiden_kecelakaan_yesterday,
          meninggal_dunia_today,
          meninggal_dunia_yesterday,
          luka_berat_today,
          luka_berat_yesterday,
          luka_ringan_today,
          luka_ringan_yesterday,
          kerugian_material_today,
          kerugian_material_yesterday,
          angka_insiden_kecelakaan,
          angka_meninggal_dunia,
          angka_luka_berat,
          angka_luka_ringan,
          angka_kerugian_material,
          persen_insiden_kecelakaan,
          persen_meninggal_dunia,
          persen_kerugian_material,
          persen_luka_berat,
          persen_luka_ringan,
          status_insiden_kecelakaan,
          status_meninggal_dunia,
          status_luka_berat,
          status_luka_ringan,
          status_kerugian_material,
        });
      }

      let anev_gar = [];
      for (let i = 0; i < getGarToday.length; i++) {
        let pelanggaran_berat_today =
          parseInt(getGarToday[i].dataValues.pelanggaran_berat) || 0;
        let pelanggaran_berat_yesterday =
          parseInt(getGarYesterday[i].dataValues.pelanggaran_berat) || 0;

        let pelanggaran_sedang_today =
          parseInt(getGarToday[i].dataValues.pelanggaran_sedang) || 0;
        let pelanggaran_sedang_yesterday =
          parseInt(getGarYesterday[i].dataValues.pelanggaran_sedang) || 0;

        let pelanggaran_ringan_today =
          parseInt(getGarToday[i].dataValues.pelanggaran_ringan) || 0;
        let pelanggaran_ringan_yesterday =
          parseInt(getGarYesterday[i].dataValues.pelanggaran_ringan) || 0;

        let total_garlantas_today =
          parseInt(getGarToday[i].dataValues.total_garlantas) || 0;
        let total_garlantas_yesterday =
          parseInt(getGarYesterday[i].dataValues.total_garlantas) || 0;

        let angka_pelanggaran_berat =
          pelanggaran_berat_today - pelanggaran_berat_yesterday;

        let angka_pelanggaran_sedang =
          pelanggaran_sedang_today - pelanggaran_sedang_yesterday;

        let angka_pelanggaran_ringan =
          pelanggaran_ringan_today - pelanggaran_ringan_yesterday;

        let angka_total_garlantas =
          total_garlantas_today - total_garlantas_yesterday;

        let persen_pelanggaran_berat = (
          (angka_pelanggaran_berat / pelanggaran_berat_yesterday) *
          100
        ).toFixed(0);
        let persen_pelanggaran_ringan = (
          (angka_pelanggaran_ringan / pelanggaran_ringan_yesterday) *
          100
        ).toFixed(0);
        let persen_pelanggaran_sedang = (
          (angka_pelanggaran_sedang / pelanggaran_sedang_yesterday) *
          100
        ).toFixed(0);
        let persen_total_garlantas = (
          (angka_total_garlantas / total_garlantas_yesterday) *
          100
        ).toFixed(0);

        let status_pelanggaran_berat = "SAMA";
        let status_pelanggaran_sedang = "SAMA";
        let status_pelanggaran_ringan = "SAMA";
        let status_total_garlantas = "SAMA";

        if (pelanggaran_berat_today > pelanggaran_berat_yesterday) {
          status_pelanggaran_berat = "NAIK";
        } else if (pelanggaran_berat_today < pelanggaran_berat_yesterday) {
          status_pelanggaran_berat = "TURUN";
        } else if (pelanggaran_berat_today == pelanggaran_berat_yesterday) {
          status_pelanggaran_berat = "SAMA";
        }

        if (pelanggaran_sedang_today > pelanggaran_sedang_yesterday) {
          status_pelanggaran_sedang = "NAIK";
        } else if (pelanggaran_sedang_today < pelanggaran_sedang_yesterday) {
          status_pelanggaran_sedang = "TURUN";
        } else if (pelanggaran_sedang_today == pelanggaran_sedang_yesterday) {
          status_pelanggaran_sedang = "SAMA";
        }

        if (pelanggaran_ringan_today > pelanggaran_ringan_yesterday) {
          status_pelanggaran_ringan = "NAIK";
        } else if (pelanggaran_ringan_today < pelanggaran_ringan_yesterday) {
          status_pelanggaran_ringan = "TURUN";
        } else if (pelanggaran_ringan_today == pelanggaran_ringan_yesterday) {
          status_pelanggaran_ringan = "SAMA";
        }

        if (total_garlantas_today > total_garlantas_yesterday) {
          status_total_garlantas = "NAIK";
        } else if (total_garlantas_today < total_garlantas_yesterday) {
          status_total_garlantas = "TURUN";
        } else if (total_garlantas_today == total_garlantas_yesterday) {
          status_total_garlantas = "SAMA";
        }

        anev_gar.push({
          today,
          yesterday,
          pelanggaran_berat_today,
          pelanggaran_berat_yesterday,
          pelanggaran_sedang_today,
          pelanggaran_sedang_yesterday,
          pelanggaran_ringan_today,
          pelanggaran_ringan_yesterday,
          total_garlantas_today,
          total_garlantas_yesterday,
          angka_pelanggaran_berat,
          angka_pelanggaran_sedang,
          angka_pelanggaran_ringan,
          angka_total_garlantas,
          persen_pelanggaran_berat,
          persen_total_garlantas,
          persen_pelanggaran_sedang,
          persen_pelanggaran_ringan,
          status_pelanggaran_berat,
          status_pelanggaran_sedang,
          status_pelanggaran_ringan,
          status_total_garlantas,
        });
      }

      let anev_turjagwali = [];
      for (let i = 0; i < getTurjagwaliToday.length; i++) {
        let pengaturan_today =
          parseInt(getTurjagwaliToday[i].dataValues.pengaturan) || 0;
        let pengaturan_yesterday =
          parseInt(getTurjagwaliYesterday[i].dataValues.pengaturan) || 0;

        let penjagaan_today =
          parseInt(getTurjagwaliToday[i].dataValues.penjagaan) || 0;
        let penjagaan_yesterday =
          parseInt(getTurjagwaliYesterday[i].dataValues.penjagaan) || 0;

        let pengawalan_today =
          parseInt(getTurjagwaliToday[i].dataValues.pengawalan) || 0;
        let pengawalan_yesterday =
          parseInt(getTurjagwaliYesterday[i].dataValues.pengawalan) || 0;

        let patroli_today =
          parseInt(getTurjagwaliToday[i].dataValues.patroli) || 0;
        let patroli_yesterday =
          parseInt(getTurjagwaliYesterday[i].dataValues.patroli) || 0;

        let total_turjagwali_today =
          parseInt(getTurjagwaliToday[i].dataValues.total_turjagwali) || 0;
        let total_turjagwali_yesterday =
          parseInt(getTurjagwaliYesterday[i].dataValues.total_turjagwali) || 0;

        let angka_pengaturan = pengaturan_today - pengaturan_yesterday;

        let angka_penjagaan = penjagaan_today - penjagaan_yesterday;

        let angka_pengawalan = pengawalan_today - pengawalan_yesterday;

        let angka_patroli = patroli_today - patroli_yesterday;

        let angka_total_turjagwali =
          total_turjagwali_today - total_turjagwali_yesterday;

        let persen_pengaturan = (
          (angka_pengaturan / pengaturan_yesterday) *
          100
        ).toFixed(0);
        let persen_pengawalan = (
          (angka_pengawalan / pengawalan_yesterday) *
          100
        ).toFixed(0);
        let persen_penjagaan = (
          (angka_penjagaan / penjagaan_yesterday) *
          100
        ).toFixed(0);
        let persen_patroli = (
          (angka_patroli / patroli_yesterday) *
          100
        ).toFixed(0);

        let persen_total_turjagwali = (
          (angka_total_turjagwali / total_turjagwali_yesterday) *
          100
        ).toFixed(0);

        let status_pengaturan = "SAMA";
        let status_penjagaan = "SAMA";
        let status_pengawalan = "SAMA";
        let status_patroli = "SAMA";
        let status_total_turjagwali = "SAMA";

        if (pengaturan_today > pengaturan_yesterday) {
          status_pengaturan = "NAIK";
        } else if (pengaturan_today < pengaturan_yesterday) {
          status_pengaturan = "TURUN";
        } else if (pengaturan_today == pengaturan_yesterday) {
          status_pengaturan = "SAMA";
        }

        if (penjagaan_today > penjagaan_yesterday) {
          status_penjagaan = "NAIK";
        } else if (penjagaan_today < penjagaan_yesterday) {
          status_penjagaan = "TURUN";
        } else if (penjagaan_today == penjagaan_yesterday) {
          status_penjagaan = "SAMA";
        }

        if (pengawalan_today > pengawalan_yesterday) {
          status_pengawalan = "NAIK";
        } else if (pengawalan_today < pengawalan_yesterday) {
          status_pengawalan = "TURUN";
        } else if (pengawalan_today == pengawalan_yesterday) {
          status_pengawalan = "SAMA";
        }

        if (patroli_today > patroli_yesterday) {
          status_patroli = "NAIK";
        } else if (patroli_today < patroli_yesterday) {
          status_patroli = "TURUN";
        } else if (patroli_today == patroli_yesterday) {
          status_patroli = "SAMA";
        }

        if (total_turjagwali_today > total_turjagwali_yesterday) {
          status_total_turjagwali = "NAIK";
        } else if (total_turjagwali_today < total_turjagwali_yesterday) {
          status_total_turjagwali = "TURUN";
        } else if (total_turjagwali_today == total_turjagwali_yesterday) {
          status_total_turjagwali = "SAMA";
        }

        anev_turjagwali.push({
          today,
          yesterday,
          pengaturan_today,
          pengaturan_yesterday,
          penjagaan_today,
          penjagaan_yesterday,
          pengawalan_today,
          pengawalan_yesterday,
          patroli_today,
          patroli_yesterday,
          total_turjagwali_today,
          total_turjagwali_yesterday,

          angka_pengaturan,
          angka_penjagaan,
          angka_pengawalan,
          angka_patroli,
          angka_total_turjagwali,

          persen_pengaturan,
          persen_patroli,
          persen_penjagaan,
          persen_pengawalan,
          persen_total_turjagwali,

          status_pengaturan,
          status_penjagaan,
          status_pengawalan,
          status_patroli,
          status_total_turjagwali,
        });
      }
      const getDataRules_laka = {
        group: ["polda.id"],
        attributes: [
          "id",
          "name_polda",
          [
            Sequelize.fn("sum", Sequelize.col("meninggal_dunia")),
            "meninggal_dunia",
          ],
          [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
          [Sequelize.fn("sum", Sequelize.col("luka_ringan")), "luka_ringan"],
          [
            Sequelize.fn("sum", Sequelize.col("insiden_kecelakaan")),
            "insiden_kecelakaan",
          ],
          [Sequelize.fn("sum", Sequelize.col("total_korban")), "total_korban"],
          [
            Sequelize.fn("sum", Sequelize.col("kerugian_material")),
            "kerugian_material",
          ],
          [
            Sequelize.literal(
              "SUM(meninggal_dunia + luka_berat + luka_ringan)"
            ),
            "total",
          ],
        ],
        include: [
          {
            model: Lakalantas_polda_day,
            required: false,
            as: "laka_lantas",
            attributes: [],
          },
        ],
        nest: true,
        subQuery: false,
      };


        getDataRules_laka.include[0].where = rules_today
     

      let rows_laka = [];
      let finals_laka = await Polda.findAll(getDataRules_laka);
      finals_laka.map((element, index) => {
        rows_laka.push({
          id: element.id,
          name_polda: element.name_polda,
          meninggal_dunia: parseInt(element.dataValues.meninggal_dunia) || 0,
          luka_berat: parseInt(element.dataValues.luka_berat) || 0,
          luka_ringan: parseInt(element.dataValues.luka_ringan) || 0,
          insiden_kecelakaan:
            parseInt(element.dataValues.insiden_kecelakaan) || 0,
          kerugian_material:
            parseInt(element.dataValues.kerugian_material) || 0,
          total: parseInt(element.dataValues.total) || 0,
        });
      });

      rows_laka.sort((a, b) => b.insiden_kecelakaan - a.insiden_kecelakaan);
      rows_laka = rows_laka.slice(0, 40);

      const getDataRules_gar = {
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
            model: Garlantas_polda_day,
            required: false,
            as: "garlantas",
            attributes: [],
          },
        ],
        nest: true,
        subQuery: false,
      };


        getDataRules_gar.include[0].where = rules_today

      let finals_gar = await Polda.findAll(getDataRules_gar);

      let rows_gar = [];

      finals_gar.map((element, index) => {
        rows_gar.push({
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

      rows_gar.sort((a, b) => b.total - a.total);
      rows_gar = rows_gar.slice(0, 40);

      const getDataRules_tur = {
        group: ["polda.id"],
        attributes: [
          "id",
          "name_polda",
          [Sequelize.fn("sum", Sequelize.col("pengaturan")), "pengaturan"],
          [Sequelize.fn("sum", Sequelize.col("penjagaan")), "penjagaan"],
          [Sequelize.fn("sum", Sequelize.col("pengawalan")), "pengawalan"],
          [Sequelize.fn("sum", Sequelize.col("patroli")), "patroli"],
          [
            Sequelize.literal(
              "SUM(pengaturan + penjagaan + pengawalan + patroli)"
            ),
            "total",
          ],
        ],
        include: [
          {
            model: Turjagwali_polda_day,
            required: false,
            as: "turjagwali",
            attributes: [],
          },
        ],
        nest: true,
        subQuery: false,
      };


        getDataRules_tur.include[0].where = rules_today
  

      let finals_tur = await Polda.findAll(getDataRules_tur);

      let rows_tur = [];

      finals_tur.map((element, index) => {
        rows_tur.push({
          id: element.id,
          name_polda: element.name_polda,
          pengaturan: parseInt(element.dataValues.pengaturan) || 0,
          penjagaan: parseInt(element.dataValues.penjagaan) || 0,
          pengawalan: parseInt(element.dataValues.pengawalan) || 0,
          patroli: parseInt(element.dataValues.patroli) || 0,
          total: parseInt(element.dataValues.total) || 0,
        });
      });

      rows_tur.sort((a, b) => b.total - a.total);
      rows_tur = rows_tur.slice(0, 40);

      let labels = [];
      let labels_md = [];
      let labels_lb = [];
      let labels_lr = [];
      let labels_jk = [];

      let labels_pb = [];
      let labels_ps = [];
      let labels_pr = [];

      let labels_tur = [];
      let labels_jag = [];
      let labels_wal = [];
      let labels_li = [];

      labels.push(name_yesterdays, name_todays);
      labels_md.push(
        anev_laka[0].meninggal_dunia_yesterday,
        anev_laka[0].meninggal_dunia_today
      );
      labels_lb.push(
        anev_laka[0].luka_berat_yesterday,
        anev_laka[0].luka_berat_today
      );
      labels_lr.push(
        anev_laka[0].luka_ringan_yesterday,
        anev_laka[0].luka_ringan_today
      );
      labels_jk.push(
        anev_laka[0].insiden_kecelakaan_yesterday,
        anev_laka[0].insiden_kecelakaan_today
      );

      labels_pb.push(
        anev_gar[0].pelanggaran_berat_yesterday,
        anev_gar[0].pelanggaran_berat_today
      );

      labels_ps.push(
        anev_gar[0].pelanggaran_sedang_yesterday,
        anev_gar[0].pelanggaran_sedang_today
      );

      labels_pr.push(
        anev_gar[0].pelanggaran_ringan_yesterday,
        anev_gar[0].pelanggaran_ringan_today
      );

      labels_tur.push(
        anev_turjagwali[0].pengaturan_yesterday,
        anev_turjagwali[0].pengaturan_today
      );
      labels_jag.push(
        anev_turjagwali[0].penjagaan_yesterday,
        anev_turjagwali[0].penjagaan_today
      );
      labels_wal.push(
        anev_turjagwali[0].pengawalan_yesterday,
        anev_turjagwali[0].pengawalan_today
      );
      labels_li.push(
        anev_turjagwali[0].patroli_yesterday,
        anev_turjagwali[0].patroli_today
      );

      // let results = tempAnevGakkum(anev_laka, anev_gar, anev_turjagwali);
      // const workSheet = XLSX.utils.table_to_sheet(results);
      // const workBook = XLSX.utils.book_new();
      // XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      // XLSX.writeFile(
      //   workBook,
      //   `./public/export_laphar/anev_gakkum_${date}.xlsx`
      // );
      // res.download(`./public/export_laphar/anev_gakkum_${date}.xlsx`);
      // response(res, true, "Succeed", {
      //   anev_laka,
      //   anev_gar,
      //   anev_turjagwali,
      //   name_todays,
      //   name_yesterdays,
      //   full_date,
      //   rows_gar,
      //   rows_laka,
      //   labels,
      //   labels_md,
      //   labels_lb,
      //   labels_lr,
      //   labels_jk,
      // });
      let browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disabled-setupid-sandbox"],
        executablePath: process.env.ANEV_CHROME_PATH,
      });

      const [page] = await browser.pages();
      const html = await ejs.renderFile(
        path.join("./src/view/template/anev_ditgakkum.ejs"),
        {
          anev_laka,
          anev_gar,
          anev_turjagwali,
          name_todays,
          name_yesterdays,
          full_date,
          rows_gar,
          rows_laka,
          rows_tur,
          labels,
          labels_md,
          labels_lb,
          labels_lr,
          labels_jk,
          labels_pb,
          labels_ps,
          labels_pr,
          labels_tur,
          labels_jag,
          labels_wal,
          labels_li,
        }
      );
      await page.setContent(html);
      const pdf = await page.pdf({
        displayHeaderFooter: true,
        headerTemplate: `<div style="width: 100%; font-size: 10px; margin: 0 1cm; color: #bbb; height: 30px; text-align: center;">
          <span class="pageNumber" style="font-size: 10px;"></span>
      </div>`,
        footerTemplate: `<div style="width: 100%; font-size: 10px; margin: 0 1cm; color: #bbb; height: 30px; text-align: center;">

      </div>`,
        printBackground: true,
        format: "A4",
        landscape: false,
        margin: {
          top: "80px",
          right: "0px",
          bottom: "80px",
          left: "0px",
        },
      });

      res.contentType("application/pdf");

      // optionally:
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Laporan-Harian-Ditgakkum.pdf"
      );

      res.send(pdf);
      await browser.close();
      // res.render("template/anev_ditgakkum", {
      //   anev_laka,
      //   anev_gar,
      //   anev_turjagwali,
      //   name_todays,
      //   name_yesterdays,
      //   full_date,
      // });
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_anev_ditkamsel = async (req, res) => {
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
        type = null,
      } = req.query;
      let rules_today = "";
      let rules_yesterday = "";
      let today = "";
      let yesterday = "";
      let name_todays = "";
      let name_yesterdays = "";
      let full_date = moment(date).locale("id").format("LL");
      if (type === "day") {
        rules_today = { date: date };
        today = date;
        rules_yesterday = {
          date: moment(date, "YYYY-MM-DD").subtract(1, "days"),
        };
        yesterday = moment(date).subtract(1, "days").format("YYYY-MM-DD");

        name_todays = moment(today).locale("id").format("dddd DD-MM-YYYY");

        name_yesterdays = moment(yesterday)
          .locale("id")
          .format("dddd DD-MM-YYYY");
      } else if (type === "month") {
        let start_today_date = moment(date, "MM")
          .startOf("month")
          .format("YYYY-MM-DD");
        let end_today_date = moment(date, "MM")
          .endOf("month")
          .format("YYYY-MM-DD");

        let start_yesterday_date = moment(date, "MM")
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD");
        let end_yesterday_date = moment(date, "MM")
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD");

        rules_today = {
          date: {
            [Op.between]: [start_today_date, end_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [start_yesterday_date, end_yesterday_date],
          },
        };

        today = moment(date).format("MMMM");
        yesterday = moment(date).subtract(1, "month").format("MMMM");

        name_todays = moment(date).locale("id").format("MMMM");

        name_yesterdays = moment(date)
          .subtract(1, "month")
          .locale("id")
          .format("MMMM");
      } else if (type === "years") {
        let start_today_date = moment(date, "YYYY")
          .startOf("years")
          .format("YYYY-MM-DD");
        let end_today_date = moment(date, "YYYY")
          .endOf("years")
          .format("YYYY-MM-DD");

        let start_yesterday_date = moment(date, "YYYY")
          .subtract(1, "years")
          .startOf("years")
          .format("YYYY-MM-DD");
        let end_yesterday_date = moment(date, "YYYY")
          .subtract(1, "years")
          .endOf("years")
          .format("YYYY-MM-DD");

        rules_today = {
          date: {
            [Op.between]: [start_today_date, end_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [start_yesterday_date, end_yesterday_date],
          },
        };

        today = moment(date).format("YYYY");
        yesterday = moment(date).subtract(1, "years").format("YYYY");

        name_todays = today;

        name_yesterdays = yesterday;
      } else if (type === "weeks") {
        let start_today_date = moment(date).format("YYYY-MM-DD");
        let end_today_date = moment(date)
          .subtract(6, "days")
          .format("YYYY-MM-DD");

        let start_yesterday_date = moment(date)
          .subtract(7, "days")
          .format("YYYY-MM-DD");
        let end_yesterday_date = moment(date)
          .subtract(13, "days")
          .format("YYYY-MM-DD");

        rules_today = {
          date: {
            [Op.between]: [end_today_date, start_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [end_yesterday_date, start_yesterday_date],
          },
        };

        name_todays =
          moment(end_today_date).locale("id").format("dddd DD-MM-YYYY") +
          " s.d " +
          moment(start_today_date).locale("id").format("dddd DD-MM-YYYY");

        name_yesterdays =
          moment(end_yesterday_date).locale("id").format("dddd DD-MM-YYYY") +
          " s.d " +
          moment(start_yesterday_date).locale("id").format("dddd DD-MM-YYYY");
      } else if (type === "triwulan") {
        let start_today_date = moment(date).format("MM");
        let end_today_date = moment(date).subtract(2, "month").format("MM");

        let start_yesterday_date = moment(date)
          .subtract(3, "month")
          .format("MM");
        let end_yesterday_date = moment(date).subtract(5, "month").format("MM");

        rules_today = {
          date: {
            [Op.between]: [end_today_date, start_today_date],
          },
        };

        rules_yesterday = {
          date: {
            [Op.between]: [end_yesterday_date, start_yesterday_date],
          },
        };

        name_todays =
          moment(end_today_date).locale("id").format("MMMM") +
          " s.d " +
          moment(start_today_date).locale("id").format("MMMM");

        name_yesterdays =
          moment(end_yesterday_date).locale("id").format("MMMM") +
          " s.d " +
          moment(start_yesterday_date).locale("id").format("MMMM");
      }

      let getDikmaslantasToday = await Dikmaslantas_polda_day.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("media_cetak")), "media_cetak"],
          [
            Sequelize.fn("sum", Sequelize.col("media_elektronik")),
            "media_elektronik",
          ],
          [Sequelize.fn("sum", Sequelize.col("media_sosial")), "media_sosial"],
          // [Sequelize.fn("date_trunc", "month", Sequelize.col("date")), "year"],
          [Sequelize.fn("sum", Sequelize.col("laka_langgar")), "laka_langgar"],
          [
            Sequelize.literal(
              "SUM(media_cetak + media_elektronik + media_sosial + laka_langgar)"
            ),
            "total_dikmaslantas",
          ],
        ],
        where: rules_today,
      });
      let getDikmaslantasYesterday = await Dikmaslantas_polda_day.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("media_cetak")), "media_cetak"],
          [
            Sequelize.fn("sum", Sequelize.col("media_elektronik")),
            "media_elektronik",
          ],
          [Sequelize.fn("sum", Sequelize.col("media_sosial")), "media_sosial"],
          // [Sequelize.fn("date_trunc", "month", Sequelize.col("date")), "year"],
          [Sequelize.fn("sum", Sequelize.col("laka_langgar")), "laka_langgar"],
          [
            Sequelize.literal(
              "SUM(media_cetak + media_elektronik + media_sosial + laka_langgar)"
            ),
            "total_dikmaslantas",
          ],
        ],
        where: rules_yesterday,
      });

      let getPenyebaranToday = await Penyebaran_polda_day.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("leaflet")), "leaflet"],
          [Sequelize.fn("sum", Sequelize.col("spanduk")), "spanduk"],
          [Sequelize.fn("sum", Sequelize.col("billboard")), "billboard"],
          [Sequelize.fn("sum", Sequelize.col("stiker")), "stiker"],
          [
            Sequelize.literal("SUM(leaflet + spanduk + billboard + stiker)"),
            "total_penyebaran",
          ],
        ],
        where: rules_today,
      });

      let getPenyebaranYesterday = await Penyebaran_polda_day.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("leaflet")), "leaflet"],
          [Sequelize.fn("sum", Sequelize.col("spanduk")), "spanduk"],
          [Sequelize.fn("sum", Sequelize.col("billboard")), "billboard"],
          [Sequelize.fn("sum", Sequelize.col("stiker")), "stiker"],
          [
            Sequelize.literal("SUM(leaflet + spanduk + billboard + stiker)"),
            "total_penyebaran",
          ],
        ],
        where: rules_yesterday,
      });

      let anev_dikmaslantas = [];
      for (let i = 0; i < getDikmaslantasToday.length; i++) {
        let media_sosial_today =
          parseInt(getDikmaslantasToday[i].dataValues.media_sosial) || 0;
        let media_sosial_yesterday =
          parseInt(getDikmaslantasYesterday[i].dataValues.media_sosial) || 0;

        let media_elektronik_today =
          parseInt(getDikmaslantasToday[i].dataValues.media_elektronik) || 0;
        let media_elektronik_yesterday =
          parseInt(getDikmaslantasYesterday[i].dataValues.media_elektronik) ||
          0;

        let media_cetak_today =
          parseInt(getDikmaslantasToday[i].dataValues.media_cetak) || 0;
        let media_cetak_yesterday =
          parseInt(getDikmaslantasYesterday[i].dataValues.media_cetak) || 0;

        let laka_langgar_today =
          parseInt(getDikmaslantasToday[i].dataValues.laka_langgar) || 0;
        let laka_langgar_yesterday =
          parseInt(getDikmaslantasYesterday[i].dataValues.laka_langgar) || 0;

        let total_dikmaslantas_today =
          parseInt(getDikmaslantasToday[i].dataValues.total_dikmaslantas) || 0;
        let total_dikmaslantas_yesterday =
          parseInt(getDikmaslantasYesterday[i].dataValues.total_dikmaslantas) ||
          0;

        let angka_media_cetak = media_cetak_today - media_cetak_yesterday;
        let angka_media_sosial = media_sosial_today - media_sosial_yesterday;
        let angka_media_elektronik =
          media_elektronik_today - media_elektronik_yesterday;
        let angka_laka_langgar = laka_langgar_today - laka_langgar_yesterday;
        let angka_total_dikmaslantas =
          total_dikmaslantas_today - total_dikmaslantas_yesterday;

        let persen_media_cetak = (
          (angka_media_cetak / media_cetak_yesterday) *
          100
        ).toFixed(0);
        let persen_media_elektronik = (
          (angka_media_elektronik / media_elektronik_yesterday) *
          100
        ).toFixed(0);
        let persen_media_sosial = (
          (angka_media_sosial / media_sosial_yesterday) *
          100
        ).toFixed(0);
        let persen_laka_langgar = (
          (angka_laka_langgar / laka_langgar_yesterday) *
          100
        ).toFixed(0);
        let persen_total_dikmaslantas = (
          (angka_total_dikmaslantas / total_dikmaslantas_yesterday) *
          100
        ).toFixed(0);

        let status_media_cetak = "SAMA";
        let status_media_elektronik = "SAMA";
        let status_media_sosial = "SAMA";
        let status_laka_langgar = "SAMA";
        let status_total_dikmaslantas = "SAMA";

        if (
          getDikmaslantasToday[i].dataValues.media_cetak >
          getDikmaslantasYesterday[i].dataValues.media_cetak
        ) {
          status_media_cetak = "NAIK";
        } else if (
          getDikmaslantasToday[i].dataValues.media_cetak <
          getDikmaslantasYesterday[i].dataValues.media_cetak
        ) {
          status_media_cetak = "TURUN";
        } else if (
          getDikmaslantasToday[i].dataValues.media_cetak ==
          getDikmaslantasYesterday[i].dataValues.media_cetak
        ) {
          status_media_cetak = "SAMA";
        }

        if (
          getDikmaslantasToday[i].dataValues.media_elektronik >
          getDikmaslantasYesterday[i].dataValues.media_elektronik
        ) {
          status_media_elektronik = "NAIK";
        } else if (
          getDikmaslantasToday[i].dataValues.media_elektronik <
          getDikmaslantasYesterday[i].dataValues.media_elektronik
        ) {
          status_media_elektronik = "TURUN";
        } else if (
          getDikmaslantasToday[i].dataValues.media_elektronik ==
          getDikmaslantasYesterday[i].dataValues.media_elektronik
        ) {
          status_media_elektronik = "SAMA";
        }

        if (media_cetak_today > media_cetak_yesterday) {
          status_media_cetak = "NAIK";
        } else if (media_cetak_today < media_cetak_yesterday) {
          status_media_cetak = "TURUN";
        } else if (media_cetak_today == media_cetak_yesterday) {
          status_media_cetak = "SAMA";
        }

        if (media_elektronik_today > media_elektronik_yesterday) {
          status_media_elektronik = "NAIK";
        } else if (media_elektronik_today < media_elektronik_yesterday) {
          status_media_elektronik = "TURUN";
        } else if (media_elektronik_today == media_elektronik_yesterday) {
          status_media_elektronik = "SAMA";
        }

        if (media_sosial_today > media_sosial_yesterday) {
          status_media_sosial = "NAIK";
        } else if (media_sosial_today < media_sosial_yesterday) {
          status_media_sosial = "TURUN";
        } else if (media_sosial_today == media_sosial_yesterday) {
          status_media_sosial = "SAMA";
        }

        if (laka_langgar_today > laka_langgar_yesterday) {
          status_laka_langgar = "NAIK";
        } else if (laka_langgar_today < laka_langgar_yesterday) {
          status_laka_langgar = "TURUN";
        } else if (laka_langgar_today == laka_langgar_yesterday) {
          status_laka_langgar = "SAMA";
        }

        if (total_dikmaslantas_today > total_dikmaslantas_yesterday) {
          status_total_dikmaslantas = "NAIK";
        } else if (total_dikmaslantas_today < total_dikmaslantas_yesterday) {
          status_total_dikmaslantas = "TURUN";
        } else if (total_dikmaslantas_today == total_dikmaslantas_yesterday) {
          status_total_dikmaslantas = "SAMA";
        }

        anev_dikmaslantas.push({
          today,
          yesterday,
          media_cetak_today,
          media_cetak_yesterday,
          media_sosial_today,
          media_sosial_yesterday,
          media_elektronik_today,
          media_elektronik_yesterday,
          laka_langgar_today,
          laka_langgar_yesterday,
          total_dikmaslantas_today,
          total_dikmaslantas_yesterday,
          angka_media_cetak,
          angka_media_sosial,
          angka_media_elektronik,
          angka_laka_langgar,
          angka_total_dikmaslantas,
          persen_media_cetak,
          persen_media_sosial,
          persen_total_dikmaslantas,
          persen_media_elektronik,
          persen_laka_langgar,
          status_media_cetak,
          status_media_sosial,
          status_media_elektronik,
          status_laka_langgar,
          status_total_dikmaslantas,
        });
      }

      let anev_penyebaran = [];
      for (let i = 0; i < getPenyebaranToday.length; i++) {
        let spanduk_today =
          parseInt(getPenyebaranToday[i].dataValues.spanduk) || 0;
        let spanduk_yesterday =
          parseInt(getPenyebaranYesterday[i].dataValues.spanduk) || 0;

        let stiker_today =
          parseInt(getPenyebaranToday[i].dataValues.stiker) || 0;
        let stiker_yesterday =
          parseInt(getPenyebaranYesterday[i].dataValues.stiker) || 0;

        let leaflet_today =
          parseInt(getPenyebaranToday[i].dataValues.leaflet) || 0;
        let leaflet_yesterday =
          parseInt(getPenyebaranYesterday[i].dataValues.leaflet) || 0;

        let billboard_today =
          parseInt(getPenyebaranToday[i].dataValues.billboard) || 0;
        let billboard_yesterday =
          parseInt(getPenyebaranYesterday[i].dataValues.billboard) || 0;

        let total_penyebaran_today =
          parseInt(getPenyebaranToday[i].dataValues.total_penyebaran) || 0;
        let total_penyebaran_yesterday =
          parseInt(getPenyebaranYesterday[i].dataValues.total_penyebaran) || 0;

        let angka_leaflet = leaflet_today - leaflet_yesterday;
        let angka_spanduk = spanduk_today - spanduk_yesterday;
        let angka_stiker = stiker_today - stiker_yesterday;
        let angka_billboard = billboard_today - billboard_yesterday;
        let angka_total_penyebaran =
          total_penyebaran_today - total_penyebaran_yesterday;

        let persen_leaflet = (
          (angka_leaflet / leaflet_yesterday) *
          100
        ).toFixed(0);
        let persen_stiker = ((angka_stiker / stiker_yesterday) * 100).toFixed(
          0
        );
        let persen_spanduk = (
          (angka_spanduk / spanduk_yesterday) *
          100
        ).toFixed(0);
        let persen_billboard = (
          (angka_billboard / billboard_yesterday) *
          100
        ).toFixed(0);
        let persen_total_penyebaran = (
          (angka_total_penyebaran / total_penyebaran_yesterday) *
          100
        ).toFixed(0);

        let status_leaflet = "SAMA";
        let status_stiker = "SAMA";
        let status_spanduk = "SAMA";
        let status_billboard = "SAMA";
        let status_total_penyebaran = "SAMA";

        if (
          getDikmaslantasToday[i].dataValues.leaflet >
          getDikmaslantasYesterday[i].dataValues.leaflet
        ) {
          status_leaflet = "NAIK";
        } else if (
          getDikmaslantasToday[i].dataValues.leaflet <
          getDikmaslantasYesterday[i].dataValues.leaflet
        ) {
          status_leaflet = "TURUN";
        } else if (
          getDikmaslantasToday[i].dataValues.leaflet ==
          getDikmaslantasYesterday[i].dataValues.leaflet
        ) {
          status_leaflet = "SAMA";
        }

        if (
          getDikmaslantasToday[i].dataValues.stiker >
          getDikmaslantasYesterday[i].dataValues.stiker
        ) {
          status_stiker = "NAIK";
        } else if (
          getDikmaslantasToday[i].dataValues.stiker <
          getDikmaslantasYesterday[i].dataValues.stiker
        ) {
          status_stiker = "TURUN";
        } else if (
          getDikmaslantasToday[i].dataValues.stiker ==
          getDikmaslantasYesterday[i].dataValues.stiker
        ) {
          status_stiker = "SAMA";
        }

        if (leaflet_today > leaflet_yesterday) {
          status_leaflet = "NAIK";
        } else if (leaflet_today < leaflet_yesterday) {
          status_leaflet = "TURUN";
        } else if (leaflet_today == leaflet_yesterday) {
          status_leaflet = "SAMA";
        }

        if (stiker_today > stiker_yesterday) {
          status_stiker = "NAIK";
        } else if (stiker_today < stiker_yesterday) {
          status_stiker = "TURUN";
        } else if (stiker_today == stiker_yesterday) {
          status_stiker = "SAMA";
        }

        if (spanduk_today > spanduk_yesterday) {
          status_spanduk = "NAIK";
        } else if (spanduk_today < spanduk_yesterday) {
          status_spanduk = "TURUN";
        } else if (spanduk_today == spanduk_yesterday) {
          status_spanduk = "SAMA";
        }

        if (billboard_today > billboard_yesterday) {
          status_billboard = "NAIK";
        } else if (billboard_today < billboard_yesterday) {
          status_billboard = "TURUN";
        } else if (billboard_today == billboard_yesterday) {
          status_billboard = "SAMA";
        }

        if (total_penyebaran_today > total_penyebaran_yesterday) {
          status_total_penyebaran = "NAIK";
        } else if (total_penyebaran_today < total_penyebaran_yesterday) {
          status_total_penyebaran = "TURUN";
        } else if (total_penyebaran_today == total_penyebaran_yesterday) {
          status_total_penyebaran = "SAMA";
        }

        anev_penyebaran.push({
          today,
          yesterday,
          leaflet_today,
          leaflet_yesterday,
          spanduk_today,
          spanduk_yesterday,
          stiker_today,
          stiker_yesterday,
          billboard_today,
          billboard_yesterday,
          total_penyebaran_today,
          total_penyebaran_yesterday,
          angka_leaflet,
          angka_spanduk,
          angka_stiker,
          angka_billboard,
          angka_total_penyebaran,
          persen_leaflet,
          persen_spanduk,
          persen_total_penyebaran,
          persen_stiker,
          persen_billboard,
          status_leaflet,
          status_spanduk,
          status_stiker,
          status_billboard,
          status_total_penyebaran,
        });
      }

      // let results = tempAnevKamsel(anev_dikmaslantas, anev_penyebaran);
      // const workSheet = XLSX.utils.table_to_sheet(results);
      // const workBook = XLSX.utils.book_new();
      // XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      // XLSX.writeFile(
      //   workBook,
      //   `./public/export_laphar/anev_ditkamsel_${date}.xlsx`
      // );
      // res.download(`./public/export_laphar/anev_ditkamsel_${date}.xlsx`);

      // res.send({
      //   anev_dikmaslantas,
      //   anev_penyebaran
      // })

      let browser = await puppeteer.launch();
      const [page] = await browser.pages();
      const html = await ejs.renderFile(
        path.join("./src/view/template/anev_ditkamsel.ejs"),
        {
          anev_dikmaslantas,
          anev_penyebaran,
          name_todays,
          name_yesterdays,
          full_date,
        }
      );
      await page.setContent(html);
      const pdf = await page.pdf({
        displayHeaderFooter: true,
        headerTemplate: `<div style="width: 100%; font-size: 10px; margin: 0 1cm; color: #bbb; height: 30px; text-align: center;">
          <span class="pageNumber" style="font-size: 10px;"></span>
      </div>`,
        footerTemplate: `<div style="width: 100%; font-size: 10px; margin: 0 1cm; color: #bbb; height: 30px; text-align: center;">

      </div>`,
        printBackground: true,
        format: "A4",
        landscape: false,
        margin: {
          top: "80px",
          right: "0px",
          bottom: "80px",
          left: "0px",
        },
      });

      res.contentType("application/pdf");

      // optionally:
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Laporan-Harian-Ditkamsel.pdf"
      );

      res.send(pdf);
      await browser.close();
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static get = async (req, res) => {
    try {
      const { kategori, limit } = req.query;
      let data = await Laporan_Harian.findAll({
        where: {
          kategori_laporan: kategori,
        },
        limit: limit,
        order: [["date", "DESC"]],
      });
      response(res, true, "Succeed", data);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_laka = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditgakkum = await Polda.findAll({
        group: ["polda.id", "laka_lantas.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Lakalantas_polda_day,
            required: false,
            as: "laka_lantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("meninggal_dunia")),
                "meninggal_dunia",
              ],
              [Sequelize.fn("sum", Sequelize.col("luka_berat")), "luka_berat"],
              [
                Sequelize.fn("sum", Sequelize.col("luka_ringan")),
                "luka_ringan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("kerugian_material")),
                "kerugian_material",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("insiden_kecelakaan")),
                "total_lakalantas",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];
      let rows_meninggal_dunia = [];
      let rows_luka_berat = [];
      let rows_luka_ringan = [];
      let rows_kerugian_material = [];
      let rows_jumlah_lakalantas = [];

      for (let i = 0; i < ditgakkum.length; i++) {
        let meninggal_dunia = 0;
        let luka_berat = 0;
        let luka_ringan = 0;
        let kerugian_material = 0;
        let jumlah_lakalantas = 0;

        for (let j = 0; j < ditgakkum[i].laka_lantas.length; j++) {
          meninggal_dunia += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.meninggal_dunia
          );
          luka_berat += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.luka_berat
          );
          luka_ringan += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.luka_ringan
          );
          kerugian_material += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.kerugian_material
          );
          jumlah_lakalantas += parseInt(
            ditgakkum[i].laka_lantas[j].dataValues.total_lakalantas
          );
        }

        rows_name_polda.push(ditgakkum[i].dataValues.name_polda);

        rows_meninggal_dunia.push(meninggal_dunia);
        rows_luka_berat.push(luka_berat);
        rows_luka_ringan.push(luka_ringan);
        rows_kerugian_material.push(kerugian_material);
        rows_jumlah_lakalantas.push(jumlah_lakalantas);
      }

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,

        rows_meninggal_dunia,
        rows_luka_berat,
        rows_luka_ringan,
        rows_kerugian_material,
        rows_jumlah_lakalantas,
      };

      let results = tempLaka(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_lakalantas${tgl}.xlsx`
      );
      res.download(
        `./public/export_laphar/laporan_harian_lakalantas${tgl}.xlsx`
      );
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_langgar = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditgakkum = await Polda.findAll({
        group: ["polda.id", "garlantas.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Garlantas_polda_day,
            required: false,
            as: "garlantas",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_berat")),
                "pelanggaran_berat",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_ringan")),
                "pelanggaran_ringan",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pelanggaran_sedang")),
                "pelanggaran_sedang",
              ],
              [Sequelize.fn("sum", Sequelize.col("teguran")), "teguran"],
              [
                Sequelize.literal(
                  "SUM(pelanggaran_berat + pelanggaran_ringan + pelanggaran_sedang + teguran)"
                ),
                "total_garlantas",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];
      let rows_pelanggaran_berat = [];
      let rows_pelanggaran_sedang = [];
      let rows_pelanggaran_ringan = [];
      let rows_teguran = [];
      let rows_jumlah_garlantas = [];

      for (let i = 0; i < ditgakkum.length; i++) {
        let pelanggaran_berat = 0;
        let pelanggaran_sedang = 0;
        let pelanggaran_ringan = 0;
        let teguran = 0;
        let jumlah_garlantas = 0;

        for (let j = 0; j < ditgakkum[i].garlantas.length; j++) {
          pelanggaran_berat += parseInt(
            ditgakkum[i].garlantas[j].dataValues.pelanggaran_berat
          );
          pelanggaran_sedang += parseInt(
            ditgakkum[i].garlantas[j].dataValues.pelanggaran_sedang
          );
          pelanggaran_ringan += parseInt(
            ditgakkum[i].garlantas[j].dataValues.pelanggaran_ringan
          );
          teguran += parseInt(ditgakkum[i].garlantas[j].dataValues.teguran);
          jumlah_garlantas += parseInt(
            ditgakkum[i].garlantas[j].dataValues.total_garlantas
          );
        }

        rows_name_polda.push(ditgakkum[i].dataValues.name_polda);
        rows_pelanggaran_berat.push(pelanggaran_berat);
        rows_pelanggaran_sedang.push(pelanggaran_sedang);
        rows_pelanggaran_ringan.push(pelanggaran_ringan);
        rows_teguran.push(teguran);
        rows_jumlah_garlantas.push(jumlah_garlantas);
      }

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_pelanggaran_berat,
        rows_pelanggaran_sedang,
        rows_pelanggaran_ringan,
        rows_teguran,
        rows_jumlah_garlantas,
      };
      let results = tempLanggar(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_pelanggaran${tgl}.xlsx`
      );
      res.download(
        `./public/export_laphar/laporan_harian_pelanggaran${tgl}.xlsx`
      );
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_turjagwali = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditgakkum = await Polda.findAll({
        group: ["polda.id", "turjagwali.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Turjagwali_polda_day,
            required: false,
            as: "turjagwali",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("pengaturan")), "pengaturan"],
              [Sequelize.fn("sum", Sequelize.col("penjagaan")), "penjagaan"],
              [Sequelize.fn("sum", Sequelize.col("pengawalan")), "pengawalan"],
              [Sequelize.fn("sum", Sequelize.col("patroli")), "patroli"],
              [
                Sequelize.literal(
                  "SUM(turjagwali.pengawalan + turjagwali.penjagaan + turjagwali.patroli + turjagwali.pengaturan)"
                ),
                "total_turjagwali",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];

      let rows_pengaturan = [];
      let rows_penjagaan = [];
      let rows_pengawalan = [];
      let rows_patroli = [];
      let rows_jumlah_turjagwali = [];

      for (let i = 0; i < ditgakkum.length; i++) {
        let pengaturan = 0;
        let pengawalan = 0;
        let patroli = 0;
        let penjagaan = 0;
        let jumlah_turjagwali = 0;

        for (let j = 0; j < ditgakkum[i].turjagwali.length; j++) {
          pengaturan += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.pengaturan
          );
          penjagaan += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.penjagaan
          );
          pengawalan += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.pengawalan
          );
          patroli += parseInt(ditgakkum[i].turjagwali[j].dataValues.patroli);
          jumlah_turjagwali += parseInt(
            ditgakkum[i].turjagwali[j].dataValues.total_turjagwali
          );
        }

        rows_name_polda.push(ditgakkum[i].dataValues.name_polda);

        rows_pengaturan.push(pengaturan);
        rows_penjagaan.push(penjagaan);
        rows_pengawalan.push(pengawalan);
        rows_patroli.push(patroli);
        rows_jumlah_turjagwali.push(jumlah_turjagwali);
      }

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_pengaturan,
        rows_penjagaan,
        rows_pengawalan,
        rows_patroli,
        rows_jumlah_turjagwali,
      };
      let results = tempTurjagwali(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_turjagwali${tgl}.xlsx`
      );
      res.download(
        `./public/export_laphar/laporan_harian_turjagwali${tgl}.xlsx`
      );
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_ranmor = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditregident = await Polda.findAll({
        group: ["ranmor.id", "polda.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Ranmor_polda_day,
            required: false,
            as: "ranmor",
            attributes: [
              [
                Sequelize.fn("sum", Sequelize.col("mobil_penumpang")),
                "mobil_penumpang",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mobil_barang")),
                "mobil_barang",
              ],
              [Sequelize.fn("sum", Sequelize.col("mobil_bus")), "mobil_bus"],
              [Sequelize.fn("sum", Sequelize.col("ransus")), "ransus"],
              [
                Sequelize.fn("sum", Sequelize.col("sepeda_motor")),
                "sepeda_motor",
              ],
              [
                Sequelize.literal(
                  "SUM(ranmor.mobil_penumpang + ranmor.mobil_barang + ranmor.mobil_bus + ranmor.ransus + ranmor.sepeda_motor)"
                ),
                "total_ranmor",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];

      let rows_mobil_barang = [];
      let rows_mobil_bus = [];
      let rows_mobil_penumpang = [];
      let rows_ransus = [];
      let rows_sepeda_motor = [];
      let rows_jumlah_ranmor = [];

      for (let i = 0; i < ditregident.length; i++) {
        let mobil_barang = 0;
        let mobil_bus = 0;
        let mobil_penumpang = 0;
        let ransus = 0;
        let sepeda_motor = 0;
        let jumlah_ranmor = 0;

        for (let j = 0; j < ditregident[i].ranmor.length; j++) {
          mobil_barang += parseInt(
            ditregident[i].ranmor[j].dataValues.mobil_barang
          );
          mobil_bus += parseInt(ditregident[i].ranmor[j].dataValues.mobil_bus);
          mobil_penumpang += parseInt(
            ditregident[i].ranmor[j].dataValues.mobil_penumpang
          );
          ransus += parseInt(ditregident[i].ranmor[j].dataValues.ransus);
          sepeda_motor += parseInt(
            ditregident[i].ranmor[j].dataValues.sepeda_motor
          );
          jumlah_ranmor += parseInt(
            ditregident[i].ranmor[j].dataValues.total_ranmor
          );
        }
        rows_name_polda.push(ditregident[i].dataValues.name_polda);
        rows_mobil_barang.push(mobil_barang);
        rows_mobil_penumpang.push(mobil_penumpang);
        rows_mobil_bus.push(mobil_bus);
        rows_sepeda_motor.push(sepeda_motor);
        rows_ransus.push(ransus);
        rows_jumlah_ranmor.push(jumlah_ranmor);
      }
      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_mobil_barang,
        rows_mobil_bus,
        rows_mobil_penumpang,
        rows_sepeda_motor,
        rows_ransus,
        rows_jumlah_ranmor,
      };
      let results = tempRanmor(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_ranmor${tgl}.xlsx`
      );
      res.download(`./public/export_laphar/laporan_harian_ranmor${tgl}.xlsx`);
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_sim = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditregident = await Polda.findAll({
        group: ["sim.id", "polda.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Sim_polda_day,
            required: false,
            as: "sim",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("baru_a")), "baru_a"],
              [Sequelize.fn("sum", Sequelize.col("baru_c")), "baru_c"],
              [Sequelize.fn("sum", Sequelize.col("baru_c1")), "baru_c1"],
              [Sequelize.fn("sum", Sequelize.col("baru_c2")), "baru_c2"],

              [Sequelize.fn("sum", Sequelize.col("baru_d")), "baru_d"],
              [Sequelize.fn("sum", Sequelize.col("baru_d1")), "baru_d1"],

              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_a")),
                "perpanjangan_a",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_au")),
                "perpanjangan_au",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_c")),
                "perpanjangan_c",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_c1")),
                "perpanjangan_c1",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_c2")),
                "perpanjangan_c2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_d")),
                "perpanjangan_d",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_d1")),
                "perpanjangan_d1",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_b1")),
                "perpanjangan_b1",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_b1u")),
                "perpanjangan_b1u",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_b2")),
                "perpanjangan_b2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_b2u")),
                "perpanjangan_b2u",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("peningkatan_au")),
                "peningkatan_au",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("peningkatan_b1")),
                "peningkatan_b1",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("peningkatan_b1u")),
                "peningkatan_b1u",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("peningkatan_b2")),
                "peningkatan_b2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("peningkatan_b2u")),
                "peningkatan_b2u",
              ],
              [
                Sequelize.literal(
                  "SUM(baru_a + baru_c + baru_c1 + baru_c2 + baru_d + baru_d1 + perpanjangan_a + perpanjangan_au + perpanjangan_c + perpanjangan_c1 + perpanjangan_c2 + perpanjangan_d + perpanjangan_d1 + perpanjangan_b1 + perpanjangan_b1u + perpanjangan_b2 + perpanjangan_b2u + peningkatan_au + peningkatan_b1 + peningkatan_b1u + peningkatan_b2 + peningkatan_b2u)"
                ),
                "total_sim",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];

      let rows_sim_baru = [];
      let rows_sim_perpanjangan = [];
      let rows_jumlah_sim = [];

      let rows_baru_a = [];
      let rows_baru_c = [];
      let rows_baru_c1 = [];
      let rows_baru_c2 = [];

      let rows_baru_d = [];
      let rows_baru_d1 = [];

      let rows_perpanjangan_a = [];
      let rows_perpanjangan_au = [];
      let rows_perpanjangan_c = [];
      let rows_perpanjangan_c1 = [];
      let rows_perpanjangan_c2 = [];
      let rows_perpanjangan_d = [];
      let rows_perpanjangan_d1 = [];
      let rows_perpanjangan_b1 = [];
      let rows_perpanjangan_b1u = [];
      let rows_perpanjangan_b2 = [];
      let rows_perpanjangan_b2u = [];

      let rows_peningkatan_au = [];
      let rows_peningkatan_b1 = [];
      let rows_peningkatan_b1u = [];
      let rows_peningkatan_b2 = [];
      let rows_peningkatan_b2u = [];

      for (let i = 0; i < ditregident.length; i++) {
        let sim_baru = 0;
        let sim_perpanjangan = 0;
        let jumlah_sim = 0;
        let baru_a = 0;
        let baru_c = 0;
        let baru_c1 = 0;
        let baru_c2 = 0;
        let baru_d = 0;
        let baru_d1 = 0;
        let perpanjangan_a = 0;
        let perpanjangan_au = 0;
        let perpanjangan_c = 0;
        let perpanjangan_c1 = 0;
        let perpanjangan_c2 = 0;
        let perpanjangan_d = 0;
        let perpanjangan_d1 = 0;
        let perpanjangan_b1 = 0;
        let perpanjangan_b1u = 0;
        let perpanjangan_b2 = 0;
        let perpanjangan_b2u = 0;

        let peningkatan_au = 0;
        let peningkatan_b1 = 0;
        let peningkatan_b1u = 0;
        let peningkatan_b2 = 0;
        let peningkatan_b2u = 0;

        for (let j = 0; j < ditregident[i].sim.length; j++) {
          baru_a += parseInt(ditregident[i].sim[j].baru_a);
          baru_c += parseInt(ditregident[i].sim[j].baru_c);
          baru_c1 += parseInt(ditregident[i].sim[j].baru_c1);
          baru_c2 += parseInt(ditregident[i].sim[j].baru_c2);

          baru_d += parseInt(ditregident[i].sim[j].baru_d);
          baru_d1 += parseInt(ditregident[i].sim[j].baru_d1);

          perpanjangan_a += parseInt(ditregident[i].sim[j].perpanjangan_a);
          perpanjangan_au += parseInt(ditregident[i].sim[j].perpanjangan_au);
          perpanjangan_c += parseInt(ditregident[i].sim[j].perpanjangan_c);
          perpanjangan_c1 += parseInt(ditregident[i].sim[j].perpanjangan_c1);
          perpanjangan_c2 += parseInt(ditregident[i].sim[j].perpanjangan_c2);
          perpanjangan_d += parseInt(ditregident[i].sim[j].perpanjangan_d);
          perpanjangan_d1 += parseInt(ditregident[i].sim[j].perpanjangan_d1);
          perpanjangan_b1 += parseInt(ditregident[i].sim[j].perpanjangan_b1);
          perpanjangan_b1u += parseInt(ditregident[i].sim[j].perpanjangan_b1u);
          perpanjangan_b2 += parseInt(ditregident[i].sim[j].perpanjangan_b2);
          perpanjangan_b2u += parseInt(ditregident[i].sim[j].perpanjangan_b2u);

          peningkatan_au += parseInt(ditregident[i].sim[j].peningkatan_au);
          peningkatan_b1 += parseInt(ditregident[i].sim[j].peningkatan_b1);
          peningkatan_b1u += parseInt(ditregident[i].sim[j].peningkatan_b1u);
          peningkatan_b2 += parseInt(ditregident[i].sim[j].peningkatan_b2);
          peningkatan_b2u += parseInt(ditregident[i].sim[j].peningkatan_b2u);
          jumlah_sim += parseInt(ditregident[i].sim[j].dataValues.total_sim);
        }
        rows_name_polda.push(ditregident[i].dataValues.name_polda);
        rows_sim_baru.push(sim_baru);
        rows_sim_perpanjangan.push(sim_perpanjangan);
        rows_jumlah_sim.push(jumlah_sim);

        rows_baru_a.push(baru_a);
        rows_baru_c.push(baru_c);
        rows_baru_c1.push(baru_c1);
        rows_baru_c2.push(baru_c2);

        rows_baru_d.push(baru_d);
        rows_baru_d1.push(baru_d1);

        rows_perpanjangan_a.push(perpanjangan_a);
        rows_perpanjangan_au.push(perpanjangan_au);
        rows_perpanjangan_c.push(perpanjangan_c);
        rows_perpanjangan_c1.push(perpanjangan_c1);
        rows_perpanjangan_c2.push(perpanjangan_c2);
        rows_perpanjangan_d.push(perpanjangan_d);
        rows_perpanjangan_d1.push(perpanjangan_d1);
        rows_perpanjangan_b1.push(perpanjangan_b1);
        rows_perpanjangan_b1u.push(perpanjangan_b1u);
        rows_perpanjangan_b2.push(perpanjangan_b2);
        rows_perpanjangan_b2u.push(perpanjangan_b2u);

        rows_peningkatan_au.push(peningkatan_au);
        rows_peningkatan_b1.push(peningkatan_b1);
        rows_peningkatan_b1u.push(peningkatan_b1u);
        rows_peningkatan_b2.push(peningkatan_b2);
        rows_peningkatan_b2u.push(peningkatan_b2u);
      }

      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_baru_a,
        rows_baru_c,
        rows_baru_c1,
        rows_baru_c2,

        rows_baru_d,
        rows_baru_d1,

        rows_perpanjangan_a,
        rows_perpanjangan_au,
        rows_perpanjangan_c,
        rows_perpanjangan_c1,
        rows_perpanjangan_c2,
        rows_perpanjangan_d,
        rows_perpanjangan_d1,
        rows_perpanjangan_b1,
        rows_perpanjangan_b1u,
        rows_perpanjangan_b2,
        rows_perpanjangan_b2u,

        rows_peningkatan_au,
        rows_peningkatan_b1,
        rows_peningkatan_b1u,
        rows_peningkatan_b2,
        rows_peningkatan_b2u,
        rows_jumlah_sim,
      };
      let results = tempSim(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_sim${tgl}.xlsx`
      );
      res.download(`./public/export_laphar/laporan_harian_sim${tgl}.xlsx`);
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static export_stnk = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditregident = await Polda.findAll({
        group: ["stnk.id", "polda.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Stnk_polda_day,
            required: false,
            as: "stnk",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("bbn_1_r2")), "bbn_1_r2"],
              [Sequelize.fn("sum", Sequelize.col("bbn_1_r4")), "bbn_1_r4"],
              [
                Sequelize.fn("sum", Sequelize.col("perubahan_r2")),
                "perubahan_r2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perubahan_r4")),
                "perubahan_r4",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_r2")),
                "perpanjangan_r2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perpanjangan_r4")),
                "perpanjangan_r4",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mutasi_keluar_r2")),
                "mutasi_keluar_r2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mutasi_keluar_r4")),
                "mutasi_keluar_r4",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mutasi_masuk_r2")),
                "mutasi_masuk_r2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mutasi_masuk_r4")),
                "mutasi_masuk_r4",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pengesahan_r2")),
                "pengesahan_r2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("pengesahan_r4")),
                "pengesahan_r4",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("samolnas_r2")),
                "samolnas_r2",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("samolnas_r4")),
                "samolnas_r4",
              ],
              [
                Sequelize.literal(
                  "SUM(bbn_1_r2 + bbn_1_r4 + perubahan_r2 + perubahan_r4 + perpanjangan_r2 + perpanjangan_r4 + mutasi_keluar_r2 + mutasi_keluar_r4 + mutasi_masuk_r2 + mutasi_masuk_r4 + pengesahan_r2 + pengesahan_r4 + samolnas_r2 + samolnas_r4)"
                ),
                "total_stnk",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];

      let rows_jumlah_stnk = [];
      let rows_bbn_1_r2 = [];
      let rows_bbn_1_r4 = [];

      let rows_perubahan_r2 = [];
      let rows_perubahan_r4 = [];
      let rows_perpanjangan_r2 = [];
      let rows_perpanjangan_r4 = [];
      let rows_mutasi_keluar_r2 = [];
      let rows_mutasi_keluar_r4 = [];
      let rows_mutasi_masuk_r2 = [];
      let rows_mutasi_masuk_r4 = [];
      let rows_pengesahan_r2 = [];
      let rows_pengesahan_r4 = [];
      let rows_samolnas_r2 = [];
      let rows_samolnas_r4 = [];

      for (let i = 0; i < ditregident.length; i++) {
        let bbn_1_r2 = 0;
        let bbn_1_r4 = 0;

        let perubahan_r2 = 0;
        let perubahan_r4 = 0;
        let perpanjangan_r2 = 0;
        let perpanjangan_r4 = 0;
        let mutasi_keluar_r2 = 0;
        let mutasi_keluar_r4 = 0;
        let mutasi_masuk_r2 = 0;
        let mutasi_masuk_r4 = 0;
        let pengesahan_r2 = 0;
        let pengesahan_r4 = 0;
        let samolnas_r2 = 0;
        let samolnas_r4 = 0;

        let jumlah_stnk = 0;

        for (let j = 0; j < ditregident[i].stnk.length; j++) {
          bbn_1_r2 += parseInt(ditregident[i].stnk[j].dataValues.bbn_1_r2);
          bbn_1_r4 += parseInt(ditregident[i].stnk[j].dataValues.bbn_1_r4);

          perubahan_r2 += parseInt(
            ditregident[i].stnk[j].dataValues.perubahan_r2
          );
          perubahan_r4 += parseInt(
            ditregident[i].stnk[j].dataValues.perubahan_r4
          );
          perpanjangan_r2 += parseInt(
            ditregident[i].stnk[j].dataValues.perpanjangan_r2
          );
          perpanjangan_r4 += parseInt(
            ditregident[i].stnk[j].dataValues.perpanjangan_r4
          );
          mutasi_keluar_r2 += parseInt(
            ditregident[i].stnk[j].dataValues.mutasi_keluar_r2
          );
          mutasi_keluar_r4 += parseInt(
            ditregident[i].stnk[j].dataValues.mutasi_keluar_r4
          );
          mutasi_masuk_r2 += parseInt(
            ditregident[i].stnk[j].dataValues.mutasi_masuk_r2
          );
          mutasi_masuk_r4 += parseInt(
            ditregident[i].stnk[j].dataValues.mutasi_masuk_r4
          );
          pengesahan_r2 += parseInt(
            ditregident[i].stnk[j].dataValues.pengesahan_r2
          );
          pengesahan_r4 += parseInt(
            ditregident[i].stnk[j].dataValues.pengesahan_r4
          );
          samolnas_r2 += parseInt(
            ditregident[i].stnk[j].dataValues.samolnas_r2
          );
          samolnas_r4 += parseInt(
            ditregident[i].stnk[j].dataValues.samolnas_r4
          );
          jumlah_stnk += parseInt(ditregident[i].stnk[j].dataValues.total_stnk);
        }
        rows_name_polda.push(ditregident[i].dataValues.name_polda);
        rows_jumlah_stnk.push(jumlah_stnk);
        rows_bbn_1_r2.push(bbn_1_r2);
        rows_bbn_1_r4.push(bbn_1_r4);

        rows_perubahan_r2.push(perubahan_r2);
        rows_perubahan_r4.push(perubahan_r4);
        rows_perpanjangan_r2.push(perpanjangan_r2);
        rows_perpanjangan_r4.push(perpanjangan_r4);
        rows_mutasi_keluar_r2.push(mutasi_keluar_r2);
        rows_mutasi_keluar_r4.push(mutasi_keluar_r4);
        rows_mutasi_masuk_r2.push(mutasi_masuk_r2);
        rows_mutasi_masuk_r4.push(mutasi_keluar_r4);
        rows_pengesahan_r2.push(pengesahan_r2);
        rows_pengesahan_r4.push(pengesahan_r4);
        rows_samolnas_r2.push(samolnas_r2);
        rows_samolnas_r4.push(samolnas_r4);
      }
      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_jumlah_stnk,
        rows_bbn_1_r2,
        rows_bbn_1_r4,

        rows_perubahan_r2,
        rows_perubahan_r4,
        rows_perpanjangan_r2,
        rows_perpanjangan_r4,
        rows_mutasi_keluar_r2,
        rows_mutasi_keluar_r4,
        rows_mutasi_masuk_r2,
        rows_mutasi_masuk_r4,
        rows_pengesahan_r2,
        rows_pengesahan_r4,
        rows_samolnas_r2,
        rows_samolnas_r4,
      };
      let results = tempStnk(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_stnk${tgl}.xlsx`
      );
      res.download(`./public/export_laphar/laporan_harian_stnk${tgl}.xlsx`);
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };
  static export_bpkb = async (req, res) => {
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
      } = req.query;

      let rules = [];
      let rules_polda = [];
      let tgl = "Keseluruhan";
      if (date) {
        rules.push({
          date: date,
        });
        tgl = date;
      }

      if (filter) {
        rules.push({
          date: {
            [Op.between]: [start_date, end_date],
          },
        });
        tgl = start_date + " s.d " + end_date;
      }

      if (polda_id) {
        rules.push({
          polda_id: decAes(polda_id),
        });

        rules_polda.push({
          id: decAes(polda_id),
        });
      }

      if (serverSide?.toLowerCase() === "true") {
        getDataRules.limit = length;
        getDataRules.offset = start;
      }

      let ditregident = await Polda.findAll({
        group: ["bpkb.id", "polda.id"],
        attributes: ["id", "name_polda"],
        include: [
          {
            model: Bpkb_polda_day,
            required: false,
            as: "bpkb",
            attributes: [
              [Sequelize.fn("sum", Sequelize.col("bbn_1")), "bbn_1"],
              [Sequelize.fn("sum", Sequelize.col("bbn_2")), "bbn_2"],
              [
                Sequelize.fn("sum", Sequelize.col("mutasi_masuk")),
                "mutasi_masuk",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("mutasi_keluar")),
                "mutasi_keluar",
              ],
              [
                Sequelize.fn("sum", Sequelize.col("perubahan_pergantian")),
                "perubahan_pergantian",
              ],

              [
                Sequelize.literal(
                  "SUM(bbn_1 + bbn_2 + mutasi_masuk + mutasi_keluar + perubahan_pergantian)"
                ),
                "total_bpkb",
              ],
            ],
            where: {
              [Op.and]: rules,
            },
          },
        ],
        where: {
          [Op.and]: rules_polda,
        },
      });

      let rows_name_polda = [];
      let rows_jumlah_bpkb = [];
      let rows_bbn_1 = [];
      let rows_bbn_2 = [];
      let rows_mutasi_masuk = [];
      let rows_mutasi_keluar = [];
      let rows_perubahan_pergantian = [];

      for (let i = 0; i < ditregident.length; i++) {
        let jumlah_bpkb = 0;
        let bbn_1 = 0;
        let bbn_2 = 0;
        let mutasi_masuk = 0;
        let mutasi_keluar = 0;
        let perubahan_pergantian = 0;

        for (let j = 0; j < ditregident[i].bpkb.length; j++) {
          bbn_1 += parseInt(ditregident[i].bpkb[j].dataValues.bbn_1);
          bbn_2 += parseInt(ditregident[i].bpkb[j].dataValues.bbn_2);
          mutasi_masuk += parseInt(
            ditregident[i].bpkb[j].dataValues.mutasi_masuk
          );
          mutasi_keluar += parseInt(
            ditregident[i].bpkb[j].dataValues.mutasi_keluar
          );
          perubahan_pergantian += parseInt(
            ditregident[i].bpkb[j].dataValues.perubahan_pergantian
          );
          jumlah_bpkb += parseInt(ditregident[i].bpkb[j].dataValues.total_bpkb);
        }
        rows_name_polda.push(ditregident[i].dataValues.name_polda);
        rows_jumlah_bpkb.push(jumlah_bpkb);
        rows_bbn_1.push(bbn_1);
        rows_bbn_2.push(bbn_2);
        rows_mutasi_masuk.push(mutasi_masuk);
        rows_mutasi_keluar.push(mutasi_keluar);
        rows_perubahan_pergantian.push(perubahan_pergantian);
      }
      if (topPolda) {
        rows.sort((a, b) => b.total - a.total);
        rows = rows.slice(0, 10);
      }
      let rows = {
        rows_name_polda,
        rows_jumlah_bpkb,
        rows_bbn_1,
        rows_bbn_2,
        rows_mutasi_masuk,
        rows_mutasi_keluar,
        rows_perubahan_pergantian,
      };

      console.log(rows);
      let results = tempBpkb(rows, tgl);
      const workSheet = XLSX.utils.table_to_sheet(results);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
      XLSX.writeFile(
        workBook,
        `./public/export_laphar/laporan_harian_bpkb${tgl}.xlsx`
      );
      res.download(`./public/export_laphar/laporan_harian_bpkb${tgl}.xlsx`);
      // response(res, true, "Succeed", ditkamsel);
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };
};
