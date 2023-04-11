const router = require("express").Router();
const { body } = require("express-validator");
const PenumpangController = require("../controller/penumpang");
const formValidation = require("../middleware/form_validation");
router.get("/", PenumpangController.get);
router.post(
  "/add",
  body("id_society").notEmpty().isLength({ min: 3 }),
  formValidation,
  PenumpangController.add
);
router.put("/edit/:id", PenumpangController.edit);
router.delete(
  "/delete",
  body("id").notEmpty().isLength({ min: 1 }),
  formValidation,
  PenumpangController.delete
);
router.delete(
  "/hardDelete",
  body("id").notEmpty().isLength({ min: 1 }),
  formValidation,
  PenumpangController.hardDelete
);

module.exports = router;