const express = require("express");
const path = require("path");
// add favicon later
// const favicon = require("serve-favicon");
const colors = require("colors"); // eslint-disable-line no-unused-vars
const dotenv = require("dotenv").config({ path: "./config/config.env" }); // eslint-disable-line no-unused-vars
const connectDB = require("./config/db");

const app = express();
// favicon stuff
// const iconPath = path.join(__dirname, "public", "favicon.ico");
// const options = {
//   maxAge: 200 * 60 * 60 * 24 * 1000,
// };
// app.use(favicon(iconPath, options));

// Connect Database
connectDB();

// Init Middleware
// Make sure you can parse data in req.body
app.use(express.json({ extended: false }));

// Define Routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));

// Server static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  // test
  // Serve all paths to point to the client folder's build folder index.html file
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);
