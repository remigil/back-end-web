// const { AESDecrypt } = require("../lib/encryption");
// const response = require("../lib/response");
// const Etilang_perkara_pasal = require("../model/etilang_perkara_pasal");
// const db = require("../config/database");
// const fs = require("fs");
// const { Op, Sequelize } = require("sequelize");
// const readXlsxFile = require("read-excel-file/node");
// const _ = require("lodash");
// const formidable = require("formidable");
// const pagination = require("../lib/pagination-parser");

// const fieldData = {
//   address_cctv: null,
//   vms_cctv: null,
//   jenis_cctv: null,
//   merek_cctv: null,
//   type_cctv: null,
//   ip_cctv: null,
//   gateway_cctv: null,
//   username_cctv: null,
//   password_cctv: null,
//   lat_cctv: null,
//   lng_cctv: null,
//   link_cctv: null,
//   status_cctv: null,
//   polda_id: null,
// };
// module.exports = class EtilangPerkaraPasalController {
//   static get = async (req, res) => {
//     try {
//       const {
//         length = 10,
//         start = 0,
//         serverSide = null,
//         search = null,
//         filter = [],
//         filterSearch = [],
//         order = null,
//         orderDirection = "asc",
//       } = req.query;
//       const modelAttr = Object.keys(Etilang_perkara_pasal.getAttributes());
//       let getData = { where: null };
//       if (serverSide?.toLowerCase() === "true") {
//         const resPage = pagination.getPagination(length, start);
//         getData.limit = resPage.limit;
//         getData.offset = resPage.offset;
//       }
//       // getDataRules.order = [[modelAttr[order], orderDirection.toUpperCase()]];
//       getData.order = [
//         [
//           order != null ? order : "no_bayar",
//           orderDirection != null ? orderDirection : "asc",
//         ],
//       ];
//       if (search != null) {
//         let whereBuilder = [];
//         modelAttr.forEach((key) => {
//           whereBuilder.push(
//             Sequelize.where(
//               Sequelize.fn(
//                 "lower",
//                 Sequelize.cast(Sequelize.col(key), "varchar")
//               ),
//               {
//                 [Op.like]: `%${search.toLowerCase()}%`,
//               }
//             )
//           );
//         });
//         getData.where = {
//           [Op.or]: whereBuilder,
//         };
//       }
//       if (
//         filter != null &&
//         filter.length > 0 &&
//         filterSearch != null &&
//         filterSearch.length > 0
//       ) {
//         const filters = [];
//         filter.forEach((fKey, index) => {
//           if (_.includes(modelAttr, fKey)) {
//             filters[fKey] = filterSearch[index];
//           }
//         });
//         getData.where = {
//           ...getData.where,
//           ...filters,
//         };
//       }

//       Etilang_perkara_pasal.findAll({
//         ...getData,
//         attributes: {
//           exclude: ["createdAt", "updatedAt"],
//         },
//       })
//         .then((result) => {
//           return response(res, true, "Succeed", {
//             result,
//             recordsFiltered: 0,
//             recordsTotal: 0,
//           });
//         })
//         .catch((err) => {
//           console.log(err);
//         });
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };
// };
