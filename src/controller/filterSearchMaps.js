const { AESDecrypt } = require("../lib/encryption");
const response = require("../lib/response");
// const Officer = require("../model/officer");
const db = require("../config/database");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const _ = require("lodash");
const formidable = require("formidable");
const Account = require("../model/account");
const Vehicle = require("../model/vehicle");
const { Client } = require("@googlemaps/google-maps-services-js");
const pagination = require("../lib/pagination-parser");
const moment = require("moment");
const { TrackG20 } = require("../model/tracking/g20");
// const Polda = require("../model/polda");
// const Polres = require("../model/polres");
// const Cctv = require("../model/cctv");
// const Etle = require("../model/etle");
// const Fasum = require("../model/fasum");
// const Sim_keliling = require("../model/sim_keliling");
// const Samsat = require("../model/samsat");
// const CategoryFasum = require("../model/category_fasum");
// const Schedule = require("../model/schedule");
// const Panic_button = require("../model/report");
// const Troublespot = require("../model/troublespot");
// const Blankspot = require("../model/blankspot");
// const Renpam = require("../model/renpam");
// const Vip = require("../model/vip");
const dateParse = (date) => {
  const aaa = moment.tz(date, "Etc/GMT-5");
  return aaa.format("YYYY-MM-DD");
};
const googleMapClient = new Client();
const fieldData = {
  turjawali: async () => {
    const today = dateParse(moment());

    let getTrack = await TrackG20.aggregate(
      [
        {
          $match: {
            dateOnly: today,
          },
        },
        {
          $group: {
            _id: "$nrp_user",
            max_date: {
              $max: "$updated_at",
            },
            // latitude: "$latitude",
            records: {
              $push: "$$ROOT",
            },
          },
        },
        {
          $project: {
            nrp_user: {
              $filter: {
                input: "$records",
                as: "records",
                cond: {
                  $eq: ["$$records.updated_at", "$max_date"],
                },
              },
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              results: "$nrp_user",
            },
          },
        },
      ],
      {
        allowDiskUse: true,
      }
    );
    getTrack = getTrack.map((datanya) => datanya.results[0]);

    return getTrack;
  },
  polda: async () => {
    return await Polda.findAll();
  },
  polres: async () => {
    return await Polres.findAll();
  },
  cctv: async () => {
    return await Cctv.findAll({
      attributes: {
        exclude: [
          "created_at",
          "updated_at",
          "deleted_at",
          "status_cctv",
          "gateway_cctv",
          "jenis_cctv",
          "merek_cctv",
          "username_cctv",
          "password_cctv",
        ],
      },
    });
  },
  etle: async () => {
    return await Etle.findAll();
  },
  fasum_khusus: async (req) => {
    return await Fasum.findAll({
      include: [
        {
          model: CategoryFasum,
          foreignKey: "fasum_type",
          required: false,
        },
      ],
      where: {
        // fasum_type: 9,
        fasum_status: 1,
        fasum_type: [9, 22, 23, 24, 25, 26, 27, 28, 29, 31],
      },
    });
  },
  rest_area: async (req) => {
    return await Fasum.findAll({
      include: [
        {
          model: CategoryFasum,
          foreignKey: "fasum_type",
          required: false,
        },
      ],
      where: {
        fasum_status: 1,
        fasum_type: 4,
      },
    });
  },
  pos_pam: async (req) => {
    return await Renpam.findAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      where: {
        schedule_id: 88,
      },
    });
  },
  pos_yan: async (req) => {
    return await Renpam.findAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      where: {
        schedule_id: 89,
      },
    });
  },
  pos_terpadu: async (req) => {
    return await Renpam.findAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      where: {
        schedule_id: 90,
      },
    });
  },
  posko: async (req) => {
    return await Renpam.findAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      where: {
        schedule_id: 91,
      },
    });
  },
  sat_pjr: async (req) => {
    return await Renpam.findAll({
      include: [
        {
          model: Schedule,
          foreignKey: "schedule_id",
          required: false,
        },
        {
          model: Account,
          as: "accounts",
          required: false,
        },
        {
          model: Vip,
          as: "vips",
          required: false,
        },
      ],
      where: {
        schedule_id: 92,
      },
    });
  },
  sat_pas: async (req) => {
    return await Fasum.findAll({
      include: [
        {
          model: CategoryFasum,
          foreignKey: "fasum_type",
          required: false,
        },
      ],
      where: {
        fasum_status: 1,
        fasum_type: 19,
      },
    });
  },
  jalur: async () => {
    return await Fasum.findAll({
      where: {
        fasum_status: 1,
        fasum_type: 12,
      },
    });
  },
  gerbang_tol: async () => {
    return await Fasum.findAll({
      where: {
        fasum_status: 1,
        fasum_type: 30,
      },
    });
  },
  sim_keliling: async () => {
    return await Sim_keliling.findAll();
  },
  samsat: async () => {
    return await Samsat.findAll();
  },
  trouble_spot: async () => {
    const today = dateParse(moment());
    return await Troublespot.findAll({
      include: [
        {
          model: Polda,
          required: false,
        },
        {
          model: Polres,
          required: false,
        },
      ],
      // where: {
      //   report_date: {
      //     [Op.between]: [today, today],
      //   },
      // },
    });
  },
  blank_spot: async () => {
    const today = dateParse(moment());
    return await Blankspot.findAll({
      // where: {
      //   report_date: {
      //     [Op.between]: [today, today],
      //   },
      // },
    });
  },
  titik_laporan: async (req) => {
    var starDate = moment().startOf("day").toDate();
    var endDate = moment().endOf("day").toDate();

    return await Panic_button.findAll({
      include: [
        {
          model: Officer,
        },
        {
          model: Account,
          required: false,
        },
      ],
      where: {
        type: "LAP",
        created_at: {
          [Op.between]: [starDate, endDate],
        },
      },
    });
  },
  titik_panicButton: async (req) => {
    var starDate = moment().startOf("day").toDate();
    var endDate = moment().endOf("day").toDate();
    return await Panic_button.findAll({
      include: [
        {
          model: Officer,
        },
        {
          model: Account,
          required: false,
        },
      ],
      where: {
        type: "PNC",
        created_at: {
          [Op.between]: [starDate, endDate],
        },
      },
    });
  },
  fasum: async ({ type, coordinate, radius }) => {
    let tampung_nearby = [];
    for (const iterator of type.split(",")) {
      let nearby = await nearByPlacesGoogle({
        type: iterator,

        radius: radius,
        coordinate: coordinate,
      });
      tampung_nearby.push(...nearby.data.results);
    }
    return tampung_nearby;
  },
  radius: async (req) => {
    return await Fasum.findAll({
      include: [
        {
          model: CategoryFasum,
          foreignKey: "fasum_type",
          required: false,
        },
      ],
      where: {
        fasum_status: 1,
        fasum_type: 10,
      },
    });
  },
  cluster: async (req) => {
    return await Fasum.findAll({
      include: [
        {
          model: CategoryFasum,
          foreignKey: "fasum_type",
          required: false,
        },
      ],
      where: {
        fasum_status: 1,
        fasum_type: 11,
      },
    });
  },
  jadwal_kegiatan: async () => {
    return await Schedule.findAll();
  },
  operasi: null,
  renpam: async () => {
    let getRenpam = await Renpam.findAll({
      where: {
        // id: 1495,
        type_renpam: 6,
      },
    });
    getRenpam = getRenpam.filter(
      (list) =>
        list.direction_route != null ||
        list.direction_route_alter1 != null ||
        list.direction_route_alter2 != null ||
        list.direction_route_masyarakat != null ||
        list.direction_route_umum != null
    );
    return getRenpam;
    // return await Renpam.findAll({
    //   where: {
    //     // id: 1495,
    //     type_renpam: 6,
    //   },
    // });
  },
};

