const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
// const Officer = require("./officer");
// const TrxAccountOfficer = require("./trx_account_officer");
const Account = require("./account");
const codeReport = require("../middleware/codeReport");
const Model = Sequelize.Model;

class Panic_button extends Model {}
Panic_button.init(
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      get() {
        return AESEncrypt(String(this.getDataValue("id")), {
          isSafeUrl: true,
        });
      },
    },
    code: {
      type: Sequelize.STRING(255),
    },
    type: {
      type: Sequelize.STRING(5),
    },
    foto: {
      type: Sequelize.STRING(255),
    },
    // {
    //   title: 'Tindak Kriminal',
    //   value: 1,
    //   valueToDatabase: 1,
    // },
    // {
    //   title: 'Kecelakaan',
    //   value: 2,
    //   valueToDatabase: 2,
    // },
    // {
    //   title: 'Bencana Alam',
    //   value: 3,
    //   valueToDatabase: 3,
    // },
    // 1= Kriminal, 2=Kecelakaan, 3=bencana alam, 4=kemacetan
    categori: {
      type: Sequelize.INTEGER,
      // get() {
      //   return codeReport(this.getDataValue("categori"), "type");
      // },
    },
    status: {
      type: Sequelize.INTEGER,
    },
    officer_id: {
      type: Sequelize.INTEGER,
    },
    coordinate: {
      type: Sequelize.JSON,
    },
    description: {
      type: Sequelize.TEXT,
    },
    address: {
      type: Sequelize.TEXT,
    },
    ...StructureTimestamp,
  },
  {
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
    scopes: {
      deleted: {
        where: {
          deleted_at: null,
        },
      },
    },
    // indexes: [{ fields: ["role_id"] }],
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "report",
    modelName: "report",
    sequelize: db,
  }
);
// Panic_button.hasOne(Officer, {
//   foreignKey: "id",
//   sourceKey: "officer_id",
// });
// Panic_button.belongsToMany(Officer, {
//   // as: "officers",
//   through: "trx_account_officer",
//   foreignKey: "officer_id",
//   otherKey: "officer_id",
//   // otherKey: "vehicle_id",
// });
Panic_button.belongsToMany(Account, {
  // as: "officers",
  through: "trx_account_officer",
  foreignKey: "officer_id",
  otherKey: "officer_id",
  sourceKey: "officer_id",
  // otherKey: "vehicle_id",
});
// Panic_button.hasOne(TrxAccountOfficer, {
//   foreignKey: "officer_id",
//   sourceKey: "officer_id",
// });
(async () => {
  Panic_button.sync({ alter: true }).catch((err) => {
    console.log({ err });
  });
})();
module.exports = Panic_button;
