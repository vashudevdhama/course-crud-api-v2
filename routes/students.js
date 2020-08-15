const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");

const db = require("../config/database");

// Middleware
router.use(checkToken);

// TODO: don't show password in students details.
//=============================== GET request ================================//
// Get all students
router.get("/", (req, res) => {
  let sql = "select * from students";
  db.query(sql, (err, result) => {
    if (err) res.json({ success: false, error: "Query doesn't work." });
    else res.json(result);
  });
});

// Get specific student
router.get("/:id", (req, res) => {
  let sql = `select * from students where id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) {
      res.send(400).json({ error: "Some error occured with DB query" });
    } else if (result.length == 0) {
      res
        .status(400)
        .json({ error: `No such student with id ${req.params.id}` });
    } else res.json(result);
  });
});

module.exports = router;
