const { AESDecrypt, JWTVerify } = require("../lib/encryption");
const TokenTrackNotif = require("../model/token_track_notif");
const { TrackG20 } = require("../model/tracking/g20");
const moment = require("moment");
const LocationTrackController = require("../controller/track/locationTrack");
const Account = require("../model/account");
const Vehicle = require("../model/vehicle");
// const Vip = require("../model/vip");
const Country = require("../model/country");
// const Officer = require("../model/officer");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const { Server } = require("socket.io");
const { io: ioClient } = require("socket.io-client");
const dateParse = (date) => {
  const aaa = moment.tz(date, "Etc/GMT-5");
  return aaa.format("YYYY-MM-DD");
};
const socketInstace = (server) => {
  const io = require("socket.io")(server, {
    cors: "*",
    //pingTimeout: 60000,
    // path: "/api/",
  }).use(async function (socket, next) {
    // authenticate jwt for socket connection

    try {
      const { username, password, user_nrp, type } = socket.handshake.query;
      if (type == "Admin") {
        const user = await User.findOne({
          where: {
            username: username,
            status_verifikasi: 1,
          },
        });
        if (user) {
          if (bcrypt.compareSync(password, user.password)) {
            next();
          } else {
            next(new Error("Authentication error"));
          }
        } else {
          next(new Error("Authentication error"));
        }
      } else if (type == "Officier") {
        try {
          if (socket.handshake.query && socket.handshake.query.user_nrp) {
            let dataAccount = await Account.findOne({
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
                  as: "officers",
                  required: true,
                  where: {
                    nrp_officer: socket.handshake.query.user_nrp,
                  },
                },
              ],
              where: {
                name_account: username,
              },
            });
            let dataOfficer = await Officer.findOne({
              where: {
                nrp_officer: user_nrp,
              },
            });
            socket.handshake.query["dataAccount"] = dataAccount;
            socket.handshake.query["dataOfficer"] = dataOfficer;
            if (dataAccount) {
              if (bcrypt.compareSync(password, dataAccount.password)) {
                const aaaaa = await TokenTrackNotif.update(
                  {
                    token_track: socket.id,
                  },
                  {
                    where: {
                      team_id: AESDecrypt(dataAccount.id, {
                        isSafeUrl: true,
                        parseMode: "string",
                      }),
                      nrp_user: user_nrp,
                    },
                  }
                );
                next();
              } else {
                return next(new Error("Authentication error"));
              }
            }
          } else {
            next(new Error("Authentication error"));
          }
        } catch (error) {
          next(new Error("Authentication error"));
        }
      } else {
        next();
      }
      // else {
      //   next();
      // }
    } catch (error) {
      console.log({ error });
    }
  });
  io.on("connection", async (socket) => {
    io.emit("message", "test");
    socket.on("trackingUser", async function (coordinate) {
      const { username, password, user_nrp, type, dataAccount, dataOfficer } =
        socket.handshake.query;
      let officerData = await Officer.findOne({
        where: {
          id: parseInt(dataAccount?.leader_team),
        },
      });
      let noTelpon = dataOfficer?.phone_officer;
      let noDepan = noTelpon ? noTelpon.substring(0, 2) : "";
      if (noDepan === "62") {
        noTelpon = noTelpon;
      } else if (noDepan === "08") {
        noTelpon = "62" + noTelpon.substring(1);
      } else if (noDepan === "+6") {
        noTelpon = noTelpon.substring(1);
      } else {
        noTelpon = noTelpon;
      }
      // console.log();

      const dataOfficerOke = {
        id_user: AESDecrypt(dataAccount.id, {
          isSafeUrl: true,
          parseMode: "string",
        }),
        latitude: coordinate.lat,
        longitude: coordinate.lon,
        status_login: coordinate?.status_login
          ? 1
          : coordinate.status_login == undefined
          ? 1
          : 0,
        pam_officer: officerData.dataValues.pam_officer, // [ketua tim]
        name_account: dataAccount.dataValues.name_account,
        id_officer: AESDecrypt(dataOfficer.id, {
          isSafeUrl: true,
          parseMode: "string",
        }),
        name_team: officerData.dataValues.name_officer, // [ketua tim]
        name_officer: dataOfficer.name_officer,
        photo_officer: dataOfficer.photo_officer,
        rank_officer: dataOfficer.rank_officer,
        nrp_user: dataOfficer.nrp_officer,
        color_marker: dataOfficer.color_marker,
        handphone: noTelpon,
        photo_officer_telp_biasa: "+" + noTelpon,
        name_country:
          dataAccount.country != null ? dataAccount.country.name_country : "-", // Delegasi
        photo_country:
          dataAccount.country != null
            ? `http://k3ig20korlantas.id:3001/uploads/country/${dataAccount.country.photo_country}`
            : "-", // Foto Delegasi

        no_vehicle: dataAccount.vehicle.no_vehicle, // [plat nomor]
        type_vehicle: dataAccount.vehicle.type_vehicle, // ["motor"]
        fuel_vehicle: dataAccount.vehicle.fuel_vehicle, //
        back_number_vehicle: dataAccount.vehicle.back_number_vehicle, //
        date: moment().format("YYYY-MM-DD"),
        // dateOnly: moment().format("YYYY-MM-DD"),
        dateOnly: dateParse(moment()),
      };
      console.log({ dataOfficerOke });
      io.emit("trackme", dataOfficerOke);

      socket.broadcast.emit("sendToAdminMobile", dataOfficerOke);
      socket.broadcast.emit("sendToAdminMobileNew", dataOfficerOke);
      io.emit("sendToAdminMobileNew2", dataOfficerOke);
      socket.broadcast.emit("sendToAdmin", dataOfficerOke);

      await TrackG20.create(dataOfficerOke);
      // const sendToBranchSocket = ioClient("http://103.163.139.100:3005/", {
      //   transports: ["websocket"],
      //   // socketRef.current = io('http://10.10.7.40:3001/', {
      //   path: "/socket.io",
      //   query: {
      //     type: "socket",
      //   },
      // });

      // sendToBranchSocket.emit("dariAPKLama", dataOfficerOke);

      // sendToBranchSocket.emit("sendToAdminMobile", dataOfficerOke);
      // sendToBranchSocket.emit("sendToAdminMobileNew", dataOfficerOke);
      // sendToBranchSocket.emit("sendToAdminMobileNew2", dataOfficerOke);
      // sendToBranchSocket.emit("sendToAdmin", dataOfficerOke);
      // sendToBranchSocket.emit("sendToAdminMobileNew", dataOfficerOke);
      // sendToBranchSocket.emit("sendToAdminMobileNew2", dataOfficerOke);
      // sendToBranchSocket.emit("sendToAdmin", dataOfficerOke);
    });
  });
};

module.exports = socketInstace;
