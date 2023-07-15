const router = require("express").Router();
const { body } = require("express-validator");
const CountNgawas = require("../controller/count_ngawas");
const formValidation = require("../middleware/form_validation");
router.get("/jenis_kendaraan", CountNgawas.get_type);
router.get("/merk_kendaraan", CountNgawas.get_model);
router.get("/prov_ngawas", CountNgawas.prov_ngawas);
router.get("/kec_ngawas", CountNgawas.kec_ngawas);
router.get("/daily_ngawas", CountNgawas.daily_ngawas);
router.get("/filter", CountNgawas.filter);



module.exports = router;
