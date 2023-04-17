const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const ReportLogin = require("../model/reportLogin");
const db = require("../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const formidable = require("formidable");
const { Client } = require("@googlemaps/google-maps-services-js");
const pagination = require("../lib/pagination-parser");
const moment = require("moment");
const { TrackG20 } = require("../model/tracking/g20");
// const Officer = require("../model/officer");
const TokenTrackController = require("./token_track_notif");
const TokenTrackNotif = require("../model/token_track_notif");
const HistoryLogout = require("../model/history_logout");

const fieldData = {
  nrp_user: null,
  login_time: null,
  logout_time: null,
};
const dateParse = (date) => {
  const aaa = moment.tz(date, "Etc/GMT-5");
  return aaa.format("YYYY-MM-DD");
};
module.exports = class ReportLoginController {
  static login = async (req, res) => {
    const transaction = await db.transaction();
    try {
      const { nrp_user } = req.body;
      let op = await ReportLogin.create(
        {
          nrp_user,
          login_time: moment(),
        },
        {
          transaction: transaction,
        }
      );
      let getIdOfficer = await Officer.findOne({
        where: {
          nrp_officer: nrp_user,
        },
      });
      console.log(
        `login data --- for id officer: ${AESDecrypt(getIdOfficer.id, {
          isSafeUrl: true,
          parseMode: "string",
        })}`
      );
      await HistoryLogout.destroy({
        where: {
          officer_id: AESDecrypt(getIdOfficer.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
      });
      const getDeviceId = await TokenTrackNotif.findOne({
        where: {
          nrp_user,
        },
      });
      await Officer.update(
        {
          status_login: 1,
          deviceId: getDeviceId.device_user,
        },
        {
          where: {
            nrp_officer: nrp_user,
          },
        }
      );
      await transaction.commit();
      response(res, true, "Succeed", op);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  static logout = async (req, res) => {
    try {
      const { nrp_user } = req.body;
      let op = await ReportLogin.update(
        {
          nrp_user,
          logout_time: moment(),
        },
        {
          where: {
            nrp_user,
            logout_time: null,
          },
        }
      );

      const getTrack = await TrackG20.findOne(
        {
          nrp_user,
        },
        null,
        {
          sort: {
            created_at: -1,
          },
        }
      );
      let update = await TrackG20.updateOne(
        {
          nrp_user,
          _id: getTrack.id,
        },
        {
          status_login: 0,
        }
      );

      await Officer.update(
        {
          status_login: 0,
        },
        {
          where: {
            nrp_officer: nrp_user,
          },
        }
      );
      console.log(`logout data --- for id officer: ${getTrack.id_officer}`);
      const checkHistory = await HistoryLogout.findAll({
        where: {
          officer_id: getTrack.id_officer,
          date: getTrack.dateOnly,
        },
      });
      if (!checkHistory.length) {
        await HistoryLogout.create({
          officer_id: getTrack.id_officer,
          date: getTrack.dateOnly,
        });
      }

      response(res, true, "Succeed", update);
    } catch (e) {
      console.log({ e: e.message });
      response(res, false, "Failed", e.message);
    }
  };
  static logoutCreateHistori = async (req, res) => {
    try {
      const { nrp_user } = req.body;
      const getTrack = await TrackG20.findOne(
        {
          nrp_user,
          dateOnly: dateParse(moment()),
        },
        null,
        {
          sort: {
            created_at: -1,
          },
        }
      );
      const checkData = await HistoryLogout.findAll({
        where: {
          officer_id: getTrack.id_officer,
          date: getTrack.dateOnly,
        },
      });
      if (!checkData.length) {
        await HistoryLogout.create({
          officer_id: getTrack.id_officer,
          date: getTrack.dateOnly,
        });
      }

      response(res, true, "Succeed", null);
    } catch (error) {
      response(res, false, error.message, error, 400);
    }
  };
  static loginDeleteHistori = async (req, res) => {
    try {
      const { nrp_user } = req.body;
      let getIdOfficer = await Officer.findOne({
        where: {
          nrp_officer: nrp_user,
        },
      });
      await HistoryLogout.destroy({
        where: {
          officer_id: AESDecrypt(getIdOfficer.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
      });
      response(res, true, "Succeed", null);
    } catch (error) {
      response(res, false, error.message, error, 400);
    }
  };
  static historyLogout = async (req, res) => {
    try {
      response(
        res,
        true,
        "Berhasil",
        await HistoryLogout.findAll({
          where: {
            date: dateParse(moment()),
          },
        }),
        200
      );
    } catch (error) {
      response(res, false, error.message, error, 400);
    }
  };
  static add = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValueData = {};
      Object.keys(fieldData).forEach((key) => {
        if (req.body[key]) {
          if (key == "login_time" || key == "logout_time") {
            fieldValueData[key] = moment().format("YYYY-MM-DD HH:MM:SS Z");
          } else {
            fieldValueData[key] = req.body[key];
          }
        } else {
          fieldValueData[key] = null;
        }
      });

      let op = await ReportLogin.create(fieldValueData, {
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", op);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static edit = async (req, res) => {
    const transaction = await db.transaction();
    try {
      const { id } = req.params;

      const getReport = await ReportLogin.findOne({
        where: {
          nrp_user: id,
          logout_time: null,
        },
        order: [["login_time", "desc"]],
      });
      await ReportLogin.update(
        {
          logout_time: new Date(),
        },
        {
          where: {
            id: getReport.id,
          },
          transaction: transaction,
        }
      );
      await transaction.commit();

      response(res, true, "Succeed", null);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
};
