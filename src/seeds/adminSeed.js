/**
 * Admin Seed Script
 * Seeds a single admin user into the database
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import connectDB from "../config/db.js";

// Load environment variables
dotenv.config();

/**
 * Admin user data
 */
const adminData = {
  name: process.env.ADMIN_NAME || "Platform Admin",
  email: (process.env.ADMIN_EMAIL || "admin@artzyra.com").toLowerCase().trim(),
  password: process.env.ADMIN_PASSWORD || "SecureAdmin123!",
  role: "admin",
  isApproved: true,
  isActive: true,
};

/**
 * Seed Admin User
 */
const seedAdmin = async () => {
  try {
    console.log("🌱 Starting admin seed...\n");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await connectDB();
    console.log("✓ MongoDB connected successfully\n");

    // Remove existing admins
    const removedAdmins = await Admin.deleteMany({});
    console.log(
      `🧹 Removed ${removedAdmins.deletedCount} existing admin user(s)\n`
    );

    // Create admin user (password will be hashed by pre-save hook)
    const admin = await Admin.create(adminData);

    console.log(`✓ Admin user created successfully:`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}\n`);

    console.log("✅ Admin seed completed successfully!");
    console.log(`\n📝 Admin credentials:`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}\n`);
  } catch (error) {
    console.error("❌ Error during admin seeding:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run seed if this file is executed directly
seedAdmin();

export default seedAdmin;
