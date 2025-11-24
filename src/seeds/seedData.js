/**
 * Database Seed Script
 * Populates database with dummy data for testing
 * Matches the new single users table + profile tables architecture
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import Artist from "../models/Artist.js";
import Category from "../models/Category.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Admin.deleteMany({});
    await Customer.deleteMany({});
    await Artist.deleteMany({});
    await Category.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    console.log("Existing data cleared");

    // 1. Create Categories
    console.log("Creating categories...");
    const categories = await Category.insertMany([
      {
        name: "Photographer",
        description: "Professional photographers for events, portraits, and commercial work",
        image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400",
        isActive: true,
      },
      {
        name: "DJ",
        description: "Professional DJs for parties, weddings, and events",
        image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400",
        isActive: true,
      },
      {
        name: "Musician",
        description: "Talented musicians for live performances",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
        isActive: true,
      },
      {
        name: "Painter",
        description: "Artists specializing in portraits, murals, and custom artwork",
        image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
        isActive: true,
      },
      {
        name: "Dancer",
        description: "Professional dancers and choreographers",
        image: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400",
        isActive: true,
      },
    ]);
    console.log(`Created ${categories.length} categories`);

    // 2. Create Admin User
    console.log("Creating admin user...");
    const adminUser = await User.create({
      email: "admin@artzyra.com",
      password: "admin123",
      role: "admin",
      isActive: true,
    });

    const admin = await Admin.create({
      userId: adminUser._id,
      permissions: ["all"],
    });
    console.log("Admin created:", adminUser.email);

    // 3. Create Customer Users and Profiles
    console.log("Creating customers...");
    const customerUsers = await User.insertMany([
      {
        email: "customer1@example.com",
        password: "customer123",
        role: "customer",
        isActive: true,
      },
      {
        email: "customer2@example.com",
        password: "customer123",
        role: "customer",
        isActive: true,
      },
      {
        email: "customer3@example.com",
        password: "customer123",
        role: "customer",
        isActive: true,
      },
      {
        email: "customer4@example.com",
        password: "customer123",
        role: "customer",
        isActive: true,
      },
      {
        email: "customer5@example.com",
        password: "customer123",
        role: "customer",
        isActive: true,
      },
    ]);

    const customers = await Customer.insertMany([
      {
        userId: customerUsers[0]._id,
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
        profileImage: "https://i.pravatar.cc/150?img=1",
        isActive: true,
      },
      {
        userId: customerUsers[1]._id,
        address: {
          street: "456 Oak Avenue",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90001",
          country: "USA",
        },
        profileImage: "https://i.pravatar.cc/150?img=2",
        isActive: true,
      },
      {
        userId: customerUsers[2]._id,
        address: {
          street: "789 Pine Road",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "USA",
        },
        profileImage: "https://i.pravatar.cc/150?img=3",
        isActive: true,
      },
      {
        userId: customerUsers[3]._id,
        address: {
          street: "321 Elm Street",
          city: "Houston",
          state: "TX",
          zipCode: "77001",
          country: "USA",
        },
        profileImage: "https://i.pravatar.cc/150?img=4",
        isActive: true,
      },
      {
        userId: customerUsers[4]._id,
        address: {
          street: "654 Maple Drive",
          city: "Phoenix",
          state: "AZ",
          zipCode: "85001",
          country: "USA",
        },
        profileImage: "https://i.pravatar.cc/150?img=5",
        isActive: true,
      },
    ]);
    console.log(`Created ${customers.length} customers`);

    // 4. Create Artist Users and Profiles
    console.log("Creating artists...");
    const artistUsers = await User.insertMany([
      {
        email: "artist1@example.com",
        password: "artist123",
        role: "artist",
        isActive: true,
      },
      {
        email: "artist2@example.com",
        password: "artist123",
        role: "artist",
        isActive: true,
      },
      {
        email: "artist3@example.com",
        password: "artist123",
        role: "artist",
        isActive: true,
      },
      {
        email: "artist4@example.com",
        password: "artist123",
        role: "artist",
        isActive: true,
      },
      {
        email: "artist5@example.com",
        password: "artist123",
        role: "artist",
        isActive: true,
      },
      {
        email: "artist6@example.com",
        password: "artist123",
        role: "artist",
        isActive: true,
      },
    ]);

    const artists = await Artist.insertMany([
      {
        userId: artistUsers[0]._id,
        bio: "Professional photographer with 10+ years of experience in wedding and event photography. Specialized in capturing beautiful moments.",
        profileImage: "https://i.pravatar.cc/150?img=11",
        category: categories[0]._id, // Photographer
        skills: ["Wedding Photography", "Event Photography", "Portrait Photography", "Photo Editing"],
        hourlyRate: 150,
        availability: new Map([
          ["monday", { start: "09:00", end: "18:00", available: true }],
          ["tuesday", { start: "09:00", end: "18:00", available: true }],
          ["wednesday", { start: "09:00", end: "18:00", available: true }],
          ["thursday", { start: "09:00", end: "18:00", available: true }],
          ["friday", { start: "09:00", end: "18:00", available: true }],
        ]),
        rating: 4.8,
        totalReviews: 25,
        status: "approved",
        verifiedAt: new Date(),
      },
      {
        userId: artistUsers[1]._id,
        bio: "Professional DJ with expertise in mixing music for weddings, parties, and corporate events. I bring the energy!",
        profileImage: "https://i.pravatar.cc/150?img=12",
        category: categories[1]._id, // DJ
        skills: ["Music Mixing", "Sound Engineering", "MC Services", "Lighting"],
        hourlyRate: 200,
        availability: new Map([
          ["friday", { start: "18:00", end: "02:00", available: true }],
          ["saturday", { start: "18:00", end: "02:00", available: true }],
          ["sunday", { start: "18:00", end: "02:00", available: true }],
        ]),
        rating: 4.9,
        totalReviews: 40,
        status: "approved",
        verifiedAt: new Date(),
      },
      {
        userId: artistUsers[2]._id,
        bio: "Talented guitarist specializing in acoustic and electric performances. Available for events, recordings, and lessons.",
        profileImage: "https://i.pravatar.cc/150?img=13",
        category: categories[2]._id, // Musician
        skills: ["Acoustic Guitar", "Electric Guitar", "Music Composition", "Live Performance"],
        hourlyRate: 120,
        availability: new Map([
          ["monday", { start: "10:00", end: "20:00", available: true }],
          ["tuesday", { start: "10:00", end: "20:00", available: true }],
          ["wednesday", { start: "10:00", end: "20:00", available: true }],
          ["thursday", { start: "10:00", end: "20:00", available: true }],
          ["friday", { start: "10:00", end: "20:00", available: true }],
        ]),
        rating: 4.7,
        totalReviews: 18,
        status: "approved",
        verifiedAt: new Date(),
      },
      {
        userId: artistUsers[3]._id,
        bio: "Professional painter creating beautiful portraits, murals, and custom artwork. Let's bring your vision to life!",
        profileImage: "https://i.pravatar.cc/150?img=14",
        category: categories[3]._id, // Painter
        skills: ["Portrait Painting", "Mural Art", "Custom Artwork", "Digital Art"],
        hourlyRate: 100,
        availability: new Map([
          ["monday", { start: "09:00", end: "17:00", available: true }],
          ["tuesday", { start: "09:00", end: "17:00", available: true }],
          ["wednesday", { start: "09:00", end: "17:00", available: true }],
          ["thursday", { start: "09:00", end: "17:00", available: true }],
          ["friday", { start: "09:00", end: "17:00", available: true }],
        ]),
        rating: 4.6,
        totalReviews: 12,
        status: "approved",
        verifiedAt: new Date(),
      },
      {
        userId: artistUsers[4]._id,
        bio: "Professional dancer and choreographer. Specialized in contemporary, hip-hop, and ballroom dance styles.",
        profileImage: "https://i.pravatar.cc/150?img=15",
        category: categories[4]._id, // Dancer
        skills: ["Contemporary Dance", "Hip-Hop", "Ballroom", "Choreography"],
        hourlyRate: 130,
        availability: new Map([
          ["monday", { start: "14:00", end: "22:00", available: true }],
          ["tuesday", { start: "14:00", end: "22:00", available: true }],
          ["wednesday", { start: "14:00", end: "22:00", available: true }],
          ["thursday", { start: "14:00", end: "22:00", available: true }],
          ["friday", { start: "14:00", end: "22:00", available: true }],
        ]),
        rating: 4.5,
        totalReviews: 8,
        status: "approved",
        verifiedAt: new Date(),
      },
      {
        userId: artistUsers[5]._id,
        bio: "Upcoming photographer looking to build my portfolio. Specialized in portrait and lifestyle photography.",
        profileImage: "https://i.pravatar.cc/150?img=16",
        category: categories[0]._id, // Photographer
        skills: ["Portrait Photography", "Lifestyle Photography", "Photo Editing"],
        hourlyRate: 80,
        availability: new Map([
          ["saturday", { start: "10:00", end: "18:00", available: true }],
          ["sunday", { start: "10:00", end: "18:00", available: true }],
        ]),
        rating: 0,
        totalReviews: 0,
        status: "pending", // This artist is pending approval
      },
    ]);
    console.log(`Created ${artists.length} artists (${artists.filter(a => a.status === 'approved').length} approved, ${artists.filter(a => a.status === 'pending').length} pending)`);

    // 5. Create Bookings
    console.log("Creating bookings...");
    const bookings = await Booking.insertMany([
      {
        customer: customers[0]._id,
        artist: artists[0]._id,
        category: categories[0]._id,
        bookingDate: new Date("2024-12-25"),
        startTime: "10:00",
        endTime: "14:00",
        duration: 4,
        totalAmount: 600,
        status: "accepted",
        paymentStatus: "paid",
        location: "123 Wedding Venue, New York",
        specialRequests: "Please bring backup equipment",
      },
      {
        customer: customers[1]._id,
        artist: artists[1]._id,
        category: categories[1]._id,
        bookingDate: new Date("2024-12-31"),
        startTime: "20:00",
        endTime: "02:00",
        duration: 6,
        totalAmount: 1200,
        status: "pending",
        paymentStatus: "pending",
        location: "456 Party Hall, Los Angeles",
        specialRequests: "Need sound system for 200 people",
      },
      {
        customer: customers[2]._id,
        artist: artists[2]._id,
        category: categories[2]._id,
        bookingDate: new Date("2025-01-15"),
        startTime: "18:00",
        endTime: "20:00",
        duration: 2,
        totalAmount: 240,
        status: "accepted",
        paymentStatus: "paid",
        location: "789 Restaurant, Chicago",
        specialRequests: "Acoustic set preferred",
      },
      {
        customer: customers[0]._id,
        artist: artists[3]._id,
        category: categories[3]._id,
        bookingDate: new Date("2025-01-20"),
        startTime: "10:00",
        endTime: "16:00",
        duration: 6,
        totalAmount: 600,
        status: "completed",
        paymentStatus: "paid",
        location: "321 Art Studio, New York",
        specialRequests: "Portrait painting session",
      },
      {
        customer: customers[3]._id,
        artist: artists[4]._id,
        category: categories[4]._id,
        bookingDate: new Date("2025-02-01"),
        startTime: "19:00",
        endTime: "21:00",
        duration: 2,
        totalAmount: 260,
        status: "pending",
        paymentStatus: "pending",
        location: "654 Dance Studio, Houston",
        specialRequests: "Hip-hop performance",
      },
    ]);
    console.log(`Created ${bookings.length} bookings`);

    // 6. Create Reviews
    console.log("Creating reviews...");
    const reviews = await Review.insertMany([
      {
        customer: customers[0]._id,
        artist: artists[0]._id,
        booking: bookings[0]._id,
        rating: 5,
        comment: "Excellent photographer! Captured all the beautiful moments perfectly. Highly recommended!",
        isVisible: true,
      },
      {
        customer: customers[2]._id,
        artist: artists[2]._id,
        booking: bookings[2]._id,
        rating: 4,
        comment: "Great performance! The acoustic set was perfect for our event. Very professional.",
        isVisible: true,
      },
      {
        customer: customers[0]._id,
        artist: artists[3]._id,
        booking: bookings[3]._id,
        rating: 5,
        comment: "Amazing artist! The portrait turned out exactly as I envisioned. Will definitely book again!",
        isVisible: true,
      },
    ]);
    console.log(`Created ${reviews.length} reviews`);

    // 7. Create Payments
    console.log("Creating payments...");
    const payments = await Payment.insertMany([
      {
        customer: customers[0]._id,
        artist: artists[0]._id,
        booking: bookings[0]._id,
        amount: 600,
        status: "completed",
        paymentMethod: "Card",
        transactionId: "TXN001",
      },
      {
        customer: customers[2]._id,
        artist: artists[2]._id,
        booking: bookings[2]._id,
        amount: 240,
        status: "completed",
        paymentMethod: "Online",
        transactionId: "TXN002",
      },
      {
        customer: customers[0]._id,
        artist: artists[3]._id,
        booking: bookings[3]._id,
        amount: 600,
        status: "completed",
        paymentMethod: "Card",
        transactionId: "TXN003",
      },
    ]);
    console.log(`Created ${payments.length} payments`);

    // Update bookings with payment references
    await Booking.findByIdAndUpdate(bookings[0]._id, { payment: payments[0]._id });
    await Booking.findByIdAndUpdate(bookings[2]._id, { payment: payments[1]._id });
    await Booking.findByIdAndUpdate(bookings[3]._id, { payment: payments[2]._id });

    // 8. Create Notifications
    console.log("Creating notifications...");
    const notifications = await Notification.insertMany([
      {
        user: customerUsers[1]._id,
        userModel: "Customer",
        type: "booking_request",
        title: "New Booking Request",
        message: "You have a new booking request from a customer",
        relatedId: bookings[1]._id,
        relatedModel: "Booking",
        isRead: false,
      },
      {
        user: artistUsers[1]._id,
        userModel: "Artist",
        type: "booking_request",
        title: "New Booking Request",
        message: "You have received a new booking request for your DJ services",
        relatedId: bookings[1]._id,
        relatedModel: "Booking",
        isRead: false,
      },
      {
        user: customerUsers[0]._id,
        userModel: "Customer",
        type: "booking_accepted",
        title: "Booking Accepted",
        message: "Your booking has been accepted by the artist",
        relatedId: bookings[0]._id,
        relatedModel: "Booking",
        isRead: true,
      },
    ]);
    console.log(`Created ${notifications.length} notifications`);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${categories.length} Categories`);
    console.log(`   - 1 Admin`);
    console.log(`   - ${customers.length} Customers`);
    console.log(`   - ${artists.length} Artists`);
    console.log(`   - ${bookings.length} Bookings`);
    console.log(`   - ${reviews.length} Reviews`);
    console.log(`   - ${payments.length} Payments`);
    console.log(`   - ${notifications.length} Notifications`);
    console.log("\n🔑 Test Credentials:");
    console.log("   Admin: admin@artzyra.com / admin123");
    console.log("   Customer: customer1@example.com / customer123");
    console.log("   Artist: artist1@example.com / artist123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
seedData();

