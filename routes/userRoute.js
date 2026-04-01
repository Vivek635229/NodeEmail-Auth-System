const express = require("express");
const path = require("path");

const userController = require("../controllers/userController");
const config = require("../config/config");
const session = require("express-session");
const hbs = require("hbs");
const user_route = express();

user_route.use(
  session({
    secret: config.Ssecrect,
    resave: false, // set to false to avoid the deprecated warning
    saveUninitialized: true, // set to true to avoid the deprecated warning
    cookie: { secure: false },
  }),
);
//middleware can used
const auth = require("../middleware/auth");

//view engine

hbs.handlebars.registerHelper("ifeq", function (a, b, options) {
  return a == b ? options.fn(this) : options.inverse(this);
});
user_route.set("view engine", "hbs");
user_route.set("views", path.join(__dirname, "../views/users"));
hbs.registerPartials(path.join(__dirname, "../views/partials"));

//bodyparser
user_route.use(express.json());
user_route.use(express.static("public"));

user_route.use("/image", express.static(path.join(__dirname, "/public/image")));
user_route.use(express.urlencoded({ extended: true }));
//router mention
//register router
user_route.get("/Register", auth.isLogout, userController.loadRegister);
user_route.post("/Register", userController.inseruser);
//login router
user_route.get("/", auth.isLogout, userController.loadLogin);
user_route.get("/login", auth.isLogout, userController.loadLogin);
user_route.post("/login", userController.verifylogin);
//home
user_route.get("/home", auth.isLogin, userController.loadHome);
//logout
user_route.get("/logout", auth.isLogin, userController.userLogout);
//forget password
user_route.get("/forget", auth.isLogout, userController.forgetpassword);
user_route.post("/forget", userController.forgetEmail);
user_route.get(
  "/forget-password",
  auth.isLogout,
  userController.forgetpasswordLoad,
);

//reset password
user_route.post("/forget-password", userController.resetPassword);
//verification
user_route.get("/verification", userController.Verification);
user_route.post("/verification", userController.sendVerification);
//Edit profile
user_route.get("/editProfile", auth.isLogin, userController.editLoad);
user_route.post("/editProfile", userController.editProfile);

//verify mail
user_route.get("/verify", userController.VerifyMail);

module.exports = user_route;
