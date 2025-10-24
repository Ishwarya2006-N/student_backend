// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

// Routes
import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/admin.routes.js";
import studentRouter from "./routes/student.routes.js";
import studentRoutes from "./routes/studentRoutes.js";
import studentMarksRoutes from "./routes/studentMarksRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

const app = express();

// Use dynamic port for Render, fallback to 4000 for local dev
const port = process.env.PORT || 4000;

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // local Vite dev
  "http://localhost:5174", // alternate local dev
  "https://analysis-frontend-five.vercel.app" // deployed frontend
];

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman or server-to-server
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/students", studentRouter);
app.use("/api/student", studentRoutes);
app.use("/api/student", studentMarksRoutes);
app.use("/api/attendance", attendanceRoutes);

// Root route to check if server is live
app.get("/", (req, res) => {
  res.send("✅ Backend is live and CORS is working!");
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
