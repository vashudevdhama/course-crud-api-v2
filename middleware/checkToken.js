const jwt = require("jsonwebtoken");

const checkToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader != "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    let authData = verifyToken(res, next, bearerToken);
  } else {
    res.status(400).json({ success: false, error: "No token found" });
  }
};

const salt = "dmFzaHVkZXZkaGFtYQo=";

const verifyToken = (res, next, token) => {
  let data = jwt.verify(token, salt, (err, authData) => {
    if (err) res.json({ error: "Invalid token." });
    if (authData.email) {
      res.locals.email = authData.email;
      res.locals.id = authData.id;
      next();
    } else {
      return res.json({ success: false, error: "Invalid token" });
    }
  });
};

module.exports = checkToken;
