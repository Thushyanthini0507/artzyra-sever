/**
 * Platform Seed Script
 * Seeds baseline data for admin, categories, users, bookings, payments, reviews, and notifications.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Category from "../models/Category.js";
import Customer from "../models/Customer.js";
import Artist from "../models/Artist.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";

// Load environment variables
dotenv.config();

const adminData = {
  name: "Admin",
  email: "admin12@gmail.com",
  password: "admin123",
  role: "admin",
  isApproved: true,
  isActive: true,
};

const seedDatabase = async () => {
  try {
    console.log(" Starting platform seed...\n");

    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("✓ MongoDB connected successfully\n");

    // Seed admin - New architecture: Create User first, then Admin profile
    let adminUser = await User.findOne({
      email: adminData.email,
      role: "admin",
    });
    let admin = null;

    if (!adminUser) {
      // Step 1: Create user in Users collection
      adminUser = await User.create({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password, // Will be hashed by pre-save hook
        role: "admin",
        isApproved: true, // Admins are auto-approved
        isActive: true,
      });

      // Step 2: Create Admin profile
      admin = await Admin.create({
        userId: adminUser._id,
        permissions: [],
        isApproved: true,
      });

      // Step 3: Link User to Admin profile
      adminUser.profileRef = admin._id;
      adminUser.profileType = "Admin";
      await adminUser.save();

      console.log(`✓ Admin seeded: ${adminUser.email}`);
    } else {
      // Admin user exists, fetch the profile
      admin = await Admin.findOne({ userId: adminUser._id });
      console.log(`ℹAdmin already exists: ${adminUser.email}`);
    }

    console.log("\nPlatform seed completed successfully!");
  } catch (error) {
    console.error("Error during platform seeding:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  }
};

seedDatabase();

export default seedDatabase;
