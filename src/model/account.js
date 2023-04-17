const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
const Vehicle = require("./vehicle");
const Country = require("./country");
// const Officer = require("./officer");
const Trx_account_officer = require("./trx_account_officer");
const Model = Sequelize.Model;

class Account extends Model {}
Account.init(
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
    name_account: {
      type: Sequelize.STRING(50),
    },

    leader_team: {
      type: Sequelize.INTEGER,
    },
    id_vehicle: {
      type: Sequelize.INTEGER,
    },
    id_country: {
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

    ...StructureTimestamp,
  },
  {
    // indexes: [{ fields: ["id_vehicle"] }],
    // Sequelize.literal("accounts.deleted_at is null")
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
    scopes: {
      deleted: {
        where: {
          // Sequelize.literal("accounts.deleted_at is null")
          deleted_at: null,
        },
      },
    },
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "account",
    modelName: "accounts",
    sequelize: db,
  }
);

Account.hasOne(Country, {
  foreignKey: "id",
  // as: "countrys",
  sourceKey: "id_country",
});
Account.hasOne(Vehicle, {
  foreignKey: "id",
  as: "vehicle",
  sourceKey: "id_vehicle",
});
// Account.hasOne(Officer, {
//   foreignKey: "id",
//   // as: "leader",
//   sourceKey: "leader_team",
// });
// Account.belongsToMany(Officer, {
//   as: "officers",
//   through: "trx_account_officer",
//   foreignKey: "account_id",
//   otherKey: "officer_id",
//   // otherKey: "vehicle_id",
// });
Account.belongsToMany(Vehicle, {
  as: "vehicles",
  through: "trx_account_officer",
  foreignKey: "account_id",
  otherKey: "vehicle_id",
});
(async () => {
  Account.sync({ alter: true }).catch((err) => {
    console.log({ err });
  });
})();
module.exports = Account;
