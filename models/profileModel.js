const mongoose = require("mongoose");

//create a model of person profile
const profileSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  is_admin: {
    type: Number,
    required: true
  },
  is_varified: {
    type: Number,
    default: 0
  },
  token: {
    type: String,
    default: ""
  }
});
const Persondetails = mongoose.model("Login Details", profileSchema);
module.exports = Persondetails;
