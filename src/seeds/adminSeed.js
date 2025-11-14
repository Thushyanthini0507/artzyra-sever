/**
 * Platform Seed Script
 * Seeds baseline data for admin, categories, users, bookings, payments, reviews, and notifications.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
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

const categoryData = [
  {
    name: "Wedding Photography",
    description:
      "Capture unforgettable wedding moments with expert photographers.",
    image: "https://example.com/images/wedding-photography.jpg",
  },
  {
    name: "Live Music",
    description: "Live bands and solo artists for any special occasion.",
    image: "https://example.com/images/live-music.jpg",
  },
  {
    name: "Event Planning",
    description:
      "Professional planners to execute flawless events from start to finish.",
    image: "https://example.com/images/event-planning.jpg",
  },
];

const customerData = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "customer123",
    phone: "+1234567891",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
    isApproved: true,
  },
  {
    name: "Priya Kumar",
    email: "priya.kumar@example.com",
    password: "customer123",
    phone: "+1234567892",
    address: {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA",
    },
    isApproved: true,
  },
];

const artistData = [
  {
    name: "Sophia Lens",
    email: "sophia.lens@example.com",
    password: "artist123",
    phone: "+1234567893",
    bio: "Award-winning wedding photographer with a passion for storytelling.",
    categoryName: "Wedding Photography",
    skills: ["Photography", "Photo Editing", "Lighting"],
    hourlyRate: 150,
    isApproved: true,
  },
  {
    name: "Rhythm Collective",
    email: "rhythm.collective@example.com",
    password: "artist123",
    phone: "+1234567894",
    bio: "Energetic live band specializing in weddings and corporate events.",
    categoryName: "Live Music",
    skills: ["Vocals", "Guitar", "Drums"],
    hourlyRate: 200,
    isApproved: false,
  },
];

const bookingsData = [
  {
    reference: "booking_completed",
    customerEmail: "john.doe@example.com",
    artistEmail: "sophia.lens@example.com",
    categoryName: "Wedding Photography",
    bookingDate: new Date("2024-01-15T14:00:00Z"),
    startTime: "14:00",
    endTime: "18:00",
    duration: 4,
    totalAmount: 1200,
    status: "completed",
    specialRequests: "Capture candid moments and family portraits.",
    location: "Downtown Loft Venue",
    paymentStatus: "paid",
  },
  {
    reference: "booking_pending",
    customerEmail: "priya.kumar@example.com",
    artistEmail: "rhythm.collective@example.com",
    categoryName: "Live Music",
    bookingDate: new Date("2024-02-10T19:00:00Z"),
    startTime: "19:00",
    endTime: "22:00",
    duration: 3,
    totalAmount: 900,
    status: "pending",
    specialRequests: "Include a mix of pop and classic hits.",
    location: "City Ballroom",
    paymentStatus: "pending",
  },
];

const paymentsData = [
  {
    reference: "payment_completed",
    bookingRef: "booking_completed",
    amount: 1200,
    paymentMethod: "Card",
    transactionId: "TXN-BOOKING-COMPLETE-001",
    status: "completed",
  },
];

const reviewsData = [
  {
    bookingRef: "booking_completed",
    rating: 5,
    comment: "Outstanding photography! We love every single shot.",
  },
];

const notificationsData = [
  {
    userEmail: "sophia.lens@example.com",
    userModel: "Artist",
    type: "booking_completed",
    title: "Booking Completed",
    message: "Great job! Your booking with John Doe has been completed.",
    relatedModel: "Booking",
    relatedRef: "booking_completed",
  },
  {
    userEmail: "john.doe@example.com",
    userModel: "Customer",
    type: "review_received",
    title: "Review Submitted",
    message: "Thank you for sharing your experience with Sophia Lens.",
    relatedModel: "Review",
    relatedRef: "booking_completed",
  },
];

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting platform seed...\n");

    console.log("📡 Connecting to MongoDB...");
    await connectDB();
    console.log("✓ MongoDB connected successfully\n");

    // Seed admin
    let admin = await Admin.findOne({ email: adminData.email });
    if (!admin) {
      admin = await Admin.create(adminData);
      console.log(`✓ Admin seeded: ${admin.email}`);
    } else {
      console.log(`ℹ️  Admin already exists: ${admin.email}`);
    }

    // Seed categories
    const categoryMap = new Map();
    for (const category of categoryData) {
      const existing = await Category.findOne({ name: category.name });
      if (existing) {
        categoryMap.set(category.name, existing);
        console.log(`ℹ️  Category exists, skipping: ${category.name}`);
        continue;
      }
      const createdCategory = await Category.create(category);
      categoryMap.set(category.name, createdCategory);
      console.log(`✓ Category created: ${category.name}`);
    }

    // Seed customers
    const customerMap = new Map();
    for (const customer of customerData) {
      const existing = await Customer.findOne({ email: customer.email });
      if (existing) {
        customerMap.set(customer.email, existing);
        console.log(`ℹ️  Customer exists, skipping: ${customer.email}`);
        continue;
      }
      const createdCustomer = await Customer.create(customer);
      customerMap.set(customer.email, createdCustomer);
      console.log(`✓ Customer created: ${customer.email}`);
    }

    // Seed artists
    const artistMap = new Map();
    for (const artist of artistData) {
      const category = categoryMap.get(artist.categoryName);
      if (!category) {
        console.warn(`⚠️  Category not found for artist ${artist.email}, skipping.`);
        continue;
      }

      const existing = await Artist.findOne({ email: artist.email });
      if (existing) {
        artistMap.set(artist.email, existing);
        console.log(`ℹ️  Artist exists, skipping: ${artist.email}`);
        continue;
      }

      const createdArtist = await Artist.create({
        name: artist.name,
        email: artist.email,
        password: artist.password,
        phone: artist.phone,
        bio: artist.bio,
        category: category._id,
        skills: artist.skills,
        hourlyRate: artist.hourlyRate,
        isApproved: artist.isApproved,
      });

      artistMap.set(artist.email, createdArtist);
      console.log(`✓ Artist created: ${artist.email}`);
    }

    // Seed bookings
    const bookingMap = new Map();
    for (const booking of bookingsData) {
      const customer = customerMap.get(booking.customerEmail);
      const artist = artistMap.get(booking.artistEmail);
      const category = categoryMap.get(booking.categoryName);

      if (!customer || !artist || !category) {
        console.warn(
          `⚠️  Missing relation for booking ${booking.reference}. Skipping.`
        );
        continue;
      }

      const existing = await Booking.findOne({
        customer: customer._id,
        artist: artist._id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
      });

      if (existing) {
        bookingMap.set(booking.reference, existing);
        console.log(`ℹ️  Booking exists, skipping: ${booking.reference}`);
        continue;
      }

      const createdBooking = await Booking.create({
        customer: customer._id,
        artist: artist._id,
        category: category._id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        totalAmount: booking.totalAmount,
        status: booking.status,
        specialRequests: booking.specialRequests,
        location: booking.location,
        paymentStatus: booking.paymentStatus,
      });

      bookingMap.set(booking.reference, createdBooking);
      console.log(`✓ Booking created: ${booking.reference}`);
    }

    // Seed payments
    const paymentMap = new Map();
    for (const payment of paymentsData) {
      const booking = bookingMap.get(payment.bookingRef);
      if (!booking) {
        console.warn(
          `⚠️  Booking not found for payment ${payment.reference}. Skipping.`
        );
        continue;
      }

      const existing = await Payment.findOne({ booking: booking._id });
      if (existing) {
        paymentMap.set(payment.reference, existing);
        console.log(`ℹ️  Payment exists, skipping: ${payment.reference}`);
        continue;
      }

      const createdPayment = await Payment.create({
        booking: booking._id,
        customer: booking.customer,
        artist: booking.artist,
        amount: payment.amount,
        currency: "USD",
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status,
        paymentDate: new Date(),
      });

      booking.payment = createdPayment._id;
      booking.paymentStatus = "paid";
      await booking.save();

      paymentMap.set(payment.reference, createdPayment);
      console.log(`✓ Payment created: ${payment.reference}`);
    }

    // Seed reviews
    for (const review of reviewsData) {
      const booking = bookingMap.get(review.bookingRef);
      if (!booking) {
        console.warn(
          `⚠️  Booking not found for review (ref: ${review.bookingRef}). Skipping.`
        );
        continue;
      }

      const existing = await Review.findOne({ booking: booking._id });
      if (existing) {
        console.log(
          `ℹ️  Review exists for booking ${review.bookingRef}, skipping.`
        );
        continue;
      }

      await Review.create({
        booking: booking._id,
        customer: booking.customer,
        artist: booking.artist,
        rating: review.rating,
        comment: review.comment,
        isVisible: true,
      });

      console.log(`✓ Review created for booking ${review.bookingRef}`);
    }

    // Seed notifications
    for (const notification of notificationsData) {
      let userDoc = null;
      if (notification.userModel === "Artist") {
        userDoc = artistMap.get(notification.userEmail);
      } else if (notification.userModel === "Customer") {
        userDoc = customerMap.get(notification.userEmail);
      } else if (notification.userModel === "Admin") {
        userDoc = admin;
      }

      if (!userDoc) {
        console.warn(
          `⚠️  User not found for notification "${notification.title}", skipping.`
        );
        continue;
      }

      let relatedId = null;
      if (notification.relatedModel === "Booking") {
        relatedId = bookingMap.get(notification.relatedRef)?._id ?? null;
      } else if (notification.relatedModel === "Review") {
        const booking = bookingMap.get(notification.relatedRef);
        if (booking) {
          const reviewDoc = await Review.findOne({ booking: booking._id });
          relatedId = reviewDoc?._id ?? null;
        }
      } else if (notification.relatedModel === "Payment") {
        relatedId = paymentMap.get(notification.relatedRef)?._id ?? null;
      }

      const existing = await Notification.findOne({
        user: userDoc._id,
        title: notification.title,
        type: notification.type,
      });

      if (existing) {
        console.log(`ℹ️  Notification exists, skipping: ${notification.title}`);
        continue;
      }

      await Notification.create({
        user: userDoc._id,
        userModel: notification.userModel,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId,
        relatedModel: notification.relatedModel ?? null,
      });

      console.log(`✓ Notification created: ${notification.title}`);
    }

    console.log("\n✅ Platform seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during platform seeding:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

seedDatabase();

export default seedDatabase;

