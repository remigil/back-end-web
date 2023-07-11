const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const Public_vehicle = require("../model/public_vehicle");
const Type_vehicle = require("../model/type_vehicle");
const Brand_vehicle = require("../model/brand_vehicle");
const Society = require("../model/society");
const { Op, Sequelize, col } = require("sequelize");
const _ = require("lodash");
const db = require("../config/database");

// Public_vehicle.belongsTo(Brand_vehicle,{foreignKey:'brand_id'});
// Public_vehicle.belongsTo(Type_vehicle,{foreignKey:'type_id'});
// Public_vehicle.belongsTo(Society,{foreignKey:'society_id'});

let fieldData = {
  no_vehicle: null,
  brand_id: null,
  type_id: null,
};

// Brand_vehicle.hasOne(Public_vehicle,{foreignKey:'id'})
// Public_vehicle.hasOne(Brand_vehicle,{foreignKey:'id',sourceKey:'brand_id',})

module.exports = class Public_vehicleController {
  static get = async (req, res) => {
    try {
      const {
        length = 10,
        start = 0,
        serverSide = null,
        search = null,
        filter = [],
        filterSearch = [],
        order = 0,
        orderDirection = "asc",
      } = req.query;
      const modelAttr = Object.keys(Public_vehicle.getAttributes());
      let getData = { where: null };
      if (serverSide?.toLowerCase() === "true") {
        getData.limit = length;
        getData.offset = start;
      }
      if (order <= modelAttr.length) {
        getData.order = [[modelAttr[order], orderDirection.toUpperCase()]];
      }
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
          model: Brand_vehicle,
          attributes: ["brand_name"],
        },
        {
          model: Type_vehicle,
          attributes: ["type_name"],
        },
        {
          model: Society,
          attributes: ["person_name"],
        },
      ];
      const data = await Public_vehicle.findAll(getData);
      const count = await Public_vehicle.count({
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
      const data = await Public_vehicle.findAll({
        where: {
          id: AESDecrypt(req.params.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        include: [
          {
            model: Brand_vehicle,
            attributes: ["brand_name"],
          },
          {
            model: Type_vehicle,
            attributes: ["type_name"],
          },
          {
            model: Society,
            attributes: ["person_name"],
          },
        ],
      });
      response(res, true, "Succeed", {
        data,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static getbySocietyId = async (req, res) => {
    try {
      const data = await Public_vehicle.findAll({
        where: {
          society_id: AESDecrypt(req.auth.uid, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        include: [
          {
            model: Brand_vehicle,
            attributes: ["brand_name"],
          },
          {
            model: Type_vehicle,
            attributes: ["type_name"],
          },
          {
            model: Society,
            attributes: ["person_name"],
          },
        ],
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
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          fieldValueData[val] = req.body[val];
        }
      });
      fieldValueData["brand_id"] = AESDecrypt(req.body.brand_id, {
        isSafeUrl: true,
        parseMode: "string",
      });
      fieldValueData["type_id"] = AESDecrypt(req.body.type_id, {
        isSafeUrl: true,
        parseMode: "string",
      });
      fieldValueData["society_id"] = AESDecrypt(req.auth.uid, {
        isSafeUrl: true,
        parseMode: "string",
      });
      let no_vehicle = req.body["no_vehicle"];
      let no_pol = no_vehicle.toUpperCase();
      fieldValueData["no_vehicle"] = no_pol;
      let datakendaraan = await Public_vehicle.create(
        fieldValueData,

        { transaction: transaction }
      );
      // await User.create(fieldValue, { transaction: transaction });

      await transaction.commit();
      response(res, true, "Succeed", datakendaraan);
      // } else {
      //   await transaction.rollback();
      //   response(res, false, "Failed", null);
      // }
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  static edit = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValueData = {};
      let no_vehicle = req.body.no_vehicle;
      let no_pol = no_vehicle.toUpperCase();
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          fieldValueData[val] = req.body[val];
        }
      });

      fieldValueData["brand_id"] = AESDecrypt(req.body.brand_id, {
        isSafeUrl: true,
        parseMode: "string",
      });
      fieldValueData["type_id"] = AESDecrypt(req.body.type_id, {
        isSafeUrl: true,
        parseMode: "string",
      });
      fieldValueData["no_vehicle"] = no_pol;

      let data = await Public_vehicle.update(fieldValueData, {
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
      await Public_vehicle.update(fieldValue, {
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
      await Public_vehicle.destroy({
        where: {
          id: AESDecrypt(req.body.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", "data berhasil di hapus");
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
};
