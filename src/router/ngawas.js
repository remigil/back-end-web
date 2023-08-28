const router = require("express").Router();
const { body } = require("express-validator");
const NgawasController = require("../controller/ngawas");
const formValidation = require("../middleware/form_validation");
router.get("/", NgawasController.get);
router.get("/getPerMonth", NgawasController.getPerMonth);
router.get("/getid/:id", NgawasController.getId);
router.get("/cekngawas", NgawasController.cekNgawas);
router.get("/getbycode", NgawasController.getbycodengawas);
router.get("/getbysocietyId/", NgawasController.getbySocietyId);
router.get("/gethistorybysocietyId/", NgawasController.gethistorybySocietyId);
router.post(
  "/add",
  // body("no_vehicle").notEmpty().isLength({ min: 3 }),
  formValidation,
  NgawasController.add
);
router.put("/edit/:id", NgawasController.edit);
router.delete(
  "/delete",
  body("id").notEmpty().isLength({ min: 1 }),
  formValidation,
  NgawasController.delete
);
router.delete(
  "/hardDelete",
  body("id").notEmpty().isLength({ min: 1 }),
  formValidation,
  NgawasController.hardDelete
);

router.get("/list_ngawas", NgawasController.getWeb);

router.get("/schedule", NgawasController.getSchedule);
router.get("/history", NgawasController.getHistory);

router.put("/scheduleToHistory", NgawasController.upScheduletoHistory);


module.exports = router;
