const User = require("../models/profileModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randormstring = require("randomstring");
const config = require("../config/config");

const getBaseUrl = () =>
  process.env.APP_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8000}`;

const buildEmailTemplate = ({
  title,
  greeting,
  body,
  actionText,
  actionUrl,
}) => {
  return `
  <div style="background:#f3f6fb;padding:28px 0;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#ffffff;">
        <h2 style="margin:0;font-size:20px;">${title}</h2>
      </div>
      <div style="padding:24px;line-height:1.6;">
        <p style="margin:0 0 10px 0;font-size:15px;">${greeting}</p>
        <p style="margin:0 0 18px 0;font-size:14px;color:#334155;">${body}</p>
        <a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:700;">${actionText}</a>
        <p style="margin:18px 0 0 0;font-size:12px;color:#64748b;">If the button does not work, copy this link in your browser: ${actionUrl}</p>
      </div>
    </div>
  </div>`;
};
//hash password create
const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
//email send
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.useremail,
        pass: config.userpass,
      },
    });
    const mailoptions = {
      from: config.useremail,
      to: email,
      subject: "For Verification Email",
      html: buildEmailTemplate({
        title: "Verify Your Email",
        greeting: `Hi ${name},`,
        body: "Please confirm your email address to activate your account.",
        actionText: "Verify Email",
        actionUrl: `${getBaseUrl()}/verify?id=${user_id}`,
      }),
    };
    transporter.sendMail(mailoptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has beeen send:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//Send Reset password for email
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.useremail,
        pass: config.userpass,
      },
    });
    const mailoptions = {
      from: config.useremail,
      to: email,
      subject: "For Reset Password",
      html: buildEmailTemplate({
        title: "Reset Your Password",
        greeting: `Hi ${name},`,
        body: "We received a request to reset your password. Use the button below to continue.",
        actionText: "Reset Password",
        actionUrl: `${getBaseUrl()}/forget-password?token=${token}`,
      }),
    };
    transporter.sendMail(mailoptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has beeen send:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
//loaded Registraion
const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};
//inser user details
const inseruser = async (req, res) => {
  try {
    const spassword = await securepassword(req.body.password);
    const user = User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);
      res.render("registration", {
        messageType: "success",
        message:
          "Your registration has been successfully.Please verify your Email",
      });
    } else {
      res.render("registration", {
        messageType: "error",
        message: "Your registration has been failed.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//verification mail
const VerifyMail = async (req, res) => {
  try {
    const updateinfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_varified: 1 } },
    );
    console.log(updateinfo);
    res.render("emailVerified");
  } catch (error) {
    console.log(error.message);
  }
};
//Load login page
const loadLogin = async (req, res) => {
  try {
    let message = "";
    let messageType = "success";
    if (req.query.status === "password-reset") {
      message = "Password reset successful. Please login.";
    }
    res.render("login", { message, messageType });
  } catch (error) {
    console.log(error.message);
  }
};
const verifylogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_varified === 0) {
          res.render("login", {
            message: "Please verify your email.",
            messageType: "error",
          });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home?status=login-success");
        }
      } else {
        res.render("login", {
          message: "Email and Password is incorrect.",
          messageType: "error",
        });
      }
    } else {
      res.render("login", {
        message: "Email and Password is incorrect.",
        messageType: "error",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//home
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    let statusMessage = "";
    let statusType = "";
    if (req.query.status === "login-success") {
      statusMessage = "Logged in successfully.";
      statusType = "success";
    } else if (req.query.status === "profile-updated") {
      statusMessage = "Profile updated successfully.";
      statusType = "success";
    }
    res.render("home", { user: userData, statusMessage, statusType });
  } catch (error) {
    console.log(error.message);
  }
};

//logout
const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

//forget password
const forgetpassword = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};
//for token generate
const forgetEmail = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_varified === 0) {
        res.render("forget", {
          message: "Please verify your mail.",
          messageType: "error",
        });
      } else {
        const randomstring = randormstring.generate();
        const updateData = await User.updateOne(
          { email: email },
          { $set: { token: randomstring } },
        );
        sendResetPasswordMail(userData.name, userData.email, randomstring);
        res.render("forget", {
          message: "Please check your mail to reset your password.",
          messageType: "success",
        });
      }
    } else {
      res.render("forget", {
        message: "Email is incorrect.",
        messageType: "error",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//forget password load
const forgetpasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Page is not found!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//reset password
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securepassword(password);
    const updateData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } },
    );
    res.redirect("/login?status=password-reset");
  } catch (error) {
    console.log(error.message);
  }
};
//verification send link
const Verification = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};
//send verification
const sendVerification = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendVerifyMail(userData.name, userData.email, userData._id);
      res.render("verification", {
        message: "Verification email sent. Please check your inbox.",
        messageType: "success",
      });
    } else {
      res.render("verification", {
        message: "This email does not exist.",
        messageType: "error",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//edit profile and update
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editProfile", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const editProfile = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.user_id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      },
    );

    res.redirect("/home?status=profile-updated");
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  loadRegister,
  inseruser,
  VerifyMail,
  loadLogin,
  verifylogin,
  loadHome,
  userLogout,
  forgetpassword,
  forgetEmail,
  forgetpasswordLoad,
  resetPassword,
  Verification,
  sendVerification,
  editLoad,
  editProfile,
};
