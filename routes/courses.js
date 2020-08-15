const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");

const db = require("../config/database");

// TODO: {Get course} fetch enroll data course wise and student wise
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
  } else {
    checkAndEnroll(res, studentID, courseID);
  }
});

//=============================== PUT request ================================//
// Unenroll student
router.put("/:id/deregister", (req, res) => {
  const studentID = req.body.studentId;
  const courseID = req.params.id;
  if (!studentID || !courseID) {
    res.status(400).json({ error: "Invalid Payload" });
  } else {
    checkAndUnenroll(res, studentID, courseID);
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
const checkAndEnroll = (res, studentID, courseID) => {
  let sql = `select * from courses where id = ${courseID}`;
  db.query(sql, (err, result) => {
    if (err) {
      res.json({ success: false, error: "Couldn't check for course id." });
    } else {
      console.log("result: ", result[0]);
      if (result.length === 0) {
        // course doesn't exists.
        res.json({
          success: false,
          error: `No such course exist with id ${courseID}`,
        });
      }
      // course exists
      else {
        //check for seat availability.
        db.query(
          `select available_seats from courses where id = ${courseID}`,
          (err, result) => {
            if (err) {
              res.json({
                success: false,
                error: "Couldn't get available seats.",
              });
            } else {
              if (result == 0) {
                // seats unavailable
                res.json({
                  success: false,
                  error: "No more seats available in the course.",
                });
              } else {
                // seats available
                enrollStudent(res, studentID, courseID);
              }
            }
          }
        );
      }
    }
  });
};
const enrollStudent = (res, studentID, courseID) => {
  if (res.locals.id == studentID) {
    let sql = "insert into enrolled_data set ?";
    let enrolledData = { course_id: courseID, student_id: studentID };
    decreaseCourseSeat(courseID);
    db.query(sql, enrolledData, (err, result) => {
      if (err) {
        // Check for duplicate entry.
        if (err.code === "ER_DUP_ENTRY") {
          res.json({ success: false, error: "You are already enrolled." });
        } else {
          res.json({ success: false, error: "Some error occured" });
        }
      } else {
        res.json({ success: true });
      }
    });
  } else {
    res.json({ success: false, msg: "You can't enroll someone else." });
  }
};
const checkAndUnenroll = (res, studentID, courseID) => {
  let sql = `select * from enrolled_data where student_id = ${studentID} and course_id = ${courseID}`;
  db.query(sql, (err, result) => {
    if (err) {
      res.json({
        success: false,
        error: "Couldn't check for course and student id.",
      });
    } else {
      if (result.length === 0) {
        res.json({
          success: false,
          error: `No such enrollment record found.`,
        });
      } else {
        unenrollStudent(res, studentID, courseID);
      }
    }
  });
};
const unenrollStudent = (res, studentID, courseID) => {
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
};
module.exports = router;