const nearByPlacesGoogle = ({ type, radius, coordinate }) => {
  return googleMapClient.placesNearby({
    params: {
      key: process.env.GOOGLE_MAPS_API_KEY,
      // radius: radius,
      type: type,
      // location: coordinate,
      opennow: true,
    },
  });
};

module.exports = class FilterSearchController {
  static get = async (req, res) => {
    try {
      const { filter, type, coordinate, radius, polda_id, device } = req.query;

      let tampung = {};
      let tampungArr = [];
      Object.keys(fieldData).forEach((value, key) => {
        if (fieldData[value]) {
          if (filter.split(",").some((e) => e == value)) {
            if (value == "fasum") {
              let aaa = fieldData[value]({
                type,
                radius,
                coordinate,
              });
              tampung[value] = true;
              tampungArr.push(aaa);
            } else if (value == "polres") {
              tampung[value] = true;
              if (polda_id) {
                var dummyData = Polres.findAll({
                  where: {
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "cctv") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Cctv.findAll({
                  where: {
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "fasum_khusus") {
              tampung[value] = true;

              // if (polda_id) {
              //   var dummyData = Fasum.findAll({
              //     include: [
              //       {
              //         model: CategoryFasum,
              //         foreignKey: "fasum_type",
              //         required: false,
              //       },
              //     ],
              //     where: {
              //       // fasum_type: 9,
              //       fasum_status: 1,
              //       fasum_type: [9, 22, 23, 24, 25, 26, 27, 28, 29],
              //       polda_id: AESDecrypt(polda_id, {
              //         isSafeUrl: true,
              //         parseMode: "string",
              //       }),
              //     },
              //   });
              //   tampungArr.push(dummyData);
              // } else {
              tampungArr.push(fieldData[value](req));
              // }
            } else if (value == "rest_area") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Fasum.findAll({
                  include: [
                    {
                      model: CategoryFasum,
                      foreignKey: "fasum_type",
                      required: false,
                    },
                  ],
                  where: {
                    fasum_status: 1,
                    fasum_type: 4,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "pos_pam") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Renpam.findAll({
                  include: [
                    {
                      model: Schedule,
                      foreignKey: "schedule_id",
                      required: false,
                    },
                    {
                      model: Account,
                      as: "accounts",
                      required: false,
                    },
                    {
                      model: Vip,
                      as: "vips",
                      required: false,
                    },
                  ],
                  where: {
                    schedule_id: 88,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "pos_yan") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Renpam.findAll({
                  include: [
                    {
                      model: Schedule,
                      foreignKey: "schedule_id",
                      required: false,
                    },
                    {
                      model: Account,
                      as: "accounts",
                      required: false,
                    },
                    {
                      model: Vip,
                      as: "vips",
                      required: false,
                    },
                  ],
                  where: {
                    schedule_id: 89,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "pos_terpadu") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Renpam.findAll({
                  include: [
                    {
                      model: Schedule,
                      foreignKey: "schedule_id",
                      required: false,
                    },
                    {
                      model: Account,
                      as: "accounts",
                      required: false,
                    },
                    {
                      model: Vip,
                      as: "vips",
                      required: false,
                    },
                  ],
                  where: {
                    schedule_id: 90,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "posko") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Renpam.findAll({
                  include: [
                    {
                      model: Schedule,
                      foreignKey: "schedule_id",
                      required: false,
                    },
                    {
                      model: Account,
                      as: "accounts",
                      required: false,
                    },
                    {
                      model: Vip,
                      as: "vips",
                      required: false,
                    },
                  ],
                  where: {
                    schedule_id: 91,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "sat_pjr") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Renpam.findAll({
                  include: [
                    {
                      model: Schedule,
                      foreignKey: "schedule_id",
                      required: false,
                    },
                    {
                      model: Account,
                      as: "accounts",
                      required: false,
                    },
                    {
                      model: Vip,
                      as: "vips",
                      required: false,
                    },
                  ],
                  where: {
                    schedule_id: 92,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "sat_pas") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Fasum.findAll({
                  include: [
                    {
                      model: CategoryFasum,
                      foreignKey: "fasum_type",
                      required: false,
                    },
                  ],
                  where: {
                    fasum_status: 1,
                    fasum_type: 19,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "trouble_spot") {
              tampung[value] = true;

              if (polda_id) {
                const today = dateParse(moment());

                var dummyData = Troublespot.findAll({
                  where: {
                    // report_date: {
                    //   [Op.between]: [today, today],
                    // },
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "blank_spot") {
              tampung[value] = true;

              if (polda_id) {
                const today = dateParse(moment());

                var dummyData = Blankspot.findAll({
                  where: {
                    // report_date: {
                    //   [Op.between]: [today, today],
                    // },
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "jalur") {
              tampung[value] = true;

              if (device && device == "web") {
                var dummyData = Fasum.findAll({
                  where: {
                    fasum_status: 1,
                    fasum_type: 12,
                  },
                  attributes: {
                    exclude: ["direction_route"],
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "gerbang_tol") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "titik_laporan") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "polda") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "titik_panicButton") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "samsat") {
              tampung[value] = true;
              if (polda_id) {
                var dummyData = Samsat.findAll({
                  where: {
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "sim_keliling") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "etle") {
              tampung[value] = true;
              tampungArr.push(fieldData[value](req));
            } else if (value == "radius") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Fasum.findAll({
                  include: [
                    {
                      model: CategoryFasum,
                      foreignKey: "fasum_type",
                      required: false,
                    },
                  ],
                  where: {
                    fasum_status: 1,
                    fasum_type: 10,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else if (value == "cluster") {
              tampung[value] = true;

              if (polda_id) {
                var dummyData = Fasum.findAll({
                  include: [
                    {
                      model: CategoryFasum,
                      foreignKey: "fasum_type",
                      required: false,
                    },
                  ],
                  where: {
                    fasum_status: 1,
                    fasum_type: 11,
                    polda_id: AESDecrypt(polda_id, {
                      isSafeUrl: true,
                      parseMode: "string",
                    }),
                  },
                });
                tampungArr.push(dummyData);
              } else {
                tampungArr.push(fieldData[value](req));
              }
            } else {
              tampung[value] = true;
              tampungArr.push(fieldData[value]());
            }
          }
        } else {
          tampung[value] = true;
          tampungArr.push(fieldData[value]);
        }
      });

      Promise.all(tampungArr).then((cek) => {
        let objData = {};
        Object.keys(tampung).forEach((val, key) => {
          objData[val] = cek[key] ? cek[key] : [];
        });
        response(res, true, "Succeed", objData);
      });
    } catch (e) {
      response(res, false, "Failed", e.message);
    }
  };
  static getMultiplePlace = async (req, res) => {
    try {
      const { type, coordinate } = req.query;
      // const type = "mosque,school,cafe,hospital,lodging,restaurant,tourist_attraction,fire_station,shopping_mall";
      let tampung_nearby = [];
      for (const iterator of type.split(",")) {
        let aaa = await nearByPlacesGoogle({
          type: iterator,
          radius: 1500,
          coordinate: coordinate,
        });
        tampung_nearby.push(...aaa.data.results);
      }
      response(res, true, "Success", tampung_nearby);
    } catch (e) {
      response(res, false, "Failed", e);
    }
  };
};
