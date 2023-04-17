const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const Notifikasi = require("../model/notifikasi");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const db = require("../config/database");
const pagination = require("../lib/pagination-parser");
const notifHandler = require("../middleware/notifHandler");
const { default: axios } = require("axios");
const TokenTrackNotif = require("../model/token_track_notif");

const User = require("../model/user");
const moment = require("moment");
// const Officer = require("../model/officer");
const fieldData = Object.keys(Notifikasi.getAttributes());
module.exports = class NotifikasiController {
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
      const modelAttr = Object.keys(Notifikasi.getAttributes());
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
      const data = await Notifikasi.findAll(getData);
      const count = await Notifikasi.count({
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
  static zoomSend = async (req, res) => {
    try {
      const { officer_id, link } = req.body;
      await Notifikasi.create({
        title: "Zoom Meet K3I G20 Korlantas",
        description: "Berikut Link Zoom",
        mobile: link,
        type: "zoom",
        is_read: 0,
        officer_id: AESDecrypt(officer_id, {
          isSafeUrl: true,
          parseMode: "string",
        }),
      });
      const getNrpOfficer = await Officer.findOne({
        where: {
          id: AESDecrypt(officer_id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
      });
      const getTokenFirebase = await TokenTrackNotif.findOne({
        where: {
          nrp_user: getNrpOfficer.nrp_officer,
        },
      });
      axios({
        url: "https://fcm.googleapis.com/fcm/send",
        method: "POST",
        headers: {
          Authorization:
            "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
          "Content-Type": "application/json",
        },
        data: {
          registration_ids: [getTokenFirebase.token_fcm],
          notification: {
            body: "Zoom Meet K3I G20 Korlantas",
            title: "Zoom Meet K3I G20 Korlantas",
          },
          data: {
            deepLink: link,
            webLink: link,
          },
        },
      })
        .then((e) => {
          console.log({ data: e.data });
          response(res, true, "Success", e.data);
        })
        .catch((e) => {
          console.log({ e });
          response(res, false, "Failed", e);
        });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static zoomSendNoEncrypt = async (req, res) => {
    try {
      const { officer_id, link } = req.body;
      await Notifikasi.create({
        title: "Zoom Meet K3I G20 Korlantas",
        description: "Berikut Link Zoom",
        mobile: link,
        type: "zoom",
        is_read: 0,
        officer_id: officer_id,
      });
      const getNrpOfficer = await Officer.findOne({
        where: {
          id: officer_id,
        },
      });
      const getTokenFirebase = await TokenTrackNotif.findOne({
        where: {
          nrp_user: getNrpOfficer.nrp_officer,
        },
      });
      axios({
        url: "https://fcm.googleapis.com/fcm/send",
        method: "POST",
        headers: {
          Authorization:
            "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
          "Content-Type": "application/json",
        },
        data: {
          registration_ids: [getTokenFirebase.token_fcm],
          notification: {
            body: "Zoom Meet K3I G20 Korlantas",
            title: "Zoom Meet K3I G20 Korlantas",
          },
          data: {
            deepLink: link,
            webLink: link,
          },
        },
      })
        .then((e) => {
          console.log({ data: e.data });
          response(res, true, "Success", e.data);
        })
        .catch((e) => {
          console.log({ e });
          response(res, false, "Failed", e);
        });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static countNotifikasi = async (req, res) => {
    try {
      const count = await Notifikasi.count({
        where: {
          is_read: 0,
        },
      });
      response(res, true, "Succeed", {
        total_data: count,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static getMobile = async (req, res) => {
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
      const modelAttr = Object.keys(Notifikasi.getAttributes());
      let getData = { where: null };
      // if (serverSide?.toLowerCase() === "true") {
      //   const resPage = pagination.getPagination(length, start);
      //   getData.limit = resPage.limit;
      //   getData.offset = resPage.offset;
      // }
      let { limit, page } = req.query;
      page = page ? parseInt(page) : 1;
      const resPage = pagination.getPagination(limit, page);
      getData.limit = resPage.limit;
      getData.offset = resPage.offset;
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
      const filters = [];
      if (
        filter != null &&
        filter.length > 0 &&
        filterSearch != null &&
        filterSearch.length > 0
      ) {
        filter.forEach((fKey, index) => {
          if (_.includes(modelAttr, fKey)) {
            if (fKey == "created_at") {
              filters[fKey] = {
                [Op.between]: [
                  moment(filterSearch[index]).startOf("day"),
                  moment(filterSearch[index]).endOf("day"),
                ],
              };
            } else {
              filters[fKey] = filterSearch[index];
            }
          }
        });
      }
      filters["officer_id"] = AESDecrypt(req.auth.officer, {
        isSafeUrl: true,
        parseMode: "string",
      });
      getData.where = {
        ...getData.where,
        ...filters,
      };
      // console.log({ getData });
      const data = await Notifikasi.findAndCountAll(getData);

      response(res, true, "Succeed", {
        page,
        limit,
        total: data.count,
        total_page: Math.ceil(parseInt(data.count) / parseInt(resPage.limit)),
        ...data,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static addGlobal = async (
    data = {
      deepLink,
      type,
      title,
      description,
      officer_id,
      mobile,
      web,
      to,
    }
  ) => {
    const transaction = await db.transaction();
    try {
      let mapNotif = data.officer_id?.map((officer_id) => ({
        type: data.type,
        title: data.title,
        description: data.description,
        officer_id: officer_id,
        mobile: data.mobile,
        web: data.web,
      }));
      await axios({
        url: "https://fcm.googleapis.com/fcm/send",
        method: "POST",
        headers: {
          Authorization:
            "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
          "Content-Type": "application/json",
        },
        data: {
          registration_ids: data.to,
          notification: {
            body: data.description,
            title: data.title,
          },
          data: {
            deepLink: data.mobile,
            webLink: data.web,
          },
        },
      });

      const creteNotif = await Notifikasi.bulkCreate(mapNotif, {
        transaction,
      });
      await transaction.commit();
      return {
        // notif: dataProcess.data,
        notifDatabase: [],
      };
    } catch (e) {
      console.log({ e });
      await transaction.rollback();
      return e;
      //   response(res, false, "Failed", e.message);
    }
  };

  static addGlobalOnWeb = async (req, res) => {
    const transaction = await db.transaction();
    try {
      User.findAll({
        where: {
          token_notif: {
            [Op.ne]: null,
          },
        },
        limit: 10,
      })
        .then(async (ress) => {
          // console.log({ succ });
          for (let i = 0; i < ress.length; i++) {
            await axios({
              url: "https://fcm.googleapis.com/fcm/send",
              method: "POST",
              headers: {
                Authorization:
                  "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
                "Content-Type": "application/json",
              },
              data: {
                to: ress[i]["token_notif"],
                notification: {
                  body: req.body?.description,
                  title: req.body?.title,
                  click_action:
                    notifHandler.web.panic_button + req.body.id_panic_button,
                },
                data: {
                  deepLink:
                    notifHandler.mobile.panic_button +
                    req.body?.id_panic_button,
                  webLink:
                    notifHandler.web.panic_button + req.body?.id_panic_button,
                },
              },
            });
          }

          return response(res, true, "Succeed", null);
        })
        .catch((err) => {
          console.log({ err });
        });
    } catch (e) {
      console.log({ e });
      await transaction.rollback();
      return e;
      //   response(res, false, "Failed", e.message);
    }
  };

  static addSingleOnWeb = async (req, res) => {
    const transaction = await db.transaction();
    try {
      if (req.body.type == "panic_button") {
        await axios({
          url: "https://fcm.googleapis.com/fcm/send",
          method: "POST",
          headers: {
            Authorization:
              "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
            "Content-Type": "application/json",
          },
          data: {
            to: req.body.to,
            notification: {
              body: req.body.description,
              title: req.body.title,
              click_action:
                notifHandler.web.panic_button + req.body.id_panic_button,
            },
            data: {
              deepLink:
                notifHandler.mobile.panic_button + req.body.id_panic_button,
              webLink: notifHandler.web.panic_button + req.body.id_panic_button,
            },
          },
        });
      } else if (req.body.type == "laporan") {
        await axios({
          url: "https://fcm.googleapis.com/fcm/send",
          method: "POST",
          headers: {
            Authorization:
              "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
            "Content-Type": "application/json",
          },
          data: {
            to: req.body.to,
            notification: {
              body: req.body.description,
              title: req.body.title,
              click_action:
                notifHandler.web.panic_button + req.body.id_panic_button,
            },
            data: {
              deepLink:
                notifHandler.mobile.panic_button + req.body.id_panic_button,
              webLink: notifHandler.web.panic_button + req.body.id_panic_button,
            },
          },
        });
      }

      return response(res, true, "Succeed", null);
    } catch (e) {
      console.log({ e });
      await transaction.rollback();
      return e;
      //   response(res, false, "Failed", e.message);
    }
  };

  static singleGlobal = async (
    data = {
      deepLink,
      type,
      title,
      description,
      officer_id,
      mobile,
      web,
      to,
    }
  ) => {
    const transaction = await db.transaction();
    try {
      //   "eldsqKJHTFeHj1oW0byUtg:APA91bHq0vnBdPOICdAwFEupkQPHWgCJxjZnTCDxBdB-vOKdRGI86Pdat7G9CiEDIaUZslQqgpmUmhB5fSrUSAcDBt55muH_x_9uKox46AfS1xzFOd6WSo9JrezwxlaM78rLmVL2N_TZ"
      await axios({
        url: "https://fcm.googleapis.com/fcm/send",
        method: "POST",
        headers: {
          Authorization:
            "key=AAAAbpmRKpI:APA91bFQeeeQOxnL211jLnBoHzbOp0WcVJvOT3eu98U5DL11d7EJl83eBAks5VH3Om3zwgCOR1dVD2xyT4oUHdMYA4Yf64sSE4pubJejWM-nQA227CpfJeWHjp8IS8Fx9qUyxdVRH7_K",
          "Content-Type": "application/json",
        },
        data: {
          to: data.to,
          notification: {
            body: data.description,
            title: data.title,
          },
          data: {
            deepLink: data.mobile,
            webLink: data.web,
          },
        },
      });
      //   console.log({ dataProcess });

      const creteNotif = await Notifikasi.create(
        {
          type: data.type,
          title: data.title,
          description: data.description,
          officer_id: data.officer_id,
          mobile: data.mobile,
          web: data.web,
        },
        {
          transaction,
        }
      );
      await transaction.commit();
      return {
        // notif: dataProcess.data,
        notifDatabase: creteNotif,
      };
    } catch (e) {
      await transaction.rollback();
      return e;
      //   response(res, false, "Failed", e.message);
    }
  };
  static add = async (req, res) => {
    // const transaction = await db.transaction();
    try {
      //   let fieldValueData = {};
      //   const modelAttr = Object.keys(Notifikasi.getAttributes());
      //   Object.keys(modelAttr).forEach((key) => {
      //     if (req.body[key]) {
      //       fieldValueData[key] = req.body[key];
      //     } else {
      //       fieldValueData[key] = null;
      //     }
      //   });

      //   let op = await Notifikasi.create(fieldValueData, {
      //     transaction: transaction,
      //   });
      let data = await axios({
        url: "https://fcm.googleapis.com/fcm/send",
        method: "POST",
        headers: {
          Authorization: "key=AIzaSyCD0yzgSLiF7_vOgyKP_m8uaONbDc7woo8",
          "Content-Type": "application/json",
        },
        data: {
          notification: {
            title: "FCM Message",
            body: "This is an FCM Message",
          },
        },
        to: "fesB3EIOuPY:APA91bFosgJh89lWGJffJfD3jIGDM8YV-UG6mgvRdL8JTIl9EZ31q_FZ3-ohhhLZRNRIQwq_C2GQw6F0HZq2KvsDW6lBY7V6uQIMSrOfrx0J53L6Cq8w4cfCv2UmoDhwy5HkJESu--Jn",
      });
      //   await transaction.commit();
      // console.log({ data });
      response(res, true, "Succeed", data);
    } catch (e) {
      //   await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  static edit = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValueData = {};
      Object.keys(fieldData).forEach((key) => {
        if (req.body[key]) {
          fieldValueData[key] = req.body[key];
        } else {
          fieldValueData[key] = null;
        }
      });

      await Notifikasi.update(fieldValueData, {
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
      await Notifikasi.destroy({
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
