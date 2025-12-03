import dotenv from 'dotenv';
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

dotenv.config();

router.post("/", (req, res) => {
  const { username, password } = req.body;

  // Example hard-coded check — replace with DB lookup
  if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { username, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

export default router;
