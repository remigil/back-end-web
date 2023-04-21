const Sequelize = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { StructureTimestamp } = require("../constanta/db_structure");
const { AESEncrypt } = require("../lib/encryption");
const Society = require("./society");
const Public_vehicle = require("./public_vehicle");
const Type_vehicle = require("./type_vehicle");
const Brand_vehicle = require("./brand_vehicle");
const Penumpang = require("./penumpang");
const Model = Sequelize.Model;

class Ngawas extends Model {}
Ngawas.init(
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
    user_id: {
      type: Sequelize.INTEGER,
    },
    vehicle_id: {
      type: Sequelize.INTEGER,
    },
    brand_id: {
      type: Sequelize.INTEGER,
    },
    type_id: {
      type: Sequelize.INTEGER,
    },
    distance: {
      type: Sequelize.STRING,
    },
    duration: {
      type: Sequelize.STRING,
    },
    departure_date: {
      type: Sequelize.DATEONLY,
    },
    departure_time: {
      type: Sequelize.TIME,
    },
    start_coordinate: {
      type: Sequelize.JSON,
    },
    end_coordinate: {
      type: Sequelize.JSON,
    },
    route: {
      type: Sequelize.JSON,
    },
    validity_period: {
      type: Sequelize.STRING,
    },
    subdistrict_start:{
      type: Sequelize.STRING
    },
    district_start: {
      type: Sequelize.STRING,
    },
    province_start: {
      type: Sequelize.STRING,
    },
    subdistrict_end: {
      type: Sequelize.STRING,
    },
    district_end: {
      type: Sequelize.STRING,
    },
    province_end: {
      type: Sequelize.STRING,
    },
    barcode: {
      type: Sequelize.STRING,
    },
    kode_prov_start: {
      type: Sequelize.STRING,
    },
    kode_kabkot_start: {
      type: Sequelize.STRING,
    },
    kode_kec_start: {
      type: Sequelize.STRING,
    },
    kode_prov_end: {
      type: Sequelize.STRING,
    },
    kode_kabkot_end: {
      type: Sequelize.STRING,
    },
    kode_kec_end: {
      type: Sequelize.STRING,
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
    indexes: [{ fields: ["user_id", "vehicle_id", "type_id", "brand_id"] }],
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "ngawas",
    modelName: "ngawas",
    sequelize: db,
  }
);
Ngawas.hasOne(Society, {
  foreignKey: "id",
  sourceKey: "user_id",
});
Ngawas.hasOne(Public_vehicle, {
  foreignKey: "id",
  sourceKey: "vehicle_id",
});
Ngawas.hasOne(Type_vehicle, {
  foreignKey: "id",
  sourceKey: "type_id",
});
Ngawas.hasOne(Brand_vehicle, {
  foreignKey: "id",
  sourceKey: "brand_id",
});
Ngawas.hasMany(Penumpang, { foreignKey: "ngawas_id" });

(async () => {
  Ngawas.sync({ alter: true });
})();
module.exports = Ngawas;
