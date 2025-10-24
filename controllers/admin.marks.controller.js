import Marks from "../model/Marks.js";
import Student from "../model/Student.js";  // ✅ use Student, not User

// ✅ Admin Add Marks
export const adminAddMarks = async (req, res) => {
  try {
    const { studentId, subject, marks, total, examType, examLabel, examDate, batch, semester, section } = req.body;

    // ✅ look for student in Student collection
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const doc = await Marks.create({
      student: studentId,
      subject,
      marks,
      total,
      examType,
      examLabel,
      examDate,
      batch: batch || student.batch,
      semester: semester || student.semester,
      section: section || student.section
    });

    return res.json({ success: true, message: "Marks added", marks: doc });
  } catch (e) {
    console.error("Error adding marks:", e);
    return res.status(500).json({ success: false, message: "Error adding marks" });
  }
};

// ✅ Update Marks
export const adminUpdateMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const doc = await Marks.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Marks not found" });
    return res.json({ success: true, message: "Marks updated", marks: doc });
  } catch (e) {
    console.error("Error updating marks:", e);
    return res.status(500).json({ success: false, message: "Error updating marks" });
  }
};

// ✅ Delete Marks
export const adminDeleteMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Marks.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: "Marks not found" });
    return res.json({ success: true, message: "Marks deleted" });
  } catch (e) {
    console.error("Error deleting marks:", e);
    return res.status(500).json({ success: false, message: "Error deleting marks" });
  }
};

// ✅ List Marks (with filters + pagination)
export const adminListMarks = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, examType, batch, semester, section, studentId } = req.query;

    const q = {};
    if (subject) q.subject = subject;
    if (examType) q.examType = examType;
    if (batch) q.batch = batch;
    if (semester) q.semester = Number(semester);
    if (section) q.section = section;
    if (studentId) q.student = studentId;

    const [items, count] = await Promise.all([
      Marks.find(q)
        .populate("student", "name rollNo className")  // ✅ show Student details
        .sort({ examDate: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Marks.countDocuments(q),
    ]);

    return res.json({ success: true, items, page: Number(page), pages: Math.ceil(count / limit), total: count });
  } catch (e) {
    console.error("Error fetching marks:", e);
    return res.status(500).json({ success: false, message: "Error fetching marks" });
  }
};
