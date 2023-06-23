const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
const User = require("../model/user");
const UserRole = require("../model/user_role");
const OperationProfile = require("../model/operation_profile");
const db = require("../config/database");
const Account = require("../model/account");

const Polda = require("../model/polda");
const Polres = require("../model/polres");

// const Account_Profile_Polda = require("../model/test_account_profile_polda");
// const Account_Profile_Polres = require("../model/test_account_profile_polres");

Polres.belongsTo(Polda, { foreignKey: "polda_id" });

const fieldData = {
  operation_id: null,
  username: null,
  status_verifikasi: 0,
  email: null,
  role_id: null,
  password: null,
  // token_notif: null,
};

// User.hasOne(Account_Profile_Polda, {
//   foreignKey: "user_id",
//   as: "polda_profile",
// });

// User.hasOne(Account_Profile_Polres, {
//   foreignKey: "user_id",
//   as: "polres_profile",
// });

// Account_Profile_Polda.belongsTo(Polda, {
//   foreignKey: "polda_id",
//   as: "polda",
// });

// Account_Profile_Polres.belongsTo(Polres, {
//   foreignKey: "polres_id",
//   as: "polres",
// });
module.exports = class UserController {
  static get = async (req, res) => {
    response(
      res,
      true,
      "Succeed",
      await User.findAll({
        attributes: {
          exclude: ["role_id"],
        },
        // include: {
        //   model: UserRole,
        //   // attributes: ["id"],
        // },
        include: {
          model: UserRole,
          as: "user_role",
        },
      })
    );
  };
  static getLoggedUser = async (req, res) => {
    let GetData = await User.findOne({
      where: {
        id: AESDecrypt(req.auth.uid, {
          isSafeUrl: true,
          parseMode: "string",
        }),
      },
      attributes: {
        exclude: ["role_id"],
      },
      include: [
        {
          model: UserRole,
          attributes: ["id", "name"],
          required: false,
        }
        // {
        // model: OperationProfile,
        // attributes: ["id", "name"],
        // required: false,
        // },
      ],
    });
    // console.log(GetData);
    response(res, true, "Succeed", GetData);
  };
  static getLoggedUserMobile = async (req, res) => {
    try {
      const idAccount = AESDecrypt(req.auth.uid, {
        isSafeUrl: true,
        parseMode: "string",
      });
      const idOfficer = AESDecrypt(req.auth.officer, {
        isSafeUrl: true,
        parseMode: "string",
      });
      let [getProfile] = await db
        .query(
          `SELECT 
          a.token_fcm,
          a.token_track,
          a.device_user,
          c.name_officer,
          c.photo_officer,
          c.nrp_officer,
          c.rank_officer,
          c.structural_officer,
          c.pam_officer,
          c.phone_officer,
          c.status_officer,
          b.name_account,
          b.leader_team,
          v.no_vehicle,
          v.type_vehicle,
          v.brand_vehicle,
          v.ownership_vehicle
        FROM token_track a
        INNER JOIN account b ON a.team_id=b.id
        INNER JOIN vehicle v ON v.id=b.id_vehicle
        INNER JOIN officer c ON a.nrp_user=c.nrp_officer
        where team_id=${idAccount} AND c.id=${idOfficer}
      `
        )
        .then(([results, metadata]) => results);
      let [account_tim] = await db.query(`
              SELECT o.* FROM trx_account_officer tao 
              INNER JOIN officer o ON tao.officer_id=o.id
              WHERE tao.officer_id=${idOfficer}
          `);
      return response(res, true, "Succeed", {
        ...getProfile,
        officer: account_tim,
      });
    } catch (error) {
      response(res, false, "Failed", error.message);
    }
  };
  static add = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValue = {};
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          if (val == "polres_id") {
            fieldValue[val] = AESDecrypt(req.body[val], {
              isSafeUrl: true,
              parseMode: "string",
            });
          } else {
            fieldValue[val] = req.body[val];
          }
        }
      });
      await User.create(fieldValue, { transaction: transaction });
      await transaction.commit();
      response(res, true, "Succeed", null);
    } catch (e) {
      await transaction.rollback();
      response(res, false, "Failed", e.message);
    }
  };

  static edit = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValue = {};
      Object.keys(fieldData).forEach((val, key) => {
        if (req.body[val]) {
          if (val == "polres_id") {
            fieldValue[val] = AESDecrypt(req.body[val], {
              isSafeUrl: true,
              parseMode: "string",
            });
          } else {
            fieldValue[val] = req.body[val];
          }
        }
      });
      await User.update(fieldValue, {
        where: {
          id: AESDecrypt(req.params.id, {
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
  static delete = async (req, res) => {
    const transaction = await db.transaction();
    try {
      let fieldValue = {};
      fieldValue["deleted_at"] = new Date();
      await User.update(fieldValue, {
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
  static hardDelete = async (req, res) => {
    const transaction = await db.transaction();
    try {
      await User.destroy({
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
};
