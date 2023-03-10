const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
const Polda = require("./polda");
const Model = Sequelize.Model;

class Officer extends Model {}
Officer.init(
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
    operation_id: {
      type: Sequelize.INTEGER,
    },
    name_officer: {
      type: Sequelize.STRING(255),
    },
    photo_officer: {
      type: Sequelize.TEXT,
    },
    nrp_officer: {
      type: Sequelize.STRING(255),
    },
    rank_officer: {
      type: Sequelize.STRING(255),
    },
    structural_officer: {
      type: Sequelize.STRING(255),
    },
    pam_officer: {
      type: Sequelize.STRING(255),
    },
    phone_officer: {
      type: Sequelize.STRING(50),
      get() {
        let noTelpon = this.getDataValue("phone_officer");
        let noDepan = noTelpon ? noTelpon.substring(0, 2) : null;
        let noDepan1 = noTelpon ? noTelpon.substring(0, 1) : "";
        if (noDepan === "62") {
          noTelpon = noTelpon;
        } else if (noDepan === "08") {
          noTelpon = "62" + noTelpon.substring(1);
        } else if (noDepan === "+6") {
          noTelpon = noTelpon.substring(1);
        } else {
          noTelpon = noTelpon;
        }
        if (noDepan1 === "8") {
          noTelpon = "62" + noTelpon;
        }
        return noTelpon;
      },
    },
    status_officer: {
      type: Sequelize.INTEGER,
    },
    status_login: {
      type: Sequelize.INTEGER,
    },
    polda_id: {
      type: Sequelize.INTEGER,
    },
    polres_id: {
      type: Sequelize.INTEGER,
    },
    deviceId: {
      type: Sequelize.TEXT,
    },
    replacementNrp_officer: {
      type: Sequelize.STRING(255),
    },
    password: {
      type: Sequelize.TEXT,
    },
    category_officer: {
      type: Sequelize.INTEGER,
    },
    color_marker: {
      type: Sequelize.TEXT,
    },
    ...StructureTimestamp,
  },
  {
    defaultScope: {
      where: {
        // Sequelize.literal("officer.deleted_at is null")
        deleted_at: null,
      },
    },
    scopes: {
      deleted: {
        where: {
          // Sequelize.literal("officer.deleted_at is null")
          deleted_at: null,
        },
      },
    },
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "officer",
    modelName: "officer",
    sequelize: db,
  }
);
Officer.hasOne(Polda, {
  foreignKey: "id",
  as: "polda",
  sourceKey: "polda_id",
});

// (async () => {
//   Officer.sync({ alter: true }).catch((err) => {
//     console.log({ err });
//   });
// })();
module.exports = Officer;
