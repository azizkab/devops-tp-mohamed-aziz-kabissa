const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const equipierRoutes = require("./routes/equipierRoutes");
const briefRoutes = require("./routes/briefRoutes");
const statsRoutes = require("./routes/statsRoutes");
const formationRoutes = require("./routes/formationRoutes");
const placementRoutes = require("./routes/placementRoutes");

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options(/.*/, cors());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("API OK 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/equipiers", equipierRoutes);
app.use("/api/briefs", briefRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/formations", formationRoutes);
app.use("/api/placements", placementRoutes);

module.exports = app;