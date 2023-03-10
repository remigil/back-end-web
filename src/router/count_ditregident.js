const router = require("express").Router();
const { body } = require("express-validator");
const CountDitregident = require("../controller/count_ditregident");
const CountSBST = require("../controller/count_sbst");
const formValidation = require("../middleware/form_validation");
router.get("/daily", CountDitregident.get_daily);
router.get("/date", CountDitregident.get_by_date);

router.get("/sbst/daily", CountSBST.get_daily);
router.get("/sbst/date", CountSBST.get_by_date);

// router.get("/", CountDitregident.get);
// router.get("/count-month", CountDitregident.countByMonth);

module.exports = router;
