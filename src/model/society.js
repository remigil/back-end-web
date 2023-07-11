const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
const Model = Sequelize.Model;

class Society extends Model {}
Society.init(
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
    person_name: {
      type: Sequelize.STRING(50),
    },
    email: {
      type: Sequelize.STRING(200),
    },
    no_hp: {
      type: Sequelize.STRING(200),
    },
    status_verifikasi: {
      type: Sequelize.INTEGER,
    },
    password: {
      type: Sequelize.TEXT,
      set(value) {
        this.setDataValue(
          "password",
          bcrypt.hashSync(value, bcrypt.genSaltSync(10))
        );
      },
    },
    foto: {
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
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "society",
    modelName: "societys",
    sequelize: db,
  }
);

(async () => {
  Society.sync({ alter: true });
})();
module.exports = Society;
