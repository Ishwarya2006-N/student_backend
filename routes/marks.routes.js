// routes/marks.routes.js
import express from "express";
import Marks from "../models/Marks.js";

const router = express.Router();

// POST /api/marks → Add marks
router.post("/", async (req, res) => {
  try {
    const { studentId, subject, score } = req.body;

    if (!studentId || !subject || !score) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const marks = new Marks({ studentId, subject, score });
    await marks.save();

    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
