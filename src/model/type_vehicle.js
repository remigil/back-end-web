const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
// const Type_vehicle = require("./type_vehicle");
// const Brand_vehicle = require("./brand_vehicle");
const Model = Sequelize.Model;

class Type_vehicle extends Model {}
Type_vehicle.init(
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
    type_name: {
      type: Sequelize.STRING(100),
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
    tableName: "type_vehicle",
    modelName: "type_vehicle",
    sequelize: db,
  }
);
// Type_vehicle.belongsToMany(Brand_vehicle, {
//   as: "brand_vehicle",
//   through: "type_brand_vehicle",
//   foreignKey: "type_id",
//   otherKey: "brand_id",
// });
// otherKey: "vehicle_id",
// User.hasOne(UserRole, { foreignKey: "id" });
// (async () => {
//   Type_vehicle.sync({ alter: true });
// })();
module.exports = Type_vehicle;
