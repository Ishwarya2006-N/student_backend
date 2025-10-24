// controllers/analyticsController.js
import Marks from "../model/Marks.js";
import Student from "../model/Student.js";
import Attendance from "../model/Attendance.js"; // ⚡ new

// Helper: safely convert
const asNumber = (v) => (v === undefined ? undefined : Number(v));

/**
 * Overview: total students, total marks entries, average %, pass rate, attendance avg
 */
export const analyticsOverview = async (req, res) => {
  try {
    const { batch, semester, section, examType } = req.query;

    // 🎯 Students count
    const totalStudents = await Student.countDocuments({
      ...(batch && { batch }),
      ...(semester && { semester: Number(semester) }),
      ...(section && { section }),
    });

    // 🎯 Marks aggregation
    const matchMarks = {};
    if (batch) matchMarks.batch = batch;
    if (semester) matchMarks.semester = Number(semester);
    if (section) matchMarks.section = section;
    if (examType) matchMarks.examType = examType;

    const marksAgg = await Marks.aggregate([
      { $match: matchMarks },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          avgPercent: {
            $avg: { $multiply: [{ $divide: ["$marks", "$total"] }, 100] },
          },
          passRate: {
            $avg: {
              $cond: [
                {
                  $gte: [
                    { $multiply: [{ $divide: ["$marks", "$total"] }, 100] },
                    40,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const marksSummary = marksAgg[0] || {
      totalEntries: 0,
      avgPercent: 0,
      passRate: 0,
    };

    // 🎯 Attendance aggregation
    const matchAtt = {};
    if (batch) matchAtt.batch = batch;
    if (semester) matchAtt.semester = Number(semester);
    if (section) matchAtt.section = section;

    const attAgg = await Attendance.aggregate([
      { $match: matchAtt },
      {
        $group: {
          _id: null,
          avgAttendance: {
            $avg: {
              $multiply: [{ $divide: ["$presentDays", "$totalDays"] }, 100],
            },
          },
        },
      },
    ]);

    const attSummary = attAgg[0] || { avgAttendance: 0 };

    return res.json({
      success: true,
      overview: {
        students: totalStudents,
        totalEntries: marksSummary.totalEntries,
        averagePercentage: Number(marksSummary.avgPercent.toFixed(2)),
        passRate: Number((marksSummary.passRate * 100).toFixed(2)),
        averageAttendance: Number(attSummary.avgAttendance.toFixed(2)), // ⚡ new
      },
    });
  } catch (e) {
    console.error("Analytics overview error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Error computing overview" });
  }
};

/**
 * Subject averages
 */
export const analyticsSubjectAverages = async (req, res) => {
  try {
    const { batch, semester, section, examType } = req.query;

    const match = {};
    if (batch) match.batch = batch;
    if (semester) match.semester = Number(semester);
    if (section) match.section = section;
    if (examType) match.examType = examType;

    const data = await Marks.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$subject",
          avgPercent: {
            $avg: { $multiply: [{ $divide: ["$marks", "$total"] }, 100] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          subject: "$_id",
          _id: 0,
          avgPercent: { $round: ["$avgPercent", 2] },
          count: 1,
        },
      },
      { $sort: { avgPercent: -1 } },
    ]);

    return res.json({ success: true, subjects: data });
  } catch (e) {
    console.error("Subject averages error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Error computing subject averages" });
  }
};

/**
 * Top students (with attendance)
 */
export const analyticsTopStudents = async (req, res) => {
  try {
    const { batch, semester, section, examType, limit = 10 } = req.query;

    const match = {};
    if (batch) match.batch = batch;
    if (semester) match.semester = Number(semester);
    if (section) match.section = section;
    if (examType) match.examType = examType;

    const agg = await Marks.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$student",
          avgPercent: {
            $avg: { $multiply: [{ $divide: ["$marks", "$total"] }, 100] },
          },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "attendances", // ⚡ join attendance
          localField: "_id",
          foreignField: "student",
          as: "attendance",
        },
      },
      { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: "$student._id",
          name: "$student.name",
          rollNo: "$student.rollNo",
          className: "$student.className",
          avgPercent: { $round: ["$avgPercent", 2] },
          attendancePercent: {
            $round: [
              {
                $cond: [
                  { $gt: ["$attendance.totalDays", 0] },
                  {
                    $multiply: [
                      { $divide: ["$attendance.presentDays", "$attendance.totalDays"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { avgPercent: -1 } },
      { $limit: Number(limit) },
    ]);

    return res.json({ success: true, toppers: agg });
  } catch (e) {
    console.error("Top students error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Error computing toppers" });
  }
};

/**
 * Marks distribution (histogram)
 */
export const analyticsDistribution = async (req, res) => {
  try {
    const { batch, semester, section, subject, bins = "0-40,40-60,60-75,75-90,90-100" } = req.query;

    const match = {};
    if (batch) match.batch = batch;
    if (semester) match.semester = Number(semester);
    if (section) match.section = section;
    if (subject) match.subject = subject;

    const ranges = String(bins).split(",").map(r => r.split("-").map(Number));

    const data = await Marks.aggregate([
      { $match: match },
      { $project: { percent: { $multiply: [{ $divide: ["$marks", "$total"] }, 100] } } }
    ]);

    const counts = ranges.map(() => 0);
    data.forEach(d => {
      const p = d.percent;
      ranges.forEach((r, i) => {
        const [lo, hi] = r;
        const cond = i === ranges.length - 1 ? p >= lo && p <= hi : p >= lo && p < hi;
        if (cond) counts[i] += 1;
      });
    });

    const histogram = ranges.map((r, i) => ({ range: `${r[0]}-${r[1]}`, count: counts[i] }));

    return res.json({ success: true, histogram });
  } catch (e) {
    console.error("Distribution error:", e);
    return res.status(500).json({ success: false, message: "Error computing distribution" });
  }
};

/**
 * Timeline of exams
 */
export const analyticsTimeline = async (req, res) => {
  try {
    const { batch, semester, section, subject } = req.query;

    const match = {};
    if (batch) match.batch = batch;
    if (semester) match.semester = Number(semester);
    if (section) match.section = section;
    if (subject) match.subject = subject;

    const agg = await Marks.aggregate([
      { $match: match },
      {
        $group: {
          _id: { label: "$examLabel", date: "$examDate" },
          avgPercent: { $avg: { $multiply: [{ $divide: ["$marks", "$total"] }, 100] } },
        },
      },
      {
        $project: {
          examLabel: "$_id.label",
          examDate: "$_id.date",
          avgPercent: { $round: ["$avgPercent", 2] },
        },
      },
      { $sort: { examDate: 1 } },
    ]);

    return res.json({ success: true, timeline: agg });
  } catch (e) {
    console.error("Timeline error:", e);
    return res.status(500).json({ success: false, message: "Error computing timeline" });
  }
};
