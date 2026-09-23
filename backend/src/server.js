const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("INDUSTRIA360 Backend API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`INDUSTRIA360 Backend running on port ${PORT}`);
});
