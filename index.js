require("dotenv").config();
const express = require("express");
const app = express();
require("./db/conn");
const router = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

const cors = require("cors");
const port = process.env.PORT;
app.use(express.json());
app.use(cors());
// Add user routes
app.use("/", router);

// Admin routes
app.use("/admin", adminRoute);
app.listen(port, () => {
  console.log(`server start at port no : ${port}`);
});
