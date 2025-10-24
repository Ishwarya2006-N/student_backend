import express from "express";
import { register, login, logout } from "../controllers/authController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected route - Student & Admin
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Admin only route
router.get("/admin/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, message: "Welcome Admin" });
});

export default router;
