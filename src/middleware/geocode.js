const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapClient = new Client();
// const express = require('express');
// const app = express();
module.exports = async (params = []) => {
  let data = await googleMapClient.reverseGeocode({
    params: {
      key: process.env.GOOGLE_MAPS_API_KEY,
      latlng: {
        latitude: params.lat,
        longitude: params.lng,
      },
      result_type: [
        "administrative_area_level_1",
        "administrative_area_level_2",
        "administrative_area_level_3",
        "administrative_area_level_4",
        "administrative_area_level_5",
        "administrative_area_level_6",
        "administrative_area_level_7",
      ],
      language: "id",
    },
  });
  const result = data.data.results;
  let datalocation = null;
  if (result.length > 0 && result[0].address_components.length > 0) {
    datalocation = {
      country: null,
      province: null,
      district: null,
      subdistrict: null,
      village: null,
      citizen_assosiation: null,
      neighborhood_association: null,
    };
    Object.keys(datalocation).forEach((k, i) => {
      if (i < result[0].address_components.length) {
        datalocation[k] =
          result[0].address_components[
            result[0].address_components.length - (i + 1)
          ]?.long_name;
      }
    });
  }
  let location = datalocation ?? result.data.results;
  // app.use(location)
  return {
    province: location.province,
    district: location.district,
    subdistrict: location.subdistrict,
  };
};
