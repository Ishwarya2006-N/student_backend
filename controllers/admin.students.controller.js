import bcrypt from "bcryptjs";
import User from "../model/User.js";

export const adminCreateStudent = async (req, res) => {
  try {
    const { name, email, password, rollNo, batch, semester, section } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.json({ success: false, message: "Email already exists" });

    const hash = await bcrypt.hash(password || email, 10); // simple default
    const user = await User.create({
      name, email, password: hash, role: "student", rollNo, batch, semester, section
    });
    return res.json({ success: true, message: "Student created", user: { id: user._id, name, email } });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Error creating student" });
  }
};

export const adminListStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", batch, semester, section } = req.query;
    const query = { role: "student" };
    if (q) query.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }, { rollNo: new RegExp(q, "i") }];
    if (batch) query.batch = batch;
    if (semester) query.semester = Number(semester);
    if (section) query.section = section;

    const [items, count] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).select("-password"),
      User.countDocuments(query)
    ]);

    return res.json({ success: true, items, page: Number(page), pages: Math.ceil(count / limit), total: count });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Error fetching students" });
  }
};

export const adminUpdateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, rollNo, batch, semester, section, password } = req.body;

    const update = { name, email, rollNo, batch, semester, section };
    if (password) update.password = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate({ _id: id, role: "student" }, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });

    return res.json({ success: true, message: "Student updated", user });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Error updating student" });
  }
};

export const adminDeleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ _id: id, role: "student" });
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });
    return res.json({ success: true, message: "Student deleted" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Error deleting student" });
  }
};
