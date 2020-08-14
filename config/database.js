const mysql = require("mysql");
require("dotenv").config();

//Create  connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "courses_crud",
});

//Connect
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("mysql connected");
});

module.exports = db;
