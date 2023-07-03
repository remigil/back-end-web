const router = require("express").Router();
const { body } = require("express-validator");
const Type_brand_vehicleController = require("../controller/type_brand_vehicle");  
const formValidation = require("../middleware/form_validation");
router.get("/", Type_brand_vehicleController.get);
// router.get(
//   "/getId/:id",  
//   Type_vehicleController.getId
// );
router.post(
  "/add",
  // body("type_name").notEmpty().isLength({ min: 3 }),
  formValidation,
  Type_brand_vehicleController.add
);
// router.put("/edit/:id", Type_vehicleController.edit);
// router.delete(
//   "/delete",
//   body("id").notEmpty().isLength({ min: 1 }),
//   formValidation,
//   Type_vehicleController.delete
// );
// router.delete(
//   "/hardDelete",
//   body("id").notEmpty().isLength({ min: 1 }),
//   formValidation,
//   Type_vehicleController.hardDelete
// );

module.exports = router;
