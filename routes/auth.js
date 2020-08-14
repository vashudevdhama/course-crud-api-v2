const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const { to } = require("await-to-js");
const router = express.Router();

// Signup POST request
router.post("/signup", async (req, res) => {
  const userName = req.body.userName;
  const email = req.body.email;
  const password = req.body.password;

  if (!validateSignupPayload(userName, email, password)) {
    return res.status(403).json({ error: "Invalid Payload" });
  } else {
    let student = {
      name: userName,
      email: email,
      password: await passwordHash(password),
    };
    let sql = `insert into students set ?`;
    db.query(sql, student, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          res.json({ success: false, error: "This email already exist." });
        } else {
          res.json({ success: false, error: "Some error occured." });
        }
      } else {
        res.json({ success: true });
      }
    });
  }
});

// Login POST request
router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let sql = `select * from students where email = '${email}'`;
  db.query(sql, async (err, result) => {
    if (err) res.json({ error: "Some error occured in DB query" });
    else {
      if (result.length > 0) {
        // email exist
        const [err, isValidPassword] = await to(
          bcrypt.compare(password, result[0].password)
        );
        if (isValidPassword) {
          // password matched
          const student = {
            id: result[0].id,
            name: result[0].name,
            email: email,
          };
          return res.json({
            success: true,
            token: generateToken(student),
            error: null,
          });
        } else {
          // password doesn't match
          res.json({
            success: false,
            msg: "Email and password doesn't match.",
          });
        }
      } else {
        // email doesn't exist
        res.json({ status: false, msg: "email doesn't exists." });
      }
    }
  });
});

//======================== Funcitons =============================//
// Validate payload
const validateSignupPayload = (userName, email, password) => {
  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!userName || !email || !password) {
    return false;
  } else if (email.match(mailformat)) {
    return true;
  } else {
    return false;
  }
};

const salt = "dmFzaHVkZXZkaGFtYQo=";
// Generate token
const generateToken = (userData) => {
  let token = jwt.sign(userData, salt, { expiresIn: 172800000 });
  return token;
};
// Generate password hash
const passwordHash = async (password) => {
  const saltRounds = 10;
  const [err, passwordHash] = await to(bcrypt.hash(password, saltRounds));
  if (err) throw err;
  return passwordHash;
};
module.exports = router;
