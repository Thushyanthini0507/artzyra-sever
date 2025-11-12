import Admin from "../models/Admin.js";
import Artist from "../models/Artist.js";
import Customer from "../models/Customer.js";
import { generateToken } from "../config/jwt.js";
import { sendApprovalEmail } from "../utils/emailService.js";

// Register Admin
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
    });

    const token = generateToken({ id: admin._id, role: "admin" });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isApproved: admin.isApproved,
        },
        token,
      },
      message: "Admin registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Register Artist
const registerArtist = async (req, res, next) => {
  try {
    const { name, email, password, phone, bio, category, skills, hourlyRate } =
      req.body;

    const existingArtist = await Artist.findOne({ email });
    if (existingArtist) {
      return res.status(400).json({
        success: false,
        message: "Artist with this email already exists",
      });
    }

    const artist = await Artist.create({
      name,
      email,
      password,
      phone,
      bio,
      category,
      skills: skills || [],
      hourlyRate: hourlyRate || 0,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: artist._id,
          name: artist.name,
          email: artist.email,
          role: artist.role,
          isApproved: artist.isApproved,
        },
      },
      message:
        "Artist registered successfully. Please wait for admin approval.",
    });
  } catch (error) {
    next(error);
  }
};

// Register Customer
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }

    const customer = await Customer.create({
      name,
      email,
      password,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          isApproved: customer.isApproved,
        },
      },
      message:
        "Customer registered successfully. Please wait for admin approval.",
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and role",
      });
    }

    let User, userRole;
    if (role === "admin") {
      User = Admin;
      userRole = "admin";
    } else if (role === "artist") {
      User = Artist;
      userRole = "artist";
    } else if (role === "customer") {
      User = Customer;
      userRole = "customer";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is approved (admins are always approved)
    if (userRole !== "admin" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending approval. Please wait for admin approval.",
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const token = generateToken({ id: user._id, role: userRole });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userRole,
          isApproved: user.isApproved || true,
        },
        token,
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    // Since JWT tokens are stateless, logout is primarily handled client-side
    // by removing the token from storage. This endpoint validates the token
    // and confirms logout. For token blacklisting, you would need to implement
    // a token blacklist (Redis/database) and check it in authMiddleware.

    // Log user logout (optional - for analytics/audit)
    console.log(`User ${req.userId} (${req.userRole}) logged out`);

    res.json({
      success: true,
      message:
        "Logout successful. Please remove the token from client storage.",
      data: {
        userId: req.userId,
        role: req.userRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  registerAdmin,
  registerArtist,
  registerCustomer,
  login,
  getMe,
  logout,
};
