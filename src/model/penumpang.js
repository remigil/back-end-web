const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
const Model = Sequelize.Model;

class Penumpang extends Model {}
Penumpang.init(
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
    penumpang_id: {
      type: Sequelize.INTEGER,
    },
    nationality: {
      type: Sequelize.STRING(255),
    },
    name: {
      type: Sequelize.STRING(255),
    },
    nik: {
      type: Sequelize.STRING(255),
    },
    ...StructureTimestamp,
  },
  {
    defaultScope: { where: {
      deleted_at: null
    } },
    scopes: {
      deleted: {
        where: {
          deleted_at: null
        },
      },
    },
    indexes: [{ fields: ["penumpang_id"] }],
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "penumpang",
    modelName: "penumpang",
    sequelize: db,
  }
);


(async () => {
  Penumpang.sync({ alter: true });
})();
module.exports = Penumpang;
