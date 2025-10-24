import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Student from "../model/Student.js";

const router = express.Router();

// Get logged-in student's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate("user", "name email role")
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error("Student profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update or create student profile
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { rollNo, className, batch, section } = req.body;

    let student = await Student.findOne({ user: req.user.id });

    if (!student) {
      // create new profile
      student = new Student({
        user: req.user.id,
        rollNo,
        className,
        batch,
        section,
      });
      await student.save();
    } else {
      // update existing
      student.rollNo = rollNo;
      student.className = className;
      student.batch = batch;
      student.section = section;
      await student.save();
    }

    // return with populated user
    const populatedStudent = await Student.findById(student._id)
      .populate("user", "name email role");

    res.json({
      success: true,
      message: student ? "Profile updated" : "Profile created",
      student: populatedStudent,
    });
  } catch (err) {
    console.error("Student update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
