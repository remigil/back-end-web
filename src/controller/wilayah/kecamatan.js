const { AESDecrypt } = require("../../lib/encryption");
const response = require("../../lib/response");
const Kecamatan = require("../../model/kecamatan");
const db = require("../../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const readXlsxFile = require("read-excel-file/node");
const _ = require("lodash");
const formidable = require("formidable");
const pagination = require("../../lib/pagination-parser");

module.exports = class KecamatanController {
  static get = async (req, res) => {
    try {
      const {
        length = 10,
        start = 0,
        serverSide = null,
        search = null,
        filter = [],
        filterSearch = [],
        order = null,
        orderDirection = "asc",
      } = req.query;
      const modelAttr = Object.keys(Kecamatan.getAttributes());
      let getData = { where: null };
      if (serverSide?.toLowerCase() === "true") {
        const resPage = pagination.getPagination(length, start);
        getData.limit = resPage.limit;
        getData.offset = resPage.offset;
      }
      // getDataRules.order = [[modelAttr[order], orderDirection.toUpperCase()]];
      getData.order = [
        [
          order != null ? order : "id",
          orderDirection != null ? orderDirection : "asc",
        ],
      ];
      if (search != null) {
        let whereBuilder = [];
        modelAttr.forEach((key) => {
          whereBuilder.push(
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.cast(Sequelize.col(key), "varchar")
              ),
              {
                [Op.like]: `%${search.toLowerCase()}%`,
              }
            )
          );
        });
        getData.where = {
          [Op.or]: whereBuilder,
        };
      }
      if (
        filter != null &&
        filter.length > 0 &&
        filterSearch != null &&
        filterSearch.length > 0
      ) {
        const filters = [];
        filter.forEach((fKey, index) => {
          if (_.includes(modelAttr, fKey)) {
            filters[fKey] = filterSearch[index];
          }
        });
        getData.where = {
          ...getData.where,
          ...filters,
        };
      }
      const data = await Kecamatan.findAll(getData);
      const count = await Kecamatan.count({
        where: getData?.where,
      });
      response(res, true, "Succeed", {
        data,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static getId = async (req, res) => {
    try {
      const data = await Kecamatan.findOne({
        where: {
          id: AESDecrypt(req.params.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
      });
      response(res, true, "Succeed", {
        data,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static importExcell = async (req, res) => {
    const t = await db.transaction();
    try {
      let readExcell = [
        {
          nama: "Bogor Barat",
          kode: "32.71.04",
          kode_kabkot: "32.71",
          kode_prov:"32"
        },
        {
          nama: "Bogor Tengah",
          kode: "32.71.03",
          kode_kabkot: "32.71",
          kode_prov:"32"
        },
        {
          nama: "Bogor Selatan",
          kode: "32.71.01",
          kode_kabkot: "32.71",
          kode_prov:"32"
        },
        {
          nama: "Bogor Timur",
          kode: "32.71.02",
          kode_kabkot: "32.71",
          kode_prov:"32"
        },
        {
          nama: "Bogor Utara",
          kode: "32.71.05",
          kode_kabkot: "32.71",
          kode_prov:"32"
        },
        {
          nama: "Tanah Sereal",
          kode: "32.71.06",
          kode_kabkot: "32.71",
          kode_prov:"32"
        },
      ];
      const ress = await Kecamatan.bulkCreate(readExcell, {
        transaction: t,
      });
      await t.commit();

      response(res, true, "Succed", ress);
    } catch (error) {
      await t.rollback();
      response(res, false, "Failed", error.message);
    }
  };
};
