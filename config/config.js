const Ssecrect = process.env.SSECRECT || "Mysession";
const useremail = process.env.USEREMAIL || "";
const userpass = process.env.USERPASS || "";
module.exports = {
  Ssecrect,
  useremail,
  userpass,
};
