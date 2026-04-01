const express = require("express");
const admin_route = express();
const session = require("express-session");
const path = require("path");
const adminAuth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const hbs = require("hbs");

const config = require("../config/config");

//session
admin_route.use(
  session({
    secret: config.Ssecrect,
    resave: false, // set to false to avoid the deprecated warning
    saveUninitialized: true, // set to true to avoid the deprecated warning
    cookie: { secure: false },
  }),
);
//bodyparser
admin_route.use(express.json());
admin_route.use(express.static("public"));

admin_route.use(
  "/image",
  express.static(path.join(__dirname, "/public/image")),
);
admin_route.use(express.urlencoded({ extended: true }));

//view engine

hbs.handlebars.registerHelper("ifeq", function (a, b, options) {
  return a == b ? options.fn(this) : options.inverse(this);
});
const handlebars = require("handlebars");

// Define the eq helper
handlebars.registerHelper("eq", function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

// Now you can use the eq helper in your Handlebars templates

admin_route.set("view engine", "hbs");
admin_route.set("views", path.join(__dirname, "../views/admin"));
hbs.registerPartials(path.join(__dirname, "../views/partials"));

// loadlogin
admin_route.get("/", adminAuth.isLogout, adminController.loadLogin);

admin_route.post("/", adminController.verifyLogin);
//Home
admin_route.get("/home", adminAuth.isLogin, adminController.loadHome);
//logout
admin_route.get("/logout", adminAuth.isLogin, adminController.logout);
//forget
admin_route.get("/forget", adminAuth.isLogout, adminController.forget);
admin_route.post("/forget", adminController.forgetVerify);
//forget-password
admin_route.get(
  "/forget-password",
  adminAuth.isLogout,
  adminController.forgetpasswordLoad,
);
admin_route.post("/forget-password", adminController.resetpassword);
//user Dashboard show list
admin_route.get(
  "/dashboard",
  adminAuth.isLogin,
  adminController.adminDashboard,
);
admin_route.get("/new-user", adminAuth.isLogin, adminController.newUser);
admin_route.post("/new-user", adminController.addUser);
//edit user
admin_route.get("/edit-user", adminAuth.isLogin, adminController.editUser);
admin_route.post("/edit-user", adminController.updateUser);

//delete user
admin_route.get("/delete-user", adminAuth.isLogin, adminController.deleteUser);
//verify/unverify user from dashboard
admin_route.get(
  "/verify-user",
  adminAuth.isLogin,
  adminController.toggleUserVerification,
);
//export to excel data
admin_route.get("/export-user", adminAuth.isLogin, adminController.exportUser);
//export pdf
admin_route.get(
  "/export-user-pdf",
  adminAuth.isLogin,
  adminController.exportUserPdf,
);

admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});

module.exports = admin_route;
