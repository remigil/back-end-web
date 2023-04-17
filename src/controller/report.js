const { AESDecrypt, AESEncrypt } = require("../lib/encryption");
const response = require("../lib/response");
const PanicButton = require("../model/report");
const db = require("../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const pagination = require("../lib/pagination-parser");
const moment = require("moment");
const prefix = require("../middleware/prefix");
const codeReport = require("../middleware/codeReport");
// const Officer = require("../model/officer");
// const Panic_button = require("../model/report");
const Account = require("../model/account");
const NotifikasiController = require("./notification");
const notifHandler = require("../middleware/notifHandler");
const TokenTrackNotif = require("../model/token_track_notif");
const { TrackG20 } = require("../model/tracking/g20");
const { Client } = require("@googlemaps/google-maps-services-js");
const sharp = require("sharp");
const googleMapClient = new Client();
const fieldData = {
  code: null,
  type: null,
  foto: null,
  subject: null,
  categori: null,
  status: null,
  coordinate: null,
  description: null,
  officer_id: null,
};
const getCodeReport = async ({ monthYear, type }) => {
  let [getCode] =
    await db.query(`select count(to_char(created_at, 'MMYY')) as count  from report r
    where to_char(created_at, 'MMYY')='${monthYear}' AND type='${type}'
    group by to_char(created_at, 'MMYY')`);
  return getCode.length ? prefix(getCode[0].count) : prefix(1);
};
module.exports = class ReportController {
  static get = async (req, res) => {
    try {
      const {
        length = 10,
        start = 0,
        serverSide = null,
        search = null,
        filter = [],
        filterSearch = [],
        order = null,
        orderDirection = "asc",
      } = req.query;
      const modelAttr = Object.keys(PanicButton.getAttributes());
      let getData = { where: null };
      if (serverSide?.toLowerCase() === "true") {
        const resPage = pagination.getPagination(length, start);
        getData.limit = resPage.limit;
        getData.offset = resPage.offset;
      }
      // getDataRules.order = [[modelAttr[order], orderDirection.toUpperCase()]];
      getData.order = [
        [
          order != null ? order : "id",
          orderDirection != null ? orderDirection : "desc",
        ],
      ];
      if (search != null) {
        let whereBuilder = [];
        modelAttr.forEach((key) => {
          whereBuilder.push(
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.cast(Sequelize.col(key), "varchar")
              ),
              {
                [Op.like]: `%${search.toLowerCase()}%`,
              }
            )
          );
        });
        getData.where = {
          [Op.or]: whereBuilder,
        };
      }
      if (
        filter != null &&
        filter.length > 0 &&
        filterSearch != null &&
        filterSearch.length > 0
      ) {
        const filters = [];
        filter.forEach((fKey, index) => {
          if (_.includes(modelAttr, fKey)) {
            filters[fKey] = filterSearch[index];
          }
        });
        getData.where = {
          ...getData.where,
          ...filters,
        };
      }
      getData.include = [
        {
          model: Officer,
          required: false,
        },
        {
          model: Account,
          required: false,
        },
      ];
      const data = await PanicButton.findAll(getData);
      const count = await PanicButton.count({
        where: getData?.where,
      });

      response(res, true, "Succeed", {
        data: data.map((ee) => ({
          ...ee.dataValues,
          id: AESEncrypt(String(ee.dataValues.id), {
            isSafeUrl: true,
          }),
          categori: codeReport(
            ee.dataValues.categori != null ? ee.dataValues.categori : "999",
            "type"
          ),
        })),
        // data: data,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (e) {
      console.log(e);
      response(res, false, "Failed", e.message);
    }
  };
  static laporanToday = async (req, res) => {
    try {
      const [data] = await db.query(
        `SELECT r.*, a.name_account, o.name_officer FROM report r 
        
        INNER JOIN trx_account_officer tao ON r.officer_id=tao.officer_id
        INNER JOIN officer o ON r.officer_id=o.id
        LEFT JOIN account a ON a.id=tao.account_id
        WHERE to_char(r.created_at, 'YYYY-MM-DD')='${moment().format(
          "YYYY-MM-DD"
        )}' AND r.deleted_at is null AND a.deleted_at is null ORDER BY updated_at DESC`
      );
      response(res, true, "Succeed", {
        data,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static getLaporanById = async (req, res) => {
    try {
      // const [data] = await db.query(
      //   `SELECT r.*, a.name_account, o.name_officer, o.phone_officer FROM report r

      //   INNER JOIN trx_account_officer tao ON r.officer_id=tao.officer_id
      //   INNER JOIN officer o ON r.officer_id=o.id
      //   INNER JOIN account a ON a.id=tao.account_id
      //   WHERE r.id=${AESDecrypt(req.params.id, {
      //     isSafeUrl: true,
      //     parseMode: "string",
      //   })} AND r.deleted_at is null AND a.deleted_at is null ORDER BY updated_at DESC`
      // );
      // response(res, true, "Succeed", data);

      let getData = { where: null };
      getData.include = [
        {
          model: Officer,
        },
        {
          model: Account,
          required: false,
        },
      ];
      getData.where = {
        id: AESDecrypt(req.params.id, {
          isSafeUrl: true,
          parseMode: "string",
        }),
      };
      const data = await PanicButton.findOne(getData);
      const ini = [
        {
          id: data.id,
          code: data.code,
          type: data.type,
          foto: data.foto,
          categori: codeReport(
            data.categori != null ? data.categori : "999",
            "type"
          ),
          categoriId: data.categori,
          // categori_name: codeReport(data.categori, "type"),
          status: data.status,
          officer_id: data.officer_id,
          name_officer: data.officer.name_officer,
          phone_officer: data.officer.phone_officer,
          coordinate: data.coordinate,
          description: data.description,
          created_at: data.created_at,
          updated_at: data.updated_at,
          deleted_at: data.deleted_at,
          officer: data.officer,
          accounts: data.accounts,
        },
      ];
      response(res, true, "Succeed", ini);
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static riwayat = async (req, res) => {
    try {
      let { limit, page } = req.query;
      page = page ? parseInt(page) : 1;
      const resPage = pagination.getPagination(limit, page);
      const riwayat = await Panic_button.findAndCountAll({
        include: [
          {
            model: Officer,
          },
          {
            model: Account,
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        raw: true,
        nest: true,
        limit: resPage.limit,
        offset: resPage.offset,
      });
      response(res, true, "Succeed", {
        limit,
        page,
        total: riwayat.count,
        total_page: Math.ceil(
          parseInt(riwayat.count) / parseInt(resPage.limit)
        ),
        ...riwayat,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static getId = async (req, res) => {
    try {
      const data = await PanicButton.findOne({
        where: {
          id: AESDecrypt(req.params.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
      });
      response(res, true, "Succeed", {
        data,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static add = async (req, res) => {
    const transaction = await db.transaction();

    try {
      let fieldValueData = {};

      for (const key of Object.keys(fieldData)) {
        // console.log({ key });
        if (req.body[key]) {
          if (key == "foto") {
            let path = req.body.foto.filepath;
            let file = req.body.foto;
            let fileName = file.originalFilename;
            let fileName0 = file.originalFilename.split(".");
            let fileName1 = fileName0[0];
            let fileName2 = fileName0[fileName0.length - 1];

            fs.renameSync(
              path,
              "./public/uploads/laporan/" + fileName,
              function (err) {
                if (err) throw err;
              }
            );
            let fileNameExist =
              AESEncrypt(fileName1, {
                isSafeUrl: true,
              }) +
              "." +
              fileName2;
            await sharp("./public/uploads/laporan/" + fileName)
              .jpeg({ quality: 50 })
              .toFile("./public/uploads/laporan/" + fileNameExist);

            fieldValueData[key] = fileNameExist;
          } else if (key == "coordinate") {
            let latlonData = JSON.parse(req.body[key]);

            if (latlonData.latitude == "" || latlonData.longitude == "") {
              let aa = await TrackG20.findOne({
                nrp_user: req.auth.nrp_user,
              })
                .sort({ updated_at: -1 })
                .limit(1);
              latlonData = {
                latitude: parseFloat(aa.latitude),
                longitude: parseFloat(aa.longitude),
              };
            }

            fieldValueData[key] = latlonData;
          } else {
            fieldValueData[key] = req.body[key];
          }
        } else {
          fieldValueData[key] = null;
        }
      }
      fieldValueData["officer_id"] = AESDecrypt(req.auth.officer, {
        isSafeUrl: true,
        parseMode: "string",
      });
      fieldValueData["type"] = "LAP";
      let kode = await getCodeReport({
        monthYear: moment().format("MMYY"),
        type: "LAP",
      });
      let typeCode = codeReport(req.body.categori);
      let id_officer = AESDecrypt(req.auth.officer, {
        isSafeUrl: true,
        parseMode: "string",
      });
      let officerGetPolres = await Officer.findOne({
        where: {
          id: id_officer,
        },
      });
      let getCode = `LAP/${moment().format("MMYY")}/${kode}/P/${typeCode}/${
        officerGetPolres?.nrp_officer
      }`;
      fieldValueData["code"] = getCode;
      let op = await PanicButton.create(fieldValueData, {
        transaction: transaction,
      });
      await transaction.commit();

      googleMapClient
        .reverseGeocode({
          params: {
            key: process.env.GOOGLE_MAPS_API_KEY,
            latlng: {
              latitude: fieldValueData["coordinate"].latitude,
              longitude: fieldValueData["coordinate"].longitude,
            },
            result_type: [
              "administrative_area_level_1",
              "administrative_area_level_2",
              "administrative_area_level_3",
              "administrative_area_level_4",
              "administrative_area_level_5",
              "administrative_area_level_6",
              "administrative_area_level_7",
            ],
          },
        })
        .then(async (resGeocode) => {
          const compondeCode = resGeocode.data.plus_code.compound_code;
          TokenTrackNotif.findAll({
            where: {
              token_fcm: {
                [Op.ne]: null,
              },
            },
            limit: 10,
          })
            .then(async (token_fcm) => {
              await PanicButton.update(
                {
                  address: compondeCode,
                },
                {
                  where: {
                    id: AESDecrypt(op.id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                }
              );

              let officer_id = token_fcm.map((officer) => officer.nrp_user);

              let getIdOfficer = await Officer.findAll({
                where: {
                  nrp_officer: {
                    [Op.in]: officer_id,
                  },
                },
              });
              getIdOfficer = getIdOfficer.map((officer) => {
                return AESDecrypt(officer.id, {
                  isSafeUrl: true,
                  parseMode: "string",
                });
              });
              token_fcm = token_fcm.map((token) => token.token_fcm);
              NotifikasiController.addGlobal({
                deepLink: notifHandler.mobile.laporan + op.id,
                type: "laporan",
                title: compondeCode,
                description: req.body.description,
                officer_id: getIdOfficer,
                mobile: notifHandler.mobile.laporan + op.id,
                web: notifHandler.mobile.laporan + op.id,
                to: token_fcm,
              })
                .then((succ) => {
                  console.log({ succ });
                })
                .catch((err) => {
                  console.log({ err });
                });
            })
            .catch(() => {});
        });

      response(res, true, "Succeed", op);
    } catch (e) {
      // await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static edit = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValueData = {};
      Object.keys(fieldData).forEach((key) => {
        if (req.body[key]) {
          if (key == "photo_officer") {
            let path = req.body.photo_officer.filepath;
            let file = req.body.photo_officer;
            let fileName = file.originalFilename;
            fs.renameSync(
              path,
              "./public/uploads/officer/" + fileName,
              function (err) {
                if (err) throw err;
              }
            );
            fieldValueData[key] = fileName;
          } else {
            fieldValueData[key] = req.body[key];
          }
        } else {
          fieldValueData[key] = null;
        }
      });

      await PanicButton.update(fieldValueData, {
        where: {
          id: AESDecrypt(req.params.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", null);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  static delete = async (req, res) => {
    const transaction = await db.transaction();
    try {
      await PanicButton.destroy({
        where: {
          id: AESDecrypt(req.body.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", null);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
};
