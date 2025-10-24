import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../model/User.js";
import Student from "../model/Student.js"; 

// REGISTER
export const register = async (req, res) => {
  const { name, email, password, adminKey } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role = student
    let role = "student";

    // If user entered correct adminKey, set role = admin
    if (adminKey && adminKey === process.env.ADMIN_KEY) {
      role = "admin";
    }

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // 🔹 If student → create empty student profile linked to user
    if (role === "student") {
      const student = new Student({
        user: newUser._id,
        name: newUser.name, // store student name here
        rollNo: "",
        className: "",
        batch: "",
        section: "",
      });
      await student.save();
    }

    res.json({ success: true, message: `User registered as ${role}` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, { httpOnly: true });

    let studentProfile = null;

    // 🔹 Fetch student profile if user is student
    if (user.role === "student") {
      studentProfile = await Student.findOne({ user: user._id }).select("-__v -createdAt -updatedAt");
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(studentProfile && { student: studentProfile }),
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
