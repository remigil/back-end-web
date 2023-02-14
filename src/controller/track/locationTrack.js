// const moment = require("moment");
// const db = require("../../config/database");
// const { AESDecrypt } = require("../../lib/encryption");
// const response = require("../../lib/response");
// const Account = require("../../model/account");
// const Country = require("../../model/country");
// const Officer = require("../../model/officer");
// const { TrackG20 } = require("../../model/tracking/g20");
// const Vehicle = require("../../model/vehicle");
// const dateParse = (date) => {
//   const aaa = moment.tz(date, "Etc/GMT-5");
//   return aaa.format("YYYY-MM-DD");
// };
// const { TrackG20Update } = require("../../model/tracking/g20Update");
// module.exports = class LocationTrackController {
//   static get = async (req, res) => {
//     try {
//       const { date, name_officer = null } = req.query;
//       const today = dateParse(moment());
//       const endDateToday = moment(today).endOf("day").toDate();
//       let getData = { where: null };
//       if (name_officer != null) {
//         getData.name_officer = name_officer;
//         getData.date = today;
//       } else {
//         getData.date = today;
//       }
//       let getTrack = await TrackG20.aggregate(
//         [
//           {
//             $match: {
//               dateOnly: today,
//             },
//           },
//           {
//             $group: {
//               _id: "$nrp_user",
//               max_date: {
//                 $max: "$updated_at",
//               },
//               records: {
//                 $push: "$$ROOT",
//               },
//             },
//           },
//           {
//             $project: {
//               nrp_user: {
//                 $filter: {
//                   input: "$records",
//                   as: "records",
//                   cond: {
//                     $eq: ["$$records.updated_at", "$max_date"],
//                   },
//                 },
//               },
//             },
//           },
//           {
//             $replaceRoot: {
//               newRoot: {
//                 results: "$nrp_user",
//               },
//             },
//           },
//         ],
//         {
//           allowDiskUse: true,
//         }
//       );
//       getTrack = getTrack.map((datanya) => datanya.results[0]);

//       response(res, true, "Succeed", getTrack);
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };
//   static getLogout = async (req, res) => {
//     try {
//       const { date, name_officer = null } = req.query;
//       const today = dateParse(moment());
//       const endDateToday = moment(today).endOf("day").toDate();

//       let getData = { where: null };
//       if (name_officer != null) {
//         getData.name_officer = name_officer;

//         getData.date = today;
//       } else {
//         getData.date = today;
//       }

//       let getTrack = await TrackG20.aggregate(
//         [
//           {
//             $match: {
//               dateOnly: today,
//               // status_login: 0,
//             },
//           },
//           {
//             $group: {
//               _id: "$nrp_user",
//               max_date: {
//                 $max: "$updated_at",
//               },
//               records: {
//                 $push: "$$ROOT",
//               },
//             },
//           },
//           {
//             $project: {
//               nrp_user: {
//                 $filter: {
//                   input: "$records",
//                   as: "records",
//                   cond: {
//                     $eq: ["$$records.updated_at", "$max_date"],
//                   },
//                 },
//               },
//             },
//           },
//           {
//             $replaceRoot: {
//               newRoot: {
//                 results: "$nrp_user",
//               },
//             },
//           },
//         ],
//         {
//           allowDiskUse: true,
//         }
//       );
//       getTrack = getTrack.map((datanya) => datanya.results[0]);

//       response(
//         res,
//         true,
//         "Succeed",
//         getTrack.filter((datanya) => datanya.status_login == 0)
//       );
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };

//   static getName = async (req, res) => {
//     try {
//       const { date, name_officer = null } = req.query;
//       const today = dateParse(moment());
//       const endDateToday = moment(today).endOf("day").toDate();

//       let getData = { where: null };
//       if (name_officer != null) {
//         getData.name_officer = name_officer;

//         getData.date = today;
//       } else {
//         getData.date = today;
//       }
//       const getTrack = await TrackG20.findOne(getData).sort({ updated_at: -1 });

//       response(res, true, "Succeed", getTrack);
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };

//   static sendToSocket = async () => {
//     const today = moment(new Date()).format("YYYY-MM-DD");
//     const endDateToday = moment(today).endOf("day").toDate();
//     const getTrack = await TrackG20.find({
//       date: {
//         $gte: today,
//         $lte: endDateToday,
//       },
//     });
//     return getTrack;
//   };
//   static getByUser = async (req, res) => {
//     try {
//       // const { date } = req.query;

//       const today = moment().format("YYYY-MM-DD");
//       const endDateToday = moment(today).endOf("day").toDate();
//       const getTrack = await TrackG20.find({
//         date: {
//           $gte: today,
//           $lte: endDateToday,
//         },
//         id_officer: AESDecrypt(req.auth.officer, {
//           isSafeUrl: true,
//           parseMode: "string",
//         }),
//       })
//         .limit(1)
//         .sort({
//           created_at: -1,
//         });
//       response(res, true, "Succeed", getTrack.length ? getTrack[0] : {});
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };
//   static add = async (req, res) => {
//     try {
//       await TrackG20.create({
//         id_user: AESDecrypt(req.auth.uid, {
//           isSafeUrl: true,
//           parseMode: "string",
//         }),
//         latitude: req.body.latitude,
//         longitude: req.body.longitude,
//         date: moment(),
//       });
//       response(res, true, "Succeed", null);
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };

