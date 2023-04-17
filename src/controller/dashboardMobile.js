const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
// const Officer = require("../model/officer");
const db = require("../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const formidable = require("formidable");
const Account = require("../model/account");
const Vehicle = require("../model/vehicle");
const { Client } = require("@googlemaps/google-maps-services-js");
const pagination = require("../lib/pagination-parser");
const moment = require("moment");
const { TrackG20 } = require("../model/tracking/g20");
// const Polda = require("../model/polda");
// const Polres = require("../model/polres");
// const Cctv = require("../model/cctv");
// const Etle = require("../model/etle");
const Fasum = require("../model/fasum");
// const Sim_keliling = require("../model/sim_keliling");
// const Samsat = require("../model/samsat");
// const CategoryFasum = require("../model/category_fasum");
// const Schedule = require("../model/schedule");
// const Panic_button = require("../model/report");
// const Troublespot = require("../model/troublespot");
// const Blankspot = require("../model/blankspot");
// const Renpam = require("../model/renpam");
// const Vip = require("../model/vip");
const dateParse = (date) => {
  const aaa = moment.tz(date, "Etc/GMT-5");
  return aaa.format("YYYY-MM-DD");
};
const googleMapClient = new Client();
const fieldData = {
  pos_pam: async (req) => {
    let { limit, page } = req.query;
    page = page ? parseInt(page) : 1;
    const resPage = pagination.getPagination(limit, page);
    let pos_pam = await Renpam.findAndCountAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      distinct: true,
      limit: resPage.limit,
      offset: resPage.offset,
      where: {
        schedule_id: 88,
      },
    });
    return {
      limit: resPage.limit,
      page: page,
      total: pos_pam.count,
      total_page: Math.ceil(parseInt(pos_pam.count) / parseInt(resPage.limit)),
      rows: pos_pam.rows,
    };
  },
  pos_yan: async (req) => {
    let { limit, page } = req.query;
    page = page ? parseInt(page) : 1;
    const resPage = pagination.getPagination(limit, page);
    const pos_yan = await Renpam.findAndCountAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      distinct: true,
      limit: resPage.limit,
      offset: resPage.offset,
      where: {
        schedule_id: 89,
      },
    });
    return {
      limit: resPage.limit,
      page: page,
      total: pos_yan.count,
      total_page: Math.ceil(parseInt(pos_yan.count) / parseInt(resPage.limit)),
      rows: pos_yan.rows,
    };
  },
  sat_pjr: async (req) => {
    let { limit, page } = req.query;
    page = page ? parseInt(page) : 1;
    const resPage = pagination.getPagination(limit, page);
    const sat_pjr = await Renpam.findAndCountAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      distinct: true,
      limit: resPage.limit,
      offset: resPage.offset,
      where: {
        schedule_id: 92,
      },
    });
    return {
      limit: resPage.limit,
      page: page,
      total: sat_pjr.count,
      total_page: Math.ceil(parseInt(sat_pjr.count) / parseInt(resPage.limit)),
      rows: sat_pjr.rows,
    };
  },
  sat_pas: async (req) => {
    let { limit, page } = req.query;
    page = page ? parseInt(page) : 1;
    const resPage = pagination.getPagination(limit, page);
    const sat_pas = await Fasum.findAndCountAll({
      include: [
        {
          model: CategoryFasum,
          foreignKey: "fasum_type",
          required: false,
        },
      ],
      distinct: true,
      limit: resPage.limit,
      offset: resPage.offset,
      where: {
        fasum_status: 1,
        fasum_type: 19,
      },
    });
    return {
      limit: resPage.limit,
      page: page,
      total: sat_pas.count,
      total_page: Math.ceil(parseInt(sat_pas.count) / parseInt(resPage.limit)),
      rows: sat_pas.rows,
    };
  },
  pos_terpadu: async (req) => {
    let { limit, page } = req.query;
    page = page ? parseInt(page) : 1;
    const resPage = pagination.getPagination(limit, page);
    const pos_terpadu = await Renpam.findAndCountAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      distinct: true,
      limit: resPage.limit,
      offset: resPage.offset,
      where: {
        schedule_id: 90,
      },
    });
    return {
      limit: resPage.limit,
      page: page,
      total: pos_terpadu.count,
      total_page: Math.ceil(
        parseInt(pos_terpadu.count) / parseInt(resPage.limit)
      ),
      rows: pos_terpadu.rows,
    };
  },
};

module.exports = class DashboardMobileController {
  static get = async (req, res) => {
    try {
      const { filter, type, coordinate, radius, polda_id } = req.query;

      let tampung = {};
      let tampungArr = [];
      Object.keys(fieldData).forEach((value, key) => {
        if (fieldData[value]) {
          if (filter.split(",").some((e) => e == value)) {
            if (value == "pos_pam") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "pos_yan") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "pos_terpadu") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "sat_pjr") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            }
          }
        } else {
          tampung[value] = true;
          tampungArr.push(fieldData[value]);
        }
      });

      Promise.all(tampungArr).then((cek) => {
        let objData = {};
        Object.keys(tampung).forEach((val, key) => {
          objData[val] = cek[key] ? cek[key] : [];
        });
        response(res, true, "Succeed", objData);
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
};
