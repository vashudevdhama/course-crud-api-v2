const express = require("express");
require("dotenv").config();

const app = express();

// TODO: Try to achieve MVC pattern.
// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/students", require("./routes/students"));

// Listen at [PORT]
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is Up and Running at Port ${PORT}...`);
});
