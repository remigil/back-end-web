const db = require("../config/database");
const response = require("../lib/response");
// const Faq = require("../model/faq");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const pagination = require("../lib/pagination-parser");
const { AESDecrypt } = require("../lib/encryption");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

const fieldData = {
  category_faq: null,
  question: null,
  answer: null,
};

module.exports = class FaqController {
  static get = async (req, res) => {
    try {
      let { limit, page, search } = req.query;
      page = page ? parseInt(page) : 1;
      const resPage = pagination.getPagination(limit, page);
      const modelAttr = Object.keys(Faq.getAttributes());
      let getDataRules = { where: null };

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
        getDataRules.where = {
          [Op.or]: whereBuilder,
        };
      }
      const faq = await Faq.findAndCountAll({
        ...getDataRules,
        order: [["created_at", "DESC"]],
        raw: true,
        nest: true,
        limit: resPage.limit,
        offset: resPage.offset,
      });
      response(res, true, "Succeed", {
        limit,
        page,
        total: faq.count,
        total_page: Math.ceil(parseInt(faq.count) / parseInt(resPage.limit)),
        ...faq,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static add = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValueData = {};
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          fieldValueData[val] = req.body[val];
        } else {
          fieldValueData[val] = null;
        }
      });
      let op = await Faq.create(fieldValueData, {
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
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          fieldValueData[val] = req.body[val];
        } else {
          fieldValueData[val] = null;
        }
      });
      await Faq.update(fieldValueData, {
        where: {
          id: AESDecrypt(req.params.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", fieldValueData);
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
      await Faq.update(fieldValue, {
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
      await Faq.destroy({
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
