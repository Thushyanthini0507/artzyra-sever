import { verifyToken } from "../config/jwt.js";
import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";

const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      // Find user based on role
      let user;
      if (decoded.role === "admin") {
        user = await Admin.findById(decoded.id).select("-password");
      } else if (decoded.role === "artist") {
        user = await Artist.findById(decoded.id).select("-password");
      } else if (decoded.role === "customer") {
        user = await Customer.findById(decoded.id).select("-password");
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;
      req.userId = decoded.id;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};

export default authenticate;
