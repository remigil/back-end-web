// const Sequelize = require("sequelize");
// const db = require("../config/database");
// const bcrypt = require("bcrypt");
// const { StructureTimestamp } = require("../constanta/db_structure");
// const { AESEncrypt } = require("../lib/encryption");
// const Model = Sequelize.Model;

// class Operasi_lg_langgarlantas extends Model {}
// Operasi_lg_langgarlantas.init(
//   {
//     id: {
//       type: Sequelize.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//       get() {
//         return AESEncrypt(String(this.getDataValue("id")), {
//           isSafeUrl: true,
//         });
//       },
//     },
//     polda_id: {
//       type: Sequelize.INTEGER,
//     },
//     polres_id: {
//       type: Sequelize.INTEGER,
//     },
//     operasi_id: {
//       type: Sequelize.INTEGER,
//     },
//     date: {
//       type: Sequelize.DATEONLY,
//     },
//     statis: {
//       type: Sequelize.INTEGER,
//     },
//     mobile: {
//       type: Sequelize.INTEGER,
//     },
//     pelanggaran_berat: {
//       type: Sequelize.INTEGER,
//     },
//     pelanggaran_sedang: {
//       type: Sequelize.INTEGER,
//     },
//     pelanggaran_ringan: {
//       type: Sequelize.INTEGER,
//     },
//     teguran: {
//       type: Sequelize.INTEGER,
//     },
//     ...StructureTimestamp,
//   },
//   {
//     defaultScope: {
//       where: {
//         deleted_at: null,
//       },
//     },
//     scopes: {
//       deleted: {
//         where: {
//           deleted_at: null,
//         },
//       },
//     },
//     deletedAt: "deleted_at",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//     tableName: "operasi_lg_langgarlantas",
//     modelName: "operasi_lg_langgarlantas",
//     sequelize: db,
//   }
// );

// (async () => {
//   Operasi_lg_langgarlantas.sync({ alter: true });
// })();
// module.exports = Operasi_lg_langgarlantas;
