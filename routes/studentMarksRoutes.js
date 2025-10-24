// routes/studentMarksRoutes.js//student dashboard
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Mark from "../model/Marks.js";

const router = express.Router();

// Get logged-in student's marks
router.get("/my-marks", authMiddleware, async (req, res) => {
  try {
    const marks = await Mark.find({ studentId: req.user.id })
      .populate("studentId", "name rollNo")
      .sort({ examDate: -1 });

    res.json({ marks });
  } catch (err) {
    console.error("Student marks error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
