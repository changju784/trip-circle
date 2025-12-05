import jwt from "jsonwebtoken";
import User from "../schema/UserSchema.js";

const authMiddleware = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  // Allow registration endpoint to bypass auth
  if (req.method === "POST" && req.path === "/api/users") {
    return next();
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      trips: user.trips
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(403).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
