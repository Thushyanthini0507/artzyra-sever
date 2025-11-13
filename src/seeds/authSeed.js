import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Customer from "../models/Customer.js";
import Artist from "../models/Artist.js";

// Load environment variables
dotenv.config();

/**
 * Authorization Seed Script
 * Seeds default roles and users into MongoDB
 */

const customers = [
  {
    customer_id: "CUST001",
    name: "John Doe",
    email: "john@example.com",
    password: "user123",
    phone: "+1234567891",
    address: "123 Main St, City, Country",
  },
  {
    customer_id: "CUST002",
    name: "Priya Kumar",
    email: "priya@example.com",
    password: "user123",
    phone: "+1234567892",
    address: "456 Oak Ave, City, Country",
  },
];

const artists = [
  {
    talent_id: "ART001",
    name: "Arjun Music",
    email: "arjun@example.com",
    password: "artist123",
    phone: "+1234567893",
    category: "Music",
    bio: "Professional musician with 10+ years of experience",
    experience: "10 years",
    portfolio_link: "https://portfolio.example.com/arjun",
    price_per_service: 5000,
    status: "Active",
  },
  {
    talent_id: "ART002",
    name: "Divya Dance",
    email: "divya@example.com",
    password: "artist123",
    phone: "+1234567894",
    category: "Dance",
    bio: "Professional dancer specializing in classical and contemporary styles",
    experience: "8 years",
    portfolio_link: "https://portfolio.example.com/divya",
    price_per_service: 4000,
    status: "Active",
  },
];

/**
 * Seed Customers
 */
const seedCustomers = async () => {
  try {
    for (const customerData of customers) {
      // Check if customer already exists
      const existingCustomer = await Customer.findOne({
        email: customerData.email,
      });

      if (existingCustomer) {
        console.log(
          `✓ Customer already exists, skipping: ${customerData.name}`
        );
        continue;
      }

      // Create customer (password will be hashed by pre-save hook)
      const customer = await Customer.create(customerData);

      console.log(
        `✓ Customer created successfully: ${customer.name} (${customer.email})`
      );
    }
  } catch (error) {
    console.error("✗ Error seeding customers:", error.message);
    throw error;
  }
};

/**
 * Seed Artists
 */
const seedArtists = async () => {
  try {
    for (const artistData of artists) {
      // Check if artist already exists
      const existingArtist = await Artist.findOne({
        email: artistData.email,
      });

      if (existingArtist) {
        console.log(`✓ Artist already exists, skipping: ${artistData.name}`);
        continue;
      }

      // Create artist (password will be hashed by pre-save hook)
      const artist = await Artist.create(artistData);

      console.log(
        `✓ Artist created successfully: ${artist.name} (${artist.email})`
      );
    }
  } catch (error) {
    console.error("✗ Error seeding artists:", error.message);
    throw error;
  }
};

/**
 * Main seed function
 */
const seedAuth = async () => {
  try {
    console.log("🌱 Starting authorization seed...\n");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected successfully\n");

    // Seed customers
    console.log("👥 Seeding Customers...");
    await seedCustomers();
    console.log("");

    // Seed artists
    console.log("🎨 Seeding Artists...");
    await seedArtists();
    console.log("");

    console.log("✅ Authorization seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run seed if this file is executed directly
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedAuth();
}

export default seedAuth;
