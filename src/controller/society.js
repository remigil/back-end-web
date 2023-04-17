const db = require("../config/database");
const response = require("../lib/response");
const Society = require("../model/society");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const { AESDecrypt } = require("../lib/encryption");
const readXlsxFile = require("read-excel-file/node");
const pagination = require("../lib/pagination-parser");
// const tesseract = require("tesseract.js");
const { createWorker } = require("tesseract.js");

const fs = require("fs");

const field_account = {
  nik: null,
  person_name: null,
  email: null,
  no_hp: null,
  password: null,
  nationality: null,
  no_sim: null,
  jenis_kelamin: null,
  tanggal_lahir: null,
  foto: null,
  status_verifikasi: null,
  date_of_birth: null,
};

module.exports = class SocietyController {
  static get = async (req, res) => {
    try {
      const {
        length = 10,
        start = 0,
        serverSide = null,
        search = null,
        filter = [],
        filterSearch = [],
        order = 0,
        orderDirection = "asc",
      } = req.query;
      const modelAttr = Object.keys(Society.getAttributes());
      let getDataRules = { where: null };
      if (serverSide?.toLowerCase() === "true") {
        const resPage = pagination.getPagination(length, start);
        getDataRules.limit = length;
        getDataRules.offset = start;
      }
      if (order <= modelAttr.length) {
        getDataRules.order = [[modelAttr[order], orderDirection.toUpperCase()]];
      }
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
            filters[fKey] = filterSearch[index];
          }
        });
        getDataRules.where = {
          ...getDataRules.where,
          ...filters,
        };
      }
      const data = await Society.findAll(getDataRules);
      const count = await Society.count({
        where: getDataRules?.where,
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
      const data = await Society.findOne({
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

  static getbySocietyId = async (req, res) => {
    try {
      const data = await Society.findOne({
        where: {
          id: AESDecrypt(req.auth.uid, {
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
    var foto = "";

    try {
      let fieldValue = {};
      Object.keys(field_account).forEach((val, key) => {
        if (req.body[val]) {
          if (val == "foto") {
            let path = req.body.foto.filepath;
            let file = req.body.foto;
            let fileName = file.originalFilename;
            fs.renameSync(
              path,
              "./public/uploads/society/" + fileName,
              function (err) {
                if (err) throw err;
              }
            );
            fieldValue[val] = fileName;
          } else {
            fieldValue[val] = req.body[val];
          }
        }
      });
      fieldValue["status_verifikasi"] = 0;

      await Society.create(fieldValue, {
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", req.body.person_name);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static edit = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValue = {};
      Object.keys(field_account).forEach((val, key) => {
        if (req.body[val]) {
          if (val == "foto") {
            let path = req.body.foto.filepath;
            let file = req.body.foto;
            let fileName = file.originalFilename;
            fs.renameSync(
              path,
              "./public/uploads/society/" + fileName,
              function (err) {
                if (err) throw err;
              }
            );
            fieldValue[val] = fileName;
          } else {
            fieldValue[val] = req.body[val];
          }
        }
      });
      await Society.update(fieldValue, {
        where: {
          id: AESDecrypt(req.params.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", req.body.person_name);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static editprofil = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValue = {};
      Object.keys(field_account).forEach((val, key) => {
        if (req.body[val]) {
          if (val == "foto") {
            let path = req.body.foto.filepath;
            let file = req.body.foto;
            let fileName = file.originalFilename;
            fs.renameSync(
              path,
              "./public/uploads/society/" + fileName,
              function (err) {
                if (err) throw err;
              }
            );
            fieldValue[val] = fileName;
          } else {
            fieldValue[val] = req.body[val];
          }
        }
      });

      await Society.update(fieldValue, {
        where: {
          id: AESDecrypt(req.auth.uid, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", fieldValue);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static editStatus = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let idSociety = AESDecrypt(req.params.id, {
        isSafeUrl: true,
        parseMode: "string",
      });
      const getData = await Society.findOne({
        where: {
          id: idSociety,
        },
      });
      let fieldValue = {};
      if (getData.status_verifikasi == 1) {
        Object.keys(field_account).forEach((val, key) => {
          fieldValue["status_verifikasi"] = 2;
        });
        await Society.update(fieldValue, {
          where: {
            id: idSociety,
          },
          transaction: transaction,
        });
        await transaction.commit();
        response(res, true, "Succeed", fieldValue);
      } else if (getData.status_verifikasi == 2) {
        Object.keys(field_account).forEach((val, key) => {
          fieldValue["status_verifikasi"] = 1;
        });
        await Society.update(fieldValue, {
          where: {
            id: idSociety,
          },
          transaction: transaction,
        });
        await transaction.commit();
        response(res, true, "Succeed", fieldValue);
      }
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static ScanKtp = async (req, res) => {
    try {
      let path = req.body.ktp.filepath;
      let ktp = req.body.ktp;
      let fileName = ktp.originalFilename;
      fs.renameSync(path, "./public/uploads/ktp/" + fileName, function (err) {
        if (err) response(res, false, "Error", err.message);
      });
      const worker = createWorker({
        logger: (m) => console.log(m), // Add logger here
      });
      (async () => {
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const {
          data: { text },
        } = await worker.recognize("./public/uploads/ktp/" + fileName);
        // console.log(text);
        // let asd = text.split("\n");
        // let nik = asd[2].split(" ");
        // let person_name = asd[3].split(" ");
        // let date_of_birth = asd[4].split(" ");
        // let gender = asd[5].split(" ");
        // let address = asd[6].split(" ");
        // let address1 = asd[7].split(" ");
        // let address2 = asd[8].split(" ");
        // let address3 = asd[9].split(" ");
        // let religion = asd[10].split(" ");
        // let status = asd[11].split(" ");
        // let profession = asd[12].split(" ");
        // let nationality = asd[13].split(" ");
        // let validity_period = asd[14].split(" ");

        // person_name.splice(0, 2);
        // status.splice(0, 3);
        // validity_period.splice(0, 4);
        // let nama = person_name.join(" ");
        // let stat = status.join(" ");
        // let berlaku = validity_period.join(" ");
        // let combineAddress = [].concat(
        //   address[1],
        //   address1,
        //   address2,
        //   address3
        // );
        // let alamat = combineAddress.join(" ");
        // let xx = {
        //           nik: nik[2] || null,
        //           person_name: nama || null,
        //           date_of_birth: date_of_birth[3] || null,
        //           gender: gender[3] || null,
        //           address: alamat || null,
        //           religion: religion[1] || null,
        //           status: stat || null,
        //           profession: profession[2] || null,
        //           nationality: nationality[2] || null,
        //           validity_period: berlaku || null,
        // };

        response(res, true, "Succeed", text);
        await worker.terminate();
      })();
    } catch (error) {
      // await t.rollback();
      response(res, false, "Failed", error.message);
    }

    // const transaction = await db.transaction();
    // try {
    //   let fieldValue = {};
    //   Object.keys(field_account).forEach((val, key) => {
    //     if (req.body[val]) {
    //       fieldValue[val] = req.body[val];
    //     }
    //   });
    //   await Society.update(fieldValue, {
    //     where: {
    //       id: AESDecrypt(req.auth.uid, {
    //         isSafeUrl: true,
    //         parseMode: "string",
    //       }),
    //     },
    //     transaction: transaction,
    //   });
    //   await transaction.commit();
    //   response(res, true, "Succeed", req.body.person_name);
    // } catch (e) {
    //   await transaction.rollback();
    //   response(res, false, "Failed", e.message);
    // }
  };

  static delete = async (req, res) => {
    const transaction = await db.transaction();
    try {
      await Society.destroy({
        where: {
          id: AESDecrypt(req.body.id, {
            isSafeUrl: true,
            parseMode: "string",
          }),
        },
        transaction: transaction,
      });
      await transaction.commit();
      response(res, true, "Succeed", null);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static getLoggedUserMobile = async (req, res) => {
    try {
      const idAccount = AESDecrypt(req.auth.uid, {
        isSafeUrl: true,
        parseMode: "string",
      });

      // console.log(idAccount);
      let getProfile = await Society.findOne({
        where: {
          id: idAccount,
        },
      });
      return response(res, true, "Succeed", {
        getProfile,
      });
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };
};

