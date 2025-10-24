// routes/student.routes.js
import express from "express";
import Student from "../model/Student.js";

const router = express.Router();

// POST /api/students → Create new student
router.post("/", async (req, res) => {
  try {
    const { name, rollNo, className } = req.body;

    if (!name || !rollNo || !className) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const student = new Student({ name, rollNo, className });
    await student.save();

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ GET /api/students → Fetch all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
