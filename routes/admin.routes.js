import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";
import User from "../model/User.js"; // ✅ make sure this is correct path to your User model
import {
  adminCreateStudent,
  adminListStudents,
  adminUpdateStudent,
  adminDeleteStudent,
} from "../controllers/admin.students.controller.js";
import {
  adminAddMarks,
  adminUpdateMarks,
  adminDeleteMarks,
  adminListMarks
  
} from "../controllers/admin.marks.controller.js";
import {
  analyticsOverview,
  analyticsSubjectAverages,
  analyticsTopStudents,
  analyticsDistribution,
  analyticsTimeline,
} from "../controllers/admin.analytics.controller.js";

const router = express.Router();

// ✅ All admin routes protected
router.use(authMiddleware, authorizeRoles("admin"));

/** ------------------ Users Management ------------------ */

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get single user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create a new user
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.json({ success: true, message: "User created", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update user
router.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update only user role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Role is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User role updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Analytics main route - quick summary
router.get("/analytics", (req, res) => {
  res.json({
    success: true,
    message: "Available analytics endpoints",
    endpoints: [
      "/api/admin/analytics/overview",
      "/api/admin/analytics/subjects",
      "/api/admin/analytics/toppers",
      "/api/admin/analytics/distribution",
      "/api/admin/analytics/timeline",
    ],
  });
});


/** ------------------ Students Management ------------------ */
router.post("/students", adminCreateStudent);
router.get("/students", adminListStudents);
router.put("/students/:id", adminUpdateStudent);
router.delete("/students/:id", adminDeleteStudent);

/** ------------------ Marks Management ------------------ */
router.post("/marks", adminAddMarks);
router.get("/marks", adminListMarks);
router.put("/marks/:id", adminUpdateMarks);
router.delete("/marks/:id", adminDeleteMarks);
// router.post("/marks/bulk", adminBulkUploadMarks);

/** ------------------ Analytics ------------------ */
router.get("/analytics/overview", analyticsOverview);
router.get("/analytics/subjects", analyticsSubjectAverages);
router.get("/analytics/toppers", analyticsTopStudents);
router.get("/analytics/distribution", analyticsDistribution);
router.get("/analytics/timeline", analyticsTimeline);

export default router;
