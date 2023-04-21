const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
const Model = Sequelize.Model;

class Kecamatan extends Model {}
Kecamatan.init(
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
    nama: {
      type: Sequelize.STRING(255),
    },
    kode: {
      type: Sequelize.STRING(255),
    },
    kode_kabkot: {
      type: Sequelize.STRING(255),
    },
    kode_prov: {
      type: Sequelize.STRING(255),
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
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "kecamatan",
    modelName: "kecamatan",
    sequelize: db,
  }
);
(async () => {
  Kecamatan.sync({ alter: true }).catch((err) => {
    console.log({ err });
  });
})();
module.exports = Kecamatan;
