const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const Officer = require("../model/officer");
const db = require("../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const formidable = require("formidable");
const Account = require("../model/account");
const Vehicle = require("../model/vehicle");
const { Client } = require("@googlemaps/google-maps-services-js");
const pagination = require("../lib/pagination-parser");
const bcrypt = require("bcrypt");
const googleMapClient = new Client();
const Polda = require("../model/polda");
const Polres = require("../model/polres");

const fieldData = {
  name_officer: null,
  photo_officer: null,
  nrp_officer: null,
  rank_officer: null,
  structural_officer: null,
  pam_officer: null,
  phone_officer: null,
  status_officer: null,
  polda_id: null,
  polres_id: null,
  replacementNrp_officer: null,
};
module.exports = class OfficerController {
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
      const modelAttr = Object.keys(Officer.getAttributes());
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
          orderDirection != null ? orderDirection : "asc",
        ],
      ];
      if (search != null) {
        let whereBuilder = [];
        modelAttr.forEach((key) => {
          if (
            key != "id" &&
            key != "created_at" &&
            key != "updated_at" &&
            key != "deleted_at"
          ) {
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
          }
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
      const data = await Officer.findAll({
        ...getData,
        include: [
          {
            model: Polda,
            as: "polda",
            required: false,
            // include: [
            //   {
            //     model: Polres,
            //     required: false,
            //   },
            // ],
          },
        ],
      });
      const count = await Officer.count({
        where: getData?.where,
      });
      response(res, true, "Succeed", {
        data,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static getId = async (req, res) => {
    try {
      const data = await Officer.findOne({
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
  static getUserTrack = async (req, res) => {
    try {
      const { officer_id, team_id, lat, lon } = req.query;
      const account = await Account.findOne({
        where: {
          id: team_id,
        },
        include: [
          {
            model: Officer,
            as: "officers",
            required: true,
            where: {
              id: officer_id,
            },
          },
          {
            model: Vehicle,
            as: "vehicle",
          },
          {
            model: Officer,
            // as: "leader",
            foreignKey: "leader_team",
            required: false,
          },
        ],
      });
      const [vip_renpam] = await db.query(`SELECT
        v.name_vip,
        v.country_arrival_vip,
        v.position_vip,
         v.id as id_vip
          FROM renpam r
          INNER JOIN renpam_account ra ON ra.renpam_id=r.id

      LEFT JOIN schedule s ON s.id=r.schedule_id
        INNER JOIN renpam_vip rv ON rv.renpam_id=r.id
        INNER JOIN vip v ON v.id=rv.vip_id

          WHERE 1=1
          AND ra.account_id=${team_id}

        GROUP BY v.id`);
      const address = await googleMapClient.reverseGeocode({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          latlng: {
            latitude: lat,
            longitude: lon,
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
      });

      response(res, true, "Succeed", {
        ...account.dataValues,
        leader_team: account.dataValues.officer?.name_officer,
        phone_leader: account.dataValues.officer?.phone_officer,
        vip: vip_renpam,
        lokasi: address.data.results[0].formatted_address,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static add = async (req, res) => {
    const transaction = await db.transaction();
    var photo_officer = "";
    try {
      const data = Officer.findOne({
        where: {
          nrp_officer: req.body.nrp_officer,
        },
      })
        .then(async (ress) => {
          if (ress) {
            return response(res, false, "Failed", "NRP Sudah Di Gunakan");
          } else {
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
                } else if (key == "polda_id" || key == "polres_id") {
                  fieldValueData[key] = AESDecrypt(req.body[key], {
                    isSafeUrl: true,
                    parseMode: "string",
                  });
                } else {
                  fieldValueData[key] = req.body[key];
                }
              } else {
                fieldValueData[key] = null;
              }
            });

            let op = await Officer.create(fieldValueData, {
              transaction: transaction,
            });
            await transaction.commit();
            response(res, true, "Succeed", op);
          }
        })
        .catch((err) => {
          console.log({ err });
        });
    } catch (e) {
      await transaction.rollback();
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
          } else if (key == "polda_id" || key == "polres_id") {
            fieldValueData[key] = AESDecrypt(req.body[key], {
              isSafeUrl: true,
              parseMode: "string",
            });
          } else {
            fieldValueData[key] = req.body[key];
          }
        } else {
          fieldValueData[key] = null;
        }
      });

      await Officer.update(
        fieldValueData,
        {
          where: {
            id: AESDecrypt(req.params.id, {
              isSafeUrl: true,
              parseMode: "string",
            }),
          },
          // transaction: transaction,
        },
        {
          transaction,
        }
      );
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
      await Officer.destroy({
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
  static updatePassword = async (req, res) => {
    try {
      const { nrp_user } = req.auth;
      const { password, verif_password } = req.body;

      if (password != verif_password) {
        response(
          res,
          false,
          "Failed",
          {
            update_password: false,
            message: "Password dan Verifikasi password tidak sesuai",
          },
          400
        );
      }
      const getDataOfficer = await Officer.findOne({
        where: {
          nrp_officer: nrp_user,
        },
      });
      if (!getDataOfficer) {
        response(res, false, "Data Tidak Ditemukan", null, 404);
      }
      await Officer.update(
        {
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        },
        {
          where: {
            nrp_officer: nrp_user,
          },
        }
      );

      response(res, true, "Berhasil", null, 200);
    } catch (error) {
      response(res, false, e.message, error);
    }
  };
};
