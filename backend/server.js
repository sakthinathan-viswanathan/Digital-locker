require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { testConnection: testFirestore } = require("./config/firebase");
const { testConnection: testSupabase } = require("./config/supabase");

const authRoutes = require("./routes/auth.routes");
const folderRoutes = require("./routes/folder.routes");
const fileRoutes = require("./routes/file.routes");

const app = express();

// Base64 file payloads inflate size by ~33%, so give express.json() headroom
// beyond MAX_UPLOAD_MB. This is the only "upload middleware" this app needs —
// no multer, no disk writes.
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 15);
app.use(express.json({ limit: `${Math.ceil(maxUploadMb * 1.4)}mb` }));

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors()
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "digital-locker-api", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Central error handler (catches JSON parse errors, CORS errors, etc.)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large" });
  }
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔐 Digital Locker API running on port ${PORT}`);
  testFirestore();
  testSupabase();
});
