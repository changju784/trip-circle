import dotenv from 'dotenv';
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import logger from "../config/logger.js";

const router = express.Router();

dotenv.config();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user by email (include password for verification)
    const user = await User.findOne({ email });
    
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for email: ${email} - invalid password`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token with user info
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    logger.info(`User logged in successfully: ${email}`);

    // Return token and user info (without password)
    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        dateCreated: user.dateCreated
      }
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
