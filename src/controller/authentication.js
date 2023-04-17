const response = require("../lib/response");
const User = require("../model/user");
const bcrypt = require("bcrypt");
const { JWTEncrypt, JWTVerify, AESDecrypt } = require("../lib/encryption");
const moment = require("moment");
const TokenTrackNotif = require("../model/token_track_notif");
// const Officer = require("../model/officer");
const Account = require("../model/account");
const fs = require("fs");
const { default: readXlsxFile } = require("read-excel-file/node");
const { replace } = require("lodash");
const ReportLogin = require("../model/reportLogin");
const { getPagination } = require("../lib/pagination-parser");

class Authentication {
  static login = async (req, res) => {
    const user = await User.findOne({
      where: {
        username: req.body.username,
        status_verifikasi: 1,
      },
    });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const accessToken = JWTEncrypt({
          uid: user.id,
          timestamp: moment().unix(),
        });
        return response(res, true, "Login succeed", {
          accessToken,
        });
      }
    }
    response(res, false, "Login failed, please try again!", null, 401);
  };
  static loginMobile = async (req, res) => {
    try {
      const { team, nrp_user, device_user } = req.body;
      const account = await Account.findOne({
        where: {
          name_account: team,
        },
        include: [
          {
            model: Officer,
            as: "officers",
            required: true,
            where: {
              nrp_officer: nrp_user,
            },
          },
        ],
      });
      if (account == null) {
        return response(
          res,
          false,
          "Akun Anda Tidak Terdaftar di database kami",
          401
        );
      }

      let chcekDeviceUser = await TokenTrackNotif.findOne({
        where: {
          device_user: device_user,
        },
      });
      let nrpDeviceUser = await TokenTrackNotif.findOne({
        where: {
          nrp_user: nrp_user,
        },
      });

      if (
        bcrypt.compareSync(req.body.password, account.password) ||
        bcrypt.compareSync(req.body.password, account.officers[0].password)
      ) {
        if (chcekDeviceUser && chcekDeviceUser.nrp_user != nrp_user) {
          return response(
            res,
            false,
            "Data Anda Telah ada di device lainnya, silahkan login menggunakan device sebelumnya"
          );
        } else if (!chcekDeviceUser && !nrpDeviceUser) {
          await TokenTrackNotif.create({
            nrp_user: nrp_user,
            device_user: device_user,
            polda_id: account.officers[0].polda_id,
            team_id: AESDecrypt(account.id, {
              isSafeUrl: true,
              parseMode: "string",
            }),
          });
        } else if (!chcekDeviceUser && nrpDeviceUser.nrp_user == nrp_user) {
          return response(
            res,
            false,
            "Data Anda Telah ada di device lainnya, silahkan login menggunakan device sebelumnya"
          );
        }
        if (!account.officers[0].status_officer) {
          return response(res, false, "Anda tidak ditugas pada operasi ini");
        }
        const accessToken = JWTEncrypt({
          uid: account.id,
          nrp_user: nrp_user,
          officer: account.officers[0].id,
          timestamp: moment().unix(),
        });
        return response(res, true, "Login succeed", {
          accessToken,
          // account,
        });
      } else {
        response(
          res,
          false,
          "Login failed, please check your Password!",
          null,
          401
        );
      }
    } catch (error) {
      response(res, false, "Login failed, please try again!", error.message);
    }
  };
  static testCaseloginMobile = async (req, res) => {
    try {
      // let path = req.body.file.filepath;
      // let file = req.body.file;
      // let fileName = file.originalFilename;
      // fs.renameSync(path, "./public/upload/" + fileName, function (err) {
      //   if (err) response(res, false, "Error", err.message);
      // });
      // let readExcell = await readXlsxFile("./public/upload/" + fileName);
      // let listAccount = [];
      // let index = 0;
      // for (const iterator of readExcell) {
      //   if (index == 0) {
      //     if (
      //       iterator[0] != "nrp" &&
      //       iterator[1] != "account" &&
      //       iterator[2] != "pasword"
      //     ) {
      //       return response(res, false, "Format Tidak Sesuai", { iterator });
      //     }
      //   } else {
      //     listAccount.push({
      //       nrp_user: iterator[0],
      //       team: iterator[1],
      //       password: iterator[2],
      //       device_user: "TestCase" + index,
      //     });
      //   }
      //   index++;
      // }
      let indicatorLoginBerhasil = [];
      let indicatorLoginGagal = [];
      const { limit, page } = req.query;
      const resPage = getPagination(parseInt(limit), parseInt(page));
      console.log({ resPage });
      let dataOfficer = await Officer.findAndCountAll({
        limit: resPage.limit,
        offset: resPage.offset,
      });

      for (const iterator of dataOfficer.rows) {
        let account = await Account.findOne({
          where: {
            name_account: replace(iterator.nrp_officer, " ", ""),
          },
          include: [
            {
              model: Officer,
              as: "officers",
              required: true,
              where: {
                nrp_officer: replace(iterator.nrp_officer, " ", ""),
              },
            },
          ],
        });
        if (account == null) {
          indicatorLoginGagal.push({
            nrp_user: replace(iterator.nrp_officer, " ", ""),
            account_tidak_ditemukan: true,
          });
        } else {
          let chcekDeviceUser = await TokenTrackNotif.findOne({
            where: {
              nrp_user: replace(iterator.nrp_officer, " ", ""),
              // device_user: "test1234--63213827xxxx",
            },
          });
          let nrpDeviceUser = await TokenTrackNotif.findOne({
            where: {
              nrp_user: replace(iterator.nrp_officer, " ", ""),
            },
          });

          if (bcrypt.compareSync("g20", account?.password)) {
            if (
              chcekDeviceUser &&
              chcekDeviceUser.nrp_user != replace(iterator.nrp_officer, " ", "")
            ) {
              indicatorLoginGagal.push({
                nrp_user: replace(iterator.nrp_officer, " ", ""),

                device_sudah_ada: true,
              });
            } else if (!chcekDeviceUser && !nrpDeviceUser) {
              indicatorLoginBerhasil.push({
                nrp_user: replace(iterator.nrp_officer, " ", ""),
              });
            } else if (
              !chcekDeviceUser &&
              nrpDeviceUser.nrp_user == replace(iterator.nrp_officer, " ", "")
            ) {
              indicatorLoginGagal.push({
                nrp_user: iterator.nrp_officer,

                device_sudah_ada: true,
              });
            }
          } else {
            // await Account.update(
            //   {
            //     password: "g20",
            //   },
            //   {
            //     where: {
            //       name_account: replace(iterator.team, " ", ""),
            //     },
            //   }
            // );
            indicatorLoginGagal.push({
              nrp_user: iterator.nrp_user,
              device_user: iterator.device_user,
              polda_id: account.officers[0].polda_id,
              team_id: AESDecrypt(account.id, {
                isSafeUrl: true,
                parseMode: "string",
              }),
              password_salah: true,
            });
          }
        }
      }

      response(res, true, "Login succeed", {
        indicatorLoginBerhasil,
        indicatorLoginGagal,
        dataOfficer,
      });
    } catch (error) {
      console.log({ error });
      return res.json({
        error,
      });
      // response(res, false, "Login failed, please try again!", error.message);
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
}

module.exports = Authentication;
