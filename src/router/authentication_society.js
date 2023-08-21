const AuthenticationSociety = require("../controller/authentication_society");
const { body } = require("express-validator");
const router = require("express").Router();
const formValidation = require("../middleware/form_validation");
const authMiddleware = require("../middleware/authentication");
router.post(
  "/login",
  body("no_hp").notEmpty().isLength({ min: 3 }),
  body("password").notEmpty().isLength({ min: 1 }),
  formValidation,
  AuthenticationSociety.login
);

router.post(
  "/login-mobile",
  body("no_hp").notEmpty().isLength({ min: 3 }),
  body("password").notEmpty().isLength({ min: 1 }),
  formValidation,
  AuthenticationSociety.loginMobile
);

router.post("/loginGoogle", AuthenticationSociety.loginGoogle);

router.get("/test", AuthenticationSociety.test);
router.post("/validate_login", AuthenticationSociety.validateLogin);
router.post("/register", AuthenticationSociety.registerSociety);
router.post("/validate_register", AuthenticationSociety.ValidateRegister);
router.post("/resend_token", AuthenticationSociety.resendToken);
module.exports = router;
