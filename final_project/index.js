const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");

const customerRoutes = require("./router/auth_users.js").authenticated;
const generalRoutes = require("./router/general.js").general;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/customer",
  session({
    secret: "fingerprint_customer",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  })
);

// Protect every route under /customer/auth.
app.use("/customer/auth/*", (req, res, next) => {
  const authorizationHeader = req.headers.authorization || "";
  const bearerToken = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null;
  const token = bearerToken || req.session.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    req.user = jwt.verify(token, "access");
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired access token." });
  }
});

app.use("/customer", customerRoutes);
app.use("/", generalRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
