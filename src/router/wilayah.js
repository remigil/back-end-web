const router = require("express").Router();
const { body } = require("express-validator");
const KabupatenController = require("../controller/wilayah/kabupaten");
const Provinsi = require("../controller/wilayah/provinsi");
const formValidation = require("../middleware/form_validation");
const Kecamatan = require("../controller/wilayah/kecamatan");
const KecamatanController = require("../controller/wilayah/kecamatan");
router.get("/provinsi", Provinsi.get);
router.post("/import", formValidation, Provinsi.importExcell);
router.get("/kabupaten", KabupatenController.get);
router.get("/kecamatan", Kecamatan.get);
router.post(
  "/kabupaten/import",
  formValidation,
  KabupatenController.importExcell
);
router.post(
  "/kecamatan/import",
  formValidation,
  KecamatanController.importExcell
);

module.exports = router;