//   static addDataOfficerToSocket = async (req, res) => {
//     try {
//       await TrackG20.deleteMany({
//         dateOnly: dateParse(moment()),
//       });

//       let dataAccount = await Account.findAll({
//         include: [
//           {
//             model: Country,
//             // as: "countrys",
//             foreignKey: "id_country",
//             required: false,
//           },
//           {
//             model: Vehicle,
//             as: "vehicle",
//             foreignKey: "id_vehicle",
//             required: false,
//           },
//           {
//             model: Officer,
//             as: "officers",
//             required: true,
//             // where: {
//             //   nrp_officer: socket.handshake.query.user_nrp,
//             // },
//           },
//         ],
//         limit: 2000,
//       });
//       let dataUsernya = [];
//       for (const iterator1 of dataAccount) {
//         for (const iterator2 of iterator1.officers) {
//           let noTelpon = iterator2?.phone_officer;
//           let noDepan = noTelpon ? noTelpon.substring(0, 2) : "";
//           if (noDepan === "62") {
//             noTelpon = noTelpon;
//           } else if (noDepan === "08") {
//             noTelpon = "62" + noTelpon.substring(1);
//           } else if (noDepan === "+6") {
//             noTelpon = noTelpon.substring(1);
//           } else {
//             noTelpon = noTelpon;
//           }
//           let getData = randomCoordinates();
//           let getLat = getData.split(",");
//           // console.log({
//           //   lat: parseFloat(getLat[0]),
//           //   lon: parseFloat(getLat[1]),
//           // });
//           dataUsernya.push({
//             id_user: iterator1.dataValues.id,
//             latitude: parseFloat(getLat[0]),
//             longitude: parseFloat(getLat[1]),
//             status_login: 1,
//             pam_officer: iterator2.pam_officer, // [ketua tim]
//             name_account: iterator1.name_account,
//             id_officer: iterator2.dataValues.id,
//             name_team: iterator2.name_officer, // [ketua tim]
//             name_officer: iterator2.name_officer,
//             photo_officer: iterator2.photo_officer,
//             rank_officer: iterator2.rank_officer,
//             nrp_user: iterator2.nrp_officer,
//             color_marker: iterator2.color_marker,
//             handphone: noTelpon,
//             photo_officer_telp_biasa: "+" + noTelpon,
//             name_country:
//               iterator1.country != null ? iterator1.country.name_country : "-", // Delegasi
//             photo_country:
//               iterator1.country != null
//                 ? `http://k3ig20korlantas.id:3001/uploads/country/${iterator1.country.photo_country}`
//                 : "-", // Foto Delegasi

//             no_vehicle: iterator1.vehicle.no_vehicle, // [plat nomor]
//             type_vehicle: iterator1.vehicle.type_vehicle, // ["motor"]
//             fuel_vehicle: iterator1.vehicle.fuel_vehicle, //
//             back_number_vehicle: iterator1.vehicle.back_number_vehicle, //
//             date: moment().format("YYYY-MM-DD"),
//             // dateOnly: moment().format("YYYY-MM-DD"),
//             dateOnly: dateParse(moment()),
//             // polda_id
//             polda_id: iterator2.polda_id,
//           });
//         }
//       }
//       await TrackG20.insertMany(dataUsernya);
//       // await TrackG20.deleteMany({
//       //   dateOnly: dateParse(moment()),
//       // });
//       response(res, true, "Succeed", dataUsernya);
//     } catch (error) {
//       response(res, false, error.message, error);
//     }
//   };
//   static filterPetugas = async (req, res) => {
//     try {
//       let { limit, polda_id, page } = req.query;
//       page = page ? page : 1;
//       limit = limit ? limit : 100;

//       let filter = {
//         $match: {
//           id_user: {
//             $ne: null,
//           },
//           dateOnly: dateParse(moment()),
//         },
//         // $sort: { updated_at: -1 },
//       };

//       if (polda_id) {
//         let listPolda = polda_id.split(",").map((list) => parseInt(list));
//         filter = {
//           $match: {
//             polda_id: {
//               $in: listPolda,
//             },
//             dateOnly: dateParse(moment()),
//           },
//         };
//       }
//       const trackPetugas = TrackG20Update.aggregate([
//         filter,
//         {
//           $sort: { updated_at: -1 },
//         },
//       ]);
//       const getPaging = await TrackG20Update.aggregatePaginate(trackPetugas, {
//         page: page,
//         limit: limit,
//       });
//       response(res, true, "Success", getPaging);
//       // aggregatePaginate(query, {
//       //   ...paging,
//       //   customLabels: {
//       //     docs: nameDoc,
//       //     totalDocs: 'total',
//       //     limit: 'perPage',
//       //     allowDiskUse: true,
//       //   },
//       // })
//     } catch (e) {
//       response(res, false, "Failed", e.message);
//     }
//   };
// };
