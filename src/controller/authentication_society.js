const response = require("../lib/response");
const db = require("../config/database");
const Society = require("../model/society");
const Token = require("../model/token");
const bcrypt = require("bcrypt");
const {
  JWTEncrypt,
  JWTVerify,
  AESDecrypt,
  AESEncrypt,
} = require("../lib/encryption");
const moment = require("moment");
const { emailSendVerif } = require("../lib/emailLibrary");
const { Op } = require("sequelize");

const fieldData = {
  nik: null,
  person_name: null,
  email: null,
  no_hp: null,
  password: null,
  no_sim: null,
  status_verifikasi: null,
};
// const client = require("twilio")(accountSid, authToken);

class AuthenticationSociety {
  static login = async (req, res) => {
    const society = await Society.findOne({
      where: {
        no_hp: req.body.no_hp,
        status_verifikasi: 1,
      },
    });
    if (society) {
      if (bcrypt.compareSync(req.body.password, society.password)) {
        const accessToken = JWTEncrypt({
          uid: society.id,
          timestamp: moment().unix(),
        });
        return response(res, true, "Login succeed", {
          accessToken,
        });
      } else {
        response(res, false, "Login failed, please try again!", null, 401);
      }
    } else {
      response(res, false, "Login failed, please try again!", null, 401);
    }
  };
  static test = async (req, res, next) => {
    try {
      let aaa = emailSendVerif(req, res, next);
      // console.log({ aaa });
    } catch (error) {
      // console.log({ error });
    }
  };
  static loginMobile = async (req, res) => {
    try {
      const { no_hp } = req.body;
      let duadigit = no_hp.substring(0, 2);
      let angkaterakhir = no_hp.substring(2, 15);

      let nohp = no_hp;
      if (duadigit === "08") {
        // console.log({ duadigit });
        nohp = "628" + angkaterakhir;
      } else if (duadigit != "62") {
        nohp = "62" + no_hp;
      }
      // let nohp =
      //   duadigit === "08" || duadigit !== "62"
      //     ? "628" + angkaterakhir
      //     : "62" + no_hp;

      // console.log({ nohp, duadigit });
      const society = await Society.findOne({
        where: {
          no_hp: nohp,
        },
      });

      if (society == null) {
        return response(
          res,
          false,
          "Akun anda tidak terdaftar di database kami",
          null
        );
      } else if (society.status_verifikasi === 0) {
        return response(res, false, "Akun anda belum terverifikasi", null);
      } else if (society.status_verifikasi === 1) {
        if (bcrypt.compareSync(req.body.password, society.password)) {
          const accessToken = JWTEncrypt({
            uid: society.id,
            nik: society.nik,
            person_name: society.person_name,
            email: society.email,
            no_hp: society.no_hp,
            nationality: society.nationality,
            // foto: society.foto,
            timestamp: moment().unix(),
          });
          return response(res, true, "Login succeed", {
            accessToken,
          });
        } else {
          return response(res, false, "Password Anda salah", null);
        }
      }
    } catch (error) {
      response(res, false, "Login failed, please try again!", error.message);
    }
  };
  static validateLogin = async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const verify = JWTVerify(authHeader);
      return response(res, true, "Login succeed", {
        ...verify,
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };

  static registerSociety = async (req, res) => {
    const transaction = await db.transaction();
    try {
      var Now = new Date();
      const { no_hp, email } = req.body;
      var ExpiredDate = new Date(Now.getTime() + 20 * 60000);
      // let otp = 123456;
      let duadigit = no_hp.substring(0, 2);
      let angkaterakhir = no_hp.substring(2, 15);
      let nohp =
        duadigit == "08" || duadigit != "62"
          ? "628" + angkaterakhir
          : "62" + angkaterakhir;
      // console.log(nohp);

      let otp = Math.floor(100000 + Math.random() * 900000);
      let otpp = otp.toString();
      let cekNumber = await Society.findOne({
        where: {
          [Op.or]: {
            no_hp: nohp,
            email: email.toLowerCase(),
          },
          deleted_at: null,
        },
      });
      let fieldValueData = {};
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          fieldValueData[val] = req.body[val];
        } else {
          fieldValueData[val] = null;
        }
      });
      fieldValueData["no_hp"] = nohp;
      fieldValueData["status_verifikasi"] = 0;
      if (
        no_hp == "" ||
        email == "" ||
        fieldValueData["nik"] == null ||
        fieldValueData["person_name"] == null ||
        fieldValueData["password"] == null
      ) {
        response(
          res,
          false,
          (no_hp == ""
            ? "No Hp"
            : email == ""
            ? "Email"
            : fieldValueData["nik"] == null
            ? "NIK"
            : fieldValueData["person_name"] == null
            ? "Nama"
            : "Password") + " Tidak Boleh Kosong",
          null
        );
      } else {
        if (!cekNumber) {
          await Token.create(
            {
              token: AESEncrypt(otpp),
              token_created_date: new Date(),
              token_expired_date: ExpiredDate,
              no_hp: nohp,
              typeToken: 1,
            },
            { transaction: transaction }
          );
          let op = await Society.create(fieldValueData, {
            transaction: transaction,
          });
          let aaa = emailSendVerif(req, res, null, {
            email: email.toLowerCase(),
            code: otpp,
            expired: ExpiredDate,
            // uuid: op.id,
          });
          // console.log({ aaa });
          await transaction.commit();
          response(res, true, "Succeed", op);
        } else {
          response(
            res,
            false,
            (cekNumber.no_hp == nohp.toString() ? "No Hp" : "Email") +
              " Sudah Terdaftar",
            null
          );
        }
      }
    } catch (e) {
      await transaction.rollback();
      // console.log({ e });
      response(res, false, "Failed", e.message);
    }
  };

  static resendToken = async (req, res) => {
    const transaction = await db.transaction();
    try {
      const { no_hp } = req.body;

      var Now = new Date();
      var ExpiredDate = new Date(Now.getTime() + 20 * 60000);
      // let otp = 123456;
      let otp = Math.floor(100000 + Math.random() * 900000);
      let otpp = otp.toString();
      let duadigit = no_hp.substring(0, 2);
      let angkaterakhir = no_hp.substring(2, 15);

      let nohp =
        duadigit == "08" || duadigit != "62"
          ? "628" + angkaterakhir
          : "62" + angkaterakhir;
      // console.log(nohp);
      let cekData = await Society.findOne({
        where: {
          no_hp: nohp,
          deleted_at: null,
        },
      });
      if (cekData) {
        let updateToken = await Token.update(
          // await Token.update(
          {
            token: AESEncrypt(otpp),
            token_created_date: new Date(),
            token_expired_date: ExpiredDate,
          },
          {
            where: { no_hp: nohp, typeToken: 1 },
          },
          { transaction: transaction }
        );
        emailSendVerif(req, res, null, {
          email: cekData.email,
          code: otpp,
          // uuid: op.id,
        });
        await transaction.commit();
        response(res, true, "Succeed", updateToken);
      } else {
        response(res, false, "Data tidak ditemukan", null);
      }
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static ValidateRegister = async (req, res) => {
    try {
      const { no_hp, token } = req.body;
      let duadigit = no_hp.substring(0, 2);
      let angkaterakhir = no_hp.substring(2, 15);

      let nohp =
        duadigit == "08" || duadigit != "62"
          ? "628" + angkaterakhir
          : "62" + angkaterakhir;
      // console.log(nohp);
      const getToken = await Token.findOne({
        where: {
          no_hp: nohp,
          typeToken: 1,
        },
        order: [["id", "DESC"]],
      });

      var Now = new Date();
      if (new Date(Now.getTime()) >= new Date(getToken.token_expired_date)) {
        response(res, false, "Token expired", null);
      } else {
        if (token == AESDecrypt(getToken.token)) {
          await Society.update(
            {
              status_verifikasi: 1,
            },
            {
              where: {
                no_hp: nohp,
              },
            }
          );
          await Token.update(
            {
              typeToken: 0,
            },
            {
              where: {
                no_hp: nohp,
              },
            }
          );
          return response(res, true, "Register succeed");
        } else {
          response(res, false, "Register failed!", null, 401);
        }
      }
    } catch (error) {
      response(res, false, "Register failed!!", error.message);
    }
  };
}
module.exports = AuthenticationSociety;
