const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");

const db = require("../config/database");

// TODO: {Get course} fetch enroll data course wise and student wise
// TODO: {Enroll student, Unenroll student} check for valid studentID and courseID from DB.
// TODO: {Enroll student, Unenroll student} check if already un/enrolled and seat availability.
// Middleware
router.use(checkToken);

//=============================== GET request ================================//
// Get all courses
router.get("/", (req, res) => {
  let sql = "select * from courses";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Get specific course
router.get("/:id", (req, res) => {
  let sql = `select * from courses where id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(400).json({ error: "Some error occured with DB query" });
    } else if (result.length == 0) {
      res
        .status(400)
        .json({ error: `No such course exist with id ${req.params.id}` });
    } else res.json(result);
  });
});

// Get enroll data
router.get("/enroll/data", (req, res) => {
  let sql = "select * from enrolled_data";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

//=============================== POST request ================================//
// Add course
router.post("/", (req, res) => {
  const name = req.body.name;
  const description = req.body.description;
  const available_seats = req.body.availableSlots;
  if (!name || !available_seats || !description) {
    return res.status(400).json({ error: "Invalid input data." });
  }
  if (res.locals.email === "admin@system.com") {
    let course = {
      name: name,
      description: description,
      available_seats: available_seats,
    };
    let sql = "insert into courses set ?";
    db.query(sql, course, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.json({ error: "Course already exists." });
        } else res.json({ error: "Some error occured." });
      }
      console.log(result);
      res.json({ success: true });
    });
  } else {
    res.status(301).json({ error: "only admin can add a course" });
  }
});

// Enroll student
router.post("/:id/enroll", (req, res) => {
  const studentID = req.body.studentId;
  const courseID = req.params.id;
  if (!studentID || !courseID) {
    res.status(400).json({ error: "Invalid Payload" });
  }
  console.log("Check....:", res.locals.id, studentID);
  if (res.locals.id == studentID) {
    let sql = "insert into enrolled_data set ?";
    let enrolledData = { course_id: courseID, student_id: studentID };
    decreaseCourseSeat(courseID);
    db.query(sql, enrolledData, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.json({ success: true });
    });
  } else {
    res.json({ success: false, msg: "You can't enroll someone else." });
  }
});

//=============================== PUT request ================================//
// Unenroll student
router.put("/:id/deregister", (req, res) => {
  const studentID = req.body.studentId;
  const courseID = req.params.id;
  if (!studentID || !courseID) {
    res.status(400).json({ error: "Invalid Payload" });
  }

  if (res.locals.id == studentID) {
    let sql = `delete from enrolled_data where student_id = ${studentID} and course_id = ${courseID}`;
    increaseCourseSeat(courseID);
    db.query(sql, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.json({ success: true });
    });
  } else {
    res.json({ success: false, msg: "You can't unenroll someone else." });
  }
});

//=============================== Functions =================================//
function increaseCourseSeat(courseID) {
  let sql = `select available_seats from courses where id = ${courseID}`;
  let initialSeats;
  let finalSeats;
  db.query(sql, (err, result) => {
    if (err) throw err;
    initialSeats = result[0].available_seats;
    finalSeats = initialSeats + 1;
    console.log("final: ", finalSeats);
    let sql2 = `update courses set available_seats = ${finalSeats} where id = ${courseID}`;
    db.query(sql2, (err, result) => {
      if (err) throw err;
      console.log("Increase course seat by 1");
      console.log(result);
    });
  });
}
function decreaseCourseSeat(courseID) {
  let sql = `select available_seats from courses where id = ${courseID}`;
  let initialSeats;
  let finalSeats;
  db.query(sql, (err, result) => {
    if (err) throw err;
    initialSeats = result[0].available_seats;
    finalSeats = initialSeats - 1;
    console.log("final: ", finalSeats);
    let sql2 = `update courses set available_seats = ${finalSeats} where id = ${courseID}`;
    db.query(sql2, (err, result) => {
      if (err) throw err;
      console.log("Decrease course seat by 1");
      console.log(result);
    });
  });
}

module.exports = router;
