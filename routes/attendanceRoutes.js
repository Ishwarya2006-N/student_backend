//attendanceRoutes.js
import express from "express";
import Attendance from "../model/Attendance.js";
import Student from "../model/Student.js";

const router = express.Router();

/**
 * ✅ Create new attendance record
 */
router.post("/", async (req, res) => {
  try {
    const { studentId, presentDays, totalDays } = req.body;

    if (!studentId || presentDays == null || totalDays == null) {
      return res.status(400).json({ message: "All fields required" });
    }

    const attendance = new Attendance({
      student: studentId,
      presentDays,
      totalDays,
    });

    await attendance.save();

    res.status(201).json({ message: "Attendance saved", attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ Get all attendance records (with student details)
 */
router.get("/", async (req, res) => {
  try {
    const records = await Attendance.find().populate("student", "name rollNo");
    res.json({ attendance: records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ Attendance Summary (average percentage across all students)
 */
router.get("/summary", async (req, res) => {
  try {
    const records = await Attendance.find();
    if (records.length === 0) {
      return res.json({ avgAttendance: 0 });
    }

    const totalPercentage = records.reduce((acc, r) => {
      return acc + (r.totalDays > 0 ? (r.presentDays / r.totalDays) * 100 : 0);
    }, 0);

    const avgAttendance = (totalPercentage / records.length).toFixed(2);

    res.json({ avgAttendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ Attendance Distribution (percentage for each student)
 */
router.get("/distribution", async (req, res) => {
  try {
    const records = await Attendance.find().populate("student", "name");
    const distribution = records.map((r) => ({
      student: r.student ? r.student.name : "Unknown",
      percentage:
        r.totalDays > 0 ? ((r.presentDays / r.totalDays) * 100).toFixed(2) : 0,
    }));

    res.json({ distribution });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
