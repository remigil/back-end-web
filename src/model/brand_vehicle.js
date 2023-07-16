const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure"); 
const { AESEncrypt } = require("../lib/encryption");
const Type_vehicle = require("./type_vehicle");
const Model = Sequelize.Model;

class Brand_vehicle extends Model {}
Brand_vehicle.init(
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
    brand_name: {
      type: Sequelize.STRING(100),
    },
    type_id: {
      type: Sequelize.INTEGER,
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
          deleted_At: null
        },
      },
    },
    indexes: [{ fields: ["type_id"] }],
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "brand_vehicle",
    modelName: "brand_vehicle",
    sequelize: db,
  }
);

Brand_vehicle.belongsTo(Type_vehicle,{
  foreignKey: "type_id",
});

// User.hasOne(UserRole, { foreignKey: "id" });
(async () => {
  Brand_vehicle.sync({ alter: true });
})();
module.exports = Brand_vehicle;
