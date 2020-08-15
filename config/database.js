const mysql = require("mysql");
require("dotenv").config();

//Create  connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.MYSQL_DB_NAME,
});

//Connect
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("mysql connected");
});

module.exports = db;
