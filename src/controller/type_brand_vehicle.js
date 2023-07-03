const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const Type_brand_vehicle = require("../model/Type_brand_vehicle");
const Type_vehicle = require("../model/type_vehicle");
const Brand_vehicle = require("../model/brand_vehicle");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const db = require("../config/database");

// Type_vehicle.hasMany(Brand_vehicle,{foreignKey:'type_vehicle_id'});
const fieldData = {
  type_id: null,
  brand_id: null,
};
module.exports = class Type_brand_vehicleController {
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
      const modelAttr = Object.keys(Type_vehicle.getAttributes());
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
      const data = await Type_vehicle.findAll({
        ...getData,
        include: [
          {
            model: Brand_vehicle,
            as: "brand_vehicle",
            foreignKey: "id_brand",
            attributes: ["id", "brand_name"],
          },
        ],
      });
      const count = await Type_vehicle.count({
        where: getData?.where,
      });
      response(res, true, "Succeed", {
        data,
        // recordsFiltered: count,
        // recordsTotal: count
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  // static getId = async (req, res) => {
  //   try {
  //     const data = await Type_vehicle.findOne({
  //       where: {
  //         id: AESDecrypt(req.params.id, {
  //           isSafeUrl: true,
  //           parseMode: "string",
  //         }),
  //       },
  //     });
  //     response(res, true, "Succeed", {
  //       data,
  //     });
  //   } catch (e) {
  //     response(res, false, "Failed", e.message);
  //   }
  // };

  static add = async (req, res) => {
    const transaction = await db.transaction();
    try {
    let data =   await Type_brand_vehicle.create(
        {
          type_id: AESDecrypt(req.body["type_id"],{
            isSafeUrl: true,
            parseMode: "string",
          }),
          brand_id: AESDecrypt(req.body["brand_id"],{
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        { transaction: transaction }
      );
      await transaction.commit();
      response(res, true, "Succeed", data );
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  // static edit = async (req, res) => {
  //   const transaction = await db.transaction();
  //   try {
  //     await Type_vehicle.update(
  //       {
  //         type_name: req.body.type_name,
  //       },
  //       {
  //         where: {
  //           id: AESDecrypt(req.params.id, {
  //             isSafeUrl: true,
  //             parseMode: "string",
  //           }),
  //         },
  //         transaction: transaction,
  //       }
  //     );
  //     await transaction.commit();
  //     response(res, true, "Succeed", null);
  //   } catch (e) {
  //     await transaction.rollback();
  //     response(res, false, "Failed", e.message);
  //   }
  // };

  // static delete = async (req, res) => {
  //   const transaction = await db.transaction();
  //   try {
  //     let fieldValue = {};
  //     fieldValue["deleted_at"] = new Date();
  //     await Type_vehicle.update(fieldValue, {
  //       where: {
  //         id: AESDecrypt(req.body.id, {
  //           isSafeUrl: true,
  //           parseMode: "string",
  //         }),
  //       },
  //       transaction: transaction,
  //     });
  //     await transaction.commit();
  //     response(res, true, "Succeed", null);
  //   } catch (e) {
  //     await transaction.rollback();
  //     response(res, false, "Failed", e.message);
  //   }
  // };
//   static hardDelete = async (req, res) => {
//     const transaction = await db.transaction();
//     try {
//       await Type_vehicle.destroy({
//         where: {
//           id: AESDecrypt(req.body.id, {
//             isSafeUrl: true,
//             parseMode: "string",
//           }),
//         },
//         transaction: transaction,
//       });
//       await transaction.commit();
//       response(res, true, "Succeed", null);
//     } catch (e) {
//       await transaction.rollback();
//       response(res, false, "Failed", e.message);
//     }
//   };
};
