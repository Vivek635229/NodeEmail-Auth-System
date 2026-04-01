const User = require("../models/profileModel");
const bcrypt = require("bcrypt");
const randormstring = require("randomstring");
const config = require("../config/config");
const nodemailer = require("nodemailer");
const excelJs = require("exceljs");
const handlebars = require("handlebars");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");

const getBaseUrl = () =>
  process.env.APP_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8000}`;

const buildEmailTemplate = ({
  title,
  greeting,
  body,
  actionText,
  actionUrl,
  extraHtml = "",
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
        ${extraHtml}
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
//loaded Login
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
//email send
const addUserMail = async (name, email, password, user_id) => {
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
      subject: "Admin add you and verify your mail",
      html: buildEmailTemplate({
        title: "Your Account Has Been Created",
        greeting: `Hi ${name},`,
        body: "An admin has created your account. Verify your email and use the temporary credentials below for first login.",
        actionText: "Verify Email",
        actionUrl: `${getBaseUrl()}/verify?id=${user_id}`,
        extraHtml: `<p style=\"margin:14px 0 0 0;font-size:14px;color:#1e293b;\"><strong>Email:</strong> ${email}<br><strong>Temporary Password:</strong> ${password}</p>`,
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
//send reset mail
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
        title: "Admin Password Reset",
        greeting: `Hi ${name},`,
        body: "Use the link below to reset your admin password.",
        actionText: "Reset Password",
        actionUrl: `${getBaseUrl()}/admin/forget-password?token=${token}`,
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
//verify login
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", {
            message: "Email and Password is incorrect.",
            messageType: "error",
          });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/home?status=login-success");
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
//Home
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    let statusMessage = "";
    let statusType = "";
    if (req.query.status === "login-success") {
      statusMessage = "Admin login successful.";
      statusType = "success";
    }
    res.render("home", { user: userData, statusMessage, statusType });
  } catch (error) {
    console.log(error.message);
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
//forget
const forget = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_admin === 0) {
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
const resetpassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securepassword(password);
    const updateData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } },
    );
    res.redirect("/admin?status=password-reset");
  } catch (error) {
    console.log(error.message);
  }
};
//admin dashboard
const adminDashboard = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 5;

    const query = {
      is_admin: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    };

    const usersData = await User.find(query)
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await User.countDocuments(query);

    let statusMessage = "";
    let statusType = "";
    if (req.query.status === "created") {
      statusMessage = "User created successfully and verification email sent.";
      statusType = "success";
    } else if (req.query.status === "updated") {
      statusMessage = "User updated successfully.";
      statusType = "success";
    } else if (req.query.status === "deleted") {
      statusMessage = "User deleted successfully.";
      statusType = "success";
    } else if (req.query.status === "verified") {
      statusMessage = "User verification enabled.";
      statusType = "success";
    } else if (req.query.status === "unverified") {
      statusMessage = "User verification disabled.";
      statusType = "success";
    }

    res.render("dashboard", {
      users: usersData,
      totalpage: Math.max(Math.ceil(count / limit), 1),
      currentPage: page,
      totalUsers: count,
      search,
      statusMessage,
      statusType,
    });
  } catch (error) {
    console.log(error.message);
  }
};
//new user add
const newUser = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};
const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = randormstring.generate(10);
    const spassword = await securepassword(password);
    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      addUserMail(name, email, password, userData._id);
      res.redirect("/admin/dashboard?status=created");
    } else {
      res.render("new-user", {
        message: "Something went wrong.",
        messageType: "error",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//edit-users
const editUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      return res.render("edit-user", { user: userData });
    }
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};
//update user profile for admin change

const updateUser = async (req, res) => {
  try {
    const userId = req.body.id;
    const user = await User.findById(userId);

    if (!user) {
      // Handle case where user is not found
      return res.status(404).send("User not found");
    }

    // Respect UI-provided verification state; fallback to toggle for old forms.
    if (typeof req.body.is_varified !== "undefined") {
      user.is_varified = Number(req.body.is_varified) === 1 ? 1 : 0;
    } else {
      user.is_varified = !user.is_varified;
    }

    // Update other fields if needed
    user.name = req.body.name;
    user.email = req.body.email;
    user.mobile = req.body.mobile;

    // Save the updated user
    await user.save();

    res.redirect("/admin/dashboard?status=updated");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
//delete -users
const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const deleteuser = await User.deleteOne({ _id: id });

    res.redirect("/admin/dashboard?status=deleted");
  } catch (error) {
    console.log(error.message);
  }
};

const toggleUserVerification = async (req, res) => {
  try {
    const id = req.query.id;
    const set = Number(req.query.set) === 1 ? 1 : 0;

    await User.updateOne(
      { _id: id, is_admin: 0 },
      { $set: { is_varified: set } },
    );
    res.redirect(
      `/admin/dashboard?status=${set === 1 ? "verified" : "unverified"}`,
    );
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/dashboard");
  }
};

//export user data form excel
const exportUser = async (req, res) => {
  try {
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("My Users");
    worksheet.columns = [
      {
        header: "Sno.",
        key: "s_no",
      },
      {
        header: "Name",
        key: "name",
      },
      {
        header: "Email",
        key: "email",
      },
      {
        header: "Mobile",
        key: "mobile",
      },
      {
        header: "Is Admin",
        key: "is_admin",
      },
      {
        header: "Is Varified",
        key: "is_varified",
      },
    ];
    let counter = 1;
    const userData = await User.find({ is_admin: 0 });
    userData.forEach((user) => {
      user.s_no = counter;
      worksheet.addRow(user);
      counter++;
    });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader(
      "Content-type",
      "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment;filename=users.xlsx`);
    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    });
  } catch (error) {
    console.log(error.message);
  }
};
//export user to pdf

const exportUserPdf = async (req, res) => {
  try {
    const users = await User.find({ is_admin: 0 });
    const data = {
      users: users.map((user, index) => ({
        isVerified: Number(user.is_varified) === 1,
        s_no: index + 1,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        verifiedLabel:
          Number(user.is_varified) === 1 ? "Verified" : "Not Verified",
        verifiedColor: Number(user.is_varified) === 1 ? "#065f46" : "#991b1b",
        verifiedBg: Number(user.is_varified) === 1 ? "#d1fae5" : "#fee2e2",
        verifiedIcon:
          Number(user.is_varified) === 1
            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#065f46" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="#991b1b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      })),
      generatedAt: new Date().toLocaleString(),
    };
    const filePathName = path.join(__dirname, "../views/admin/htmlpdf.hbs");
    const htmlString = fs.readFileSync(filePathName).toString();
    const options = {
      format: "Letter",
      border: "10mm",
    };
    const template = handlebars.compile(htmlString);
    const hbsData = template(data);
    const outputPdfPath = path.join(__dirname, "../Users.pdf");
    pdf.create(hbsData, options).toFile(outputPdfPath, (err, response) => {
      if (err || !response || !response.filename) {
        console.log(err);
        return res.status(500).send("Could not generate PDF file");
      }

      fs.readFile(response.filename, (readErr, file) => {
        if (readErr) {
          console.log(readErr);
          return res.status(500).send("Could not download file");
        }
        res.setHeader("Content-type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="users.pdf"',
        );
        res.send(file);

        fs.unlink(response.filename, () => {});
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadHome,
  logout,
  forget,
  forgetVerify,
  forgetpasswordLoad,
  resetpassword,
  adminDashboard,
  newUser,
  addUser,
  editUser,
  updateUser,
  toggleUserVerification,
  deleteUser,
  exportUser,
  exportUserPdf,
};
