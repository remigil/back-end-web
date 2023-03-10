const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const PanicButton = require("../model/public_report");
const db = require("../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const pagination = require("../lib/pagination-parser");
const moment = require("moment");
const prefix = require("../middleware/prefix");
const codeReport = require("../middleware/codeReport");
// const Officer = require("../model/officer");
const fieldData = {
  code: null,
  // type: null,
  foto: null,
  // subject: null,
  categori: null,
  // status: null,
  coordinate: null,
  description: null,
  // officer_id: null,
};
const getCodeReport = async ({ monthYear, type }) => {
  let [getCode] =
    await db.query(`select count(to_char(created_at, 'MMYY')) as count  from report r
    where to_char(created_at, 'MMYY')='${monthYear}' AND type='${type}'
    group by to_char(created_at, 'MMYY')`);
  return getCode.length ? prefix(getCode[0].count) : prefix(1);
};
module.exports = class PanicButtonController {
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
        // [
        //   order != null ? order : "id",
        //   orderDirection != null ? orderDirection : "asc",
        // ],
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
      const data = await PanicButton.findAll(getData);
      const count = await PanicButton.count({
        where: getData?.where,
      });
      response(res, true, "Succeed", {
        data,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (e) {
      console.log(e);
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
      Object.keys(fieldData).forEach((key) => {
        if (req.body[key]) {
          if (key == "foto") {
            let path = req.body.foto.filepath;
            let file = req.body.foto;
            let fileName = file.originalFilename;
            fs.renameSync(
              path,
              "./public/uploads/public_panic_button/" + fileName,
              function (err) {
                if (err) throw err;
              }
            );
            fieldValueData[key] = fileName;
          } else if (key == "coordinate") {
            fieldValueData[key] = JSON.parse(req.body[key]);
          } else {
            fieldValueData[key] = req.body[key];
          }
        } else {
          fieldValueData[key] = null;
        }
      });

      fieldValueData["type"] = "PNC";
      let kode = await getCodeReport({
        monthYear: moment().format("MMYY"),
        type: "PNC",
      });
      let typeCode = codeReport(req.body.categori);
      let getCode = `PNC/${moment().format("MMYY")}/${kode}/P/${typeCode}`;
      fieldValueData["code"] = getCode;
      let op = await PanicButton.create(fieldValueData, {
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
      let fieldValueData = {};
      Object.keys(fieldData).forEach((key) => {
        if (req.body[key]) {
          if (key == "photo_officer") {
            let path = req.body.photo_officer.filepath;
            let file = req.body.photo_officer;
            let fileName = file.originalFilename;
            fs.renameSync(
              path,
              "./public/uploads/public_panic_button/" + fileName,
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
      let fieldValue = {};
      fieldValue["deleted_at"] = new Date();
      await PanicButton.update(fieldValue, {
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

  static hardDelete = async (req, res) => {
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
