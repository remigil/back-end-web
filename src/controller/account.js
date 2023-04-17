const db = require("../config/database");
const response = require("../lib/response");
const Account = require("../model/account");
const Vehicle = require("../model/vehicle");
const Country = require("../model/country");
const Polres = require("../model/polres");
// const AccountProfile = require("../model/trx_account_officer");
const _ = require("lodash");
const { Op, Sequelize } = require("sequelize");
const { AESDecrypt } = require("../lib/encryption");
// const Officer = require("../model/officer");
const pagination = require("../lib/pagination-parser");
const fs = require("fs");
// const TrxAccountOfficer = require("../model/trx_account_officer");
const exportUser = require("../middleware/exportExcel");
const { default: readXlsxFile } = require("read-excel-file/node");
// const { default: readXlsxFile } = require("read-excel-file");

const field_account = {
  name_account: null,

  leader_team: null,
  id_vehicle: null,
  id_country: null,
  id_account: null,
  officers: null,
  vehicles: null,
  password: null,
};

// AccountProfile.hasOne(Vehicle, {
//   foreignKey: "vehicle_id", // replaces `productId`
//   sourceKey: "id",
// });

module.exports = class AccountController {
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
      const modelAttr = Object.keys(Account.getAttributes());
      let getDataRules = { where: null };
      if (serverSide?.toLowerCase() === "true") {
        const resPage = pagination.getPagination(length, start);
        getDataRules.limit = resPage.limit;
        getDataRules.offset = resPage.offset;
      }

      // console.log({ a: filter, b: filterSearch });

      getDataRules.order = [
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
        getDataRules.where = {
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
            if (fKey == "id_country") {
              filters[fKey] = AESDecrypt(filterSearch[index], {
                isSafeUrl: true,
                parseMode: "string",
              });
            } else {
              filters[fKey] = filterSearch[index];
            }
          }
        });
        getDataRules.where = {
          ...getDataRules.where,
          ...filters,
        };
      }
      const count = await Account.count({
        where: getDataRules?.where,
      });
      const data = await Account.findAll({
        ...getDataRules,
        include: [
          {
            model: Country,
            // as: "countrys",
            foreignKey: "id_country",
            required: false,
          },
          {
            model: Vehicle,
            as: "vehicle",
            foreignKey: "id_vehicle",
            required: false,
          },
          {
            model: Officer,

            foreignKey: "leader_team",
            required: false,
          },
          {
            model: Officer,
            as: "officers",
            required: false,
          },
          {
            model: Vehicle,
            as: "vehicles",
            required: false,
          },
        ],
        subQuery: true,
      });

      response(res, true, "Succeed", {
        data,
        recordsFiltered: count,
        recordsTotal: count,
      });
    } catch (e) {
      console.log(e);
      response(res, false, "Failed", e.message);
    }
  };

  static export = async (req, res) => {
    try {
      let formatExcell = [
        { header: "id", key: "id", width: 5 },
        { header: "name_account", key: "name_account", width: 10 },
        { header: "vehicle_id", key: "vehicle_id", width: 10 },
        { header: "password", key: "password", width: 10 },
        { header: "country_id", key: "country_id", width: 10 },
        { header: "name_officer", key: "name_officer", width: 10 },
        { header: "nrp_officer", key: "nrp_officer", width: 10 },
        { header: "rank_officer", key: "rank_officer", width: 10 },
        { header: "structural_officer", key: "structural_officer", width: 10 },
        { header: "pam_officer", key: "pam_officer", width: 10 },
        { header: "phone_officer", key: "phone_officer", width: 10 },
        { header: "status_officer", key: "status_officer", width: 10 },
        { header: "leader_team", key: "leader_team", width: 10 },
        { header: "polda_id", key: "polda_id", width: 10 },
        { header: "polres_id", key: "polres_id", width: 10 },
      ];

      await exportUser(
        req,
        res,
        formatExcell,
        "Format Import Officer",
        "Officer",
        async (worksheet, workbook) => {
          const worksheet2 = workbook.addWorksheet("Data Vehicle");
          worksheet2.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "no_vehicle", key: "no_vehicle", width: 10 },
            { header: "type_vehicle", key: "type_vehicle", width: 10 },
            { header: "brand_vehicle", key: "brand_vehicle", width: 10 },
            {
              header: "ownership_vehicle",
              key: "ownership_vehicle",
              width: 10,
            },
            { header: "fuel_vehicle", key: "fuel_vehicle", width: 10 },
          ];

          const [getVehicle] = await db.query(
            `SELECT * FROM vehicle WHERE deleted_at is null ORDER BY id ASC`
          );
          getVehicle.forEach((vehicle) => {
            vehicle.id = vehicle.id;
            vehicle.no_vehicle = vehicle.no_vehicle;
            vehicle.type_vehicle = vehicle.type_vehicle;
            vehicle.brand_vehicle = vehicle.brand_vehicle;
            vehicle.ownership_vehicle = vehicle.ownership_vehicle;
            vehicle.fuel_vehicle = vehicle.fuel_vehicle;
            worksheet2.addRow(vehicle);
          });

          worksheet2.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
          });

          const worksheet3 = workbook.addWorksheet("Data Country");
          worksheet3.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "name_country", key: "name_country", width: 10 },
          ];

          // const getCountry = await Country.findAll();
          const [getCountry] = await db.query(
            `SELECT * FROM country WHERE deleted_at is null ORDER BY id ASC`
          );
          getCountry.forEach((country) => {
            country.id = country.id;
            country.name_country = country.name_country;

            worksheet3.addRow(country);
          });

          worksheet3.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
          });
          const worksheet4 = workbook.addWorksheet("Data Polda");
          worksheet4.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "code_satpas", key: "code_satpas", width: 10 },
            { header: "name_polda", key: "name_polda", width: 10 },
          ];

          // const getCountry = await Country.findAll();
          const [getPolda] = await db.query(
            `SELECT * FROM polda WHERE deleted_at is null ORDER BY id ASC`
          );
          getPolda.forEach((country) => {
            country.id = country.id;
            country.code_satpas = country.code_satpas;
            country.name_polda = country.name_polda;

            worksheet4.addRow(country);
          });

          worksheet4.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
          });
          const worksheet5 = workbook.addWorksheet("Data Polres");
          worksheet5.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "polda_id", key: "polda_id", width: 10 },
            { header: "code_satpas", key: "code_satpas", width: 10 },
            { header: "name_polres", key: "name_polres", width: 10 },
          ];

          // const getCountry = await Country.findAll();
          const [getPolres] = await db.query(
            `SELECT * FROM polres WHERE deleted_at is null ORDER BY id ASC`
          );
          getPolres.forEach((country) => {
            country.id = country.id;
            country.polda_id = country.polda_id;
            country.code_satpas = country.code_satpas;
            country.name_polres = country.name_polres;

            worksheet5.addRow(country);
          });

          worksheet5.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
          });

          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=Format-Import-Officer.xlsx`
          );

          return workbook.xlsx.write(res).then(() => {
            res.status(200);
          });
        }
      );
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };

  static importExcell = async (req, res) => {
    const t = await db.transaction();
    try {
      let path = req.body.file.filepath;
      let file = req.body.file;
      let fileName = file.originalFilename;
      fs.renameSync(path, "./public/uploads/excel/" + fileName, function (err) {
        if (err) response(res, false, "Error", err.message);
      });
      let readExcell = await readXlsxFile("./public/uploads/excel/" + fileName);
      let index = 0;
      let listOfficer = [];
      let officerCreate = [];
      const officerCreateError = [];
      const vehicleCreateError = [];
      const countryCreateError = [];
      let errorData = {
        country_not_found: {},
        vehicle_not_found: {},
        officer_avail: {},
      };
      for (const iterator of readExcell) {
        if (index == 0) {
        } else {
          let officerCheck = await Officer.findOne({
            where: {
              nrp_officer: `${iterator[6]}`,
            },
          });
          let vehicleCheck = await Vehicle.findOne({
            where: {
              id: iterator[2],
            },
          });
          let countryCheck = await Country.findOne({
            where: {
              id: iterator[4],
            },
          });

          if (vehicleCheck) {
            if (countryCheck) {
              if (officerCheck) {
                officerCreateError.push({
                  baris: index + 1,
                  name_officer: iterator[5] || null,
                  nrp_officer: iterator[6] || null,
                  rank_officer: iterator[7] || null,
                  structural_officer: iterator[8] || null,
                  pam_officer: iterator[9] || null,
                  phone_officer: iterator[10] || null,
                  status_officer: iterator[11] || null,
                  polda_id: iterator[13] || null,
                  polres_id: iterator[14] || null,
                });
              } else {
                officerCreate.push({
                  name_officer: iterator[5] || null,
                  nrp_officer: iterator[6] || null,
                  rank_officer: iterator[7] || null,
                  structural_officer: iterator[8] || null,
                  pam_officer: iterator[9] || null,
                  phone_officer: iterator[10] || null,
                  status_officer: iterator[11] || null,
                  polda_id: parseInt(iterator[13]) || null,
                  polres_id: parseInt(iterator[14]) || null,
                });
                listOfficer.push({
                  name_account: iterator[1],
                  vehicle_id: iterator[2],
                  password: iterator[3],
                  country_id: iterator[4] || null,
                  name_officer: iterator[5] || null,
                  nrp_officer: iterator[6] || null,
                  rank_officer: iterator[7] || null,
                  structural_officer: iterator[8] || null,
                  pam_officer: iterator[9] || null,
                  phone_officer: iterator[10] || null,
                  status_officer: iterator[11] || null,
                  leader_team: iterator[11] || null,
                  polda_id: parseInt(iterator[13]) || null,
                  polres_id: parseInt(iterator[14]) || null,
                });
              }
            } else {
              countryCreateError.push({
                baris: index + 1,
                name_officer: iterator[5] || null,
                nrp_officer: iterator[6] || null,
                rank_officer: iterator[7] || null,
                structural_officer: iterator[8] || null,
                pam_officer: iterator[9] || null,
                phone_officer: iterator[10] || null,
                status_officer: iterator[11] || null,
              });
            }
          } else {
            vehicleCreateError.push({
              baris: index + 1,
              name_officer: iterator[5] || null,
              nrp_officer: iterator[6] || null,
              rank_officer: iterator[7] || null,
              structural_officer: iterator[8] || null,
              pam_officer: iterator[9] || null,
              phone_officer: iterator[10] || null,
              status_officer: iterator[11] || null,
            });
          }
        }
        index++;
      }

      let duplicates = officerCreate
        .map((e) => e["nrp_officer"])
        .map((e, i, final) => final.indexOf(e) !== i && i)
        .filter((obj) => officerCreate[obj])
        .map((e) => officerCreate[e]["nrp_officer"]);

      listOfficer = listOfficer.filter(
        (list) =>
          `${list.nrp_officer}` !=
          duplicates.find((dup) => `${dup}` == `${list.nrp_officer}`)
      );
      officerCreate = officerCreate.filter(
        (list) =>
          list.nrp_officer !=
          duplicates.find((dup) => `${dup}` == `${list.nrp_officer}`)
      );
      errorData = {
        officer_available: officerCreateError,
        country_not_found: countryCreateError,
        vehicle_not_found: vehicleCreateError,
      };
      const officerCreateDb = await Officer.bulkCreate(officerCreate, {
        transaction: t,
      });

      let accountData = [];
      let officerDataForTRX = [];
      let errOfficerDataForTRX = [];
      for (const iterator of listOfficer) {
        let leaderTeam = officerCreateDb.find((officer) => {
          return `${officer.nrp_officer}` === `${iterator.nrp_officer}`;
        });
        // let leaderTeam2 = officerCreateDb.find((officer) => {
        //   return `${officer.nrp_officer}` === `${iterator.nrp_officer}`;
        // });
        // console.log({ leaderTeam2 });
        // if (leaderTeam.length) {
        if (leaderTeam?.dataValues?.id) {
          officerDataForTRX.push({
            ...iterator,
            name_account: iterator.name_account,
            vehicle_id: iterator.vehicle_id,
            password: iterator.password,
            country_id: iterator.country_id,
            leader_team: leaderTeam?.dataValues?.id,
            id: leaderTeam?.dataValues?.id,
          });
          accountData.push({
            name_account: iterator.name_account,
            vehicle_id: iterator.vehicle_id,
            password: iterator.password,
            country_id: iterator.country_id,
            leader_team: leaderTeam?.dataValues?.id,
          });
        } else {
          errOfficerDataForTRX.push(iterator);
        }
      }
      const accountCreateDb = await Account.bulkCreate(accountData, {
        transaction: t,
      });
      let trxAccountOfficerData = [];
      for (const iterator of officerDataForTRX) {
        let account_id = accountCreateDb.filter((account) => {
          return `${account.name_account}` === `${iterator.name_account}`;
        });
        trxAccountOfficerData.push({
          officer_id: iterator.id,
          account_id: account_id[0].dataValues.id,
        });
      }

      const accountOfficerTrx = await TrxAccountOfficer.bulkCreate(
        trxAccountOfficerData,
        {
          transaction: t,
        }
      );
      await t.commit();
      // await t.rollback();
      response(
        res,
        true,
        "Succed",
        {
          berhasil: {
            officer: officerCreateDb,
            account: accountCreateDb,
            account_officer: accountOfficerTrx,
          },
          gagal: {
            ...errorData,
            duplicate: duplicates,
            errorFormat: errOfficerDataForTRX,
          },
        },
        200
      );
      // console.log({ listOfficer });
      // // res.json({
      // //   isSuccess: false,
      // // });
      // // res.setHeader("Content-Type", "application/json");
      // res.header("Content-Type", "application/json");
      // res.status(200).send({ message: "This is a message" });
      // response(res, true, "Succeed", [], 200);
    } catch (error) {
      console.log({ error });
      await t.rollback();
      response(res, false, error.message, error, 400);
    }
  };
  static testImport = async (req, res) => {
    let geoJson = {};

    let formatExcell = [
      { header: "x", key: "x", width: 5 },
      { header: "y", key: "y", width: 10 },
      { header: "gid", key: "gid", width: 10 },
      { header: "Name", key: "Name", width: 10 },
      { header: "description", key: "description", width: 10 },
    ];

    await exportUser(
      req,
      res,
      formatExcell,
      "Format Import Officer",
      "Officer",
      async (worksheet, workbook) => {
        // let dataJson = [];
        let no = 1;

        for (const iterator of geoJson.features) {
          let descriptionData = "";
          Object.keys(iterator.properties).forEach((val, key) => {
            descriptionData += `${val}: ${iterator.properties[val]} \n`;
          });
          let dataJson = {};
          dataJson.x = `${iterator.geometry.coordinates[1]},${iterator.geometry.coordinates[0]}`;
          dataJson.y = `${iterator.geometry.coordinates[0]},${iterator.geometry.coordinates[1]}`;
          dataJson.gid = no;
          dataJson.Name = iterator.properties.NAMA;
          dataJson.description = descriptionData;
          worksheet.addRow(dataJson);
          // dataJson.push({
          //   x: `${iterator.geometry.coordinates[1]},${iterator.geometry.coordinates[0]}`,
          //   y: `${iterator.geometry.coordinates[1]},${iterator.geometry.coordinates[0]}`,
          //   Name: iterator.properties.NAMA,
          //   gid: no,
          //   description: ""
          // })
          no++;
        }

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=Format-Import-Officer.xlsx`
        );

        return workbook.xlsx.write(res).then(() => {
          res.status(200);
        });
      }
    );
    // response(res, true, "Succeed", { dataJson });
  };
  static getOfficerAccount = async (req, res) => {
    try {
      const idOfficer = AESDecrypt(req.auth.officer, {
        isSafeUrl: true,
        parseMode: "string",
      });
      let account_id = await TrxAccountOfficer.findOne({
        where: {
          officer_id: parseInt(idOfficer),
        },
      });
      let dataAccount = await Account.findOne({
        where: {
          id: account_id.account_id,
        },
        include: [
          {
            model: Officer,
            as: "officers",
            required: true,
          },
        ],
      });
      response(res, true, "Succeed", dataAccount.officers);
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static getOfficerAccountById = async (req, res) => {
    try {
      // const idOfficer = AESDecrypt(req.auth.officer, {
      //   isSafeUrl: true,
      //   parseMode: "string",
      // });
      console.log({ id: req });
      let account_id = await TrxAccountOfficer.findOne({
        where: {
          officer_id: parseInt(req.query.id),
        },
      });
      let dataAccount = await Account.findOne({
        where: {
          id: account_id.account_id,
        },
        include: [
          {
            model: Officer,
            as: "officers",
            required: true,
          },
        ],
      });
      response(res, true, "Succeed", dataAccount.officers);
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static getId = async (req, res) => {
    try {
      const data = await Account.findOne({
        include: [
          {
            model: Country,
            // as: "countrys",
            foreignKey: "id_country",
            required: false,
          },
          {
            model: Vehicle,
            as: "vehicle",
            foreignKey: "id_vehicle",
            required: false,
          },
          {
            model: Officer,
            // as: "leader",
            foreignKey: "leader_team",
            required: false,
          },
          {
            model: Officer,
            as: "officers",
            required: false,
          },
          {
            model: Vehicle,
            as: "vehicles",
            required: false,
          },
        ],
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
  static add = async (req, res) => {
    const transaction = await db.transaction();
    try {
      const findAccount = await Account.findOne({
        where: {
          name_account: req.body["name_account"],
        },
      });
      if (findAccount) {
        response(res, false, "Accound sudah ada", null);
      } else {
        let fieldValue = {};
        let fieldValueOfficer = {};
        Object.keys(field_account).forEach((val, key) => {
          if (req.body[val]) {
            if (
              val == "id_vehicle" ||
              val == "id_country" ||
              val == "leader_team"
            ) {
              fieldValue[val] = AESDecrypt(req.body[val], {
                isSafeUrl: true,
                parseMode: "string",
              });
            } else if (val == "officers" || val == "vehicles") {
              fieldValue[val] = JSON.parse(req.body[val]);
            } else {
              fieldValue[val] = req.body[val];
            }
          }
        });
        const createAccount = await Account.create(fieldValue, {
          transaction: transaction,
        });
        if (createAccount) {
          if (
            fieldValue["officers"] ||
            fieldValue["officers"].length > 0 ||
            fieldValue["officers"].length != null
          ) {
            for (let i = 0; i < fieldValue["officers"].length; i++) {
              fieldValueOfficer = {};
              fieldValueOfficer["account_id"] = AESDecrypt(
                createAccount["id"],
                {
                  isSafeUrl: true,
                  parseMode: "string",
                }
              );
              fieldValueOfficer["officer_id"] = AESDecrypt(
                fieldValue["officers"][i],
                {
                  isSafeUrl: true,
                  parseMode: "string",
                }
              );
              if (fieldValue["vehicles"] || fieldValue["vehicles"].length > 0) {
                fieldValueOfficer["vehicle_id"] = AESDecrypt(
                  fieldValue["vehicles"][i],
                  {
                    isSafeUrl: true,
                    parseMode: "string",
                  }
                );
              }
              await AccountProfile.create(fieldValueOfficer, { transaction });
            }
          }
        }
        await transaction.commit();
        response(res, true, "Succeed", null);
      }
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  static edit = async (req, res) => {
    // const transaction = await db.transaction();
    try {
      // let fieldValue = {};
      // Object.keys(field_account).forEach((val, key) => {
      //   if (req.body[val]) {
      //     if (val == "polres_id" || val == "id_vehicle" || val == "id_vip") {
      //       fieldValue[val] = AESDecrypt(req.body[val], {
      //         isSafeUrl: true,
      //         parseMode: "string",
      //       });
      //     } else {
      //       fieldValue[val] = req.body[val];
      //     }
      //   }
      // });

      // await Account.update(fieldValue, {
      //   where: {
      //     id: AESDecrypt(req.params.id, {
      //       isSafeUrl: true,
      //       parseMode: "string",
      //     }),
      //   },
      //   transaction: transaction,
      // });
      // await transaction.commit();
      // response(res, true, "Succeed", null);

      let fieldValue = {};
      let fieldValueOfficer = {};
      Object.keys(field_account).forEach((val, key) => {
        if (req.body[val]) {
          if (
            val == "id_vehicle" ||
            val == "id_country" ||
            val == "leader_team"
          ) {
            fieldValue[val] = AESDecrypt(req.body[val], {
              isSafeUrl: true,
              parseMode: "string",
            });
          } else if (val == "officers" || val == "vehicles") {
            fieldValue[val] = JSON.parse(req.body[val]);
          } else {
            fieldValue[val] = req.body[val];
          }
        } else {
          fieldValue["id_country"] = null;
        }
      });

      Account.update(
        fieldValue,
        {
          where: {
            id: AESDecrypt(req.params.id, {
              isSafeUrl: true,
              parseMode: "string",
            }),
          },
        }
        // {
        //   transaction,
        // }
      )
        .then(async (op) => {
          if (fieldValue["officers"]) {
            for (let i = 0; i < fieldValue["officers"].length; i++) {
              var officer_id = AESDecrypt(fieldValue["officers"][i], {
                isSafeUrl: true,
                parseMode: "string",
              });
              // return response(res, true, "Succeed", officer_id);

              AccountProfile.destroy({
                where: {
                  account_id: AESDecrypt(req.params.id, {
                    isSafeUrl: true,
                    parseMode: "string",
                  }),
                  officer_id: officer_id,
                },
              })
                .then(async (op) => {
                  fieldValueOfficer = {};
                  fieldValueOfficer["account_id"] = AESDecrypt(req.params.id, {
                    isSafeUrl: true,
                    parseMode: "string",
                  });
                  fieldValueOfficer["officer_id"] = AESDecrypt(
                    fieldValue["officers"][i],
                    {
                      isSafeUrl: true,
                      parseMode: "string",
                    }
                  );

                  if (
                    fieldValue["vehicles"] ||
                    fieldValue["vehicles"].length > 0
                  ) {
                    fieldValueOfficer["vehicle_id"] = AESDecrypt(
                      fieldValue["vehicles"][i],
                      {
                        isSafeUrl: true,
                        parseMode: "string",
                      }
                    );
                  }
                  console.log({ fieldValueOfficer });
                  await AccountProfile.create(fieldValueOfficer);
                  // await transaction.commit();
                })
                .catch(async (err) => {
                  // await transaction.rollback();
                  console.log(err);
                });
            }

            // await transaction.commit();
            response(res, true, "Succeed", null);
          } else {
            response(res, true, "Succeed", null);
          }
        })
        .catch(async (err) => {
          console.log(err);
          // await transaction.rollback();
        });
    } catch (e) {
      // await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
  static delete = async (req, res) => {
    const transaction = await db.transaction();
    try {
      await Account.destroy(
        {
          where: {
            id: AESDecrypt(req.body.id, {
              isSafeUrl: true,
              parseMode: "string",
            }),
          },
        },
        {
          transaction: transaction,
        }
      );
      await transaction.commit();
      response(res, true, "Succeed", null);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };
};
