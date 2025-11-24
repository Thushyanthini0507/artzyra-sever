/**
 * Main Application File
 * Express.js server setup with all routes and middleware
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";

// Import routes (Entity-based architecture)
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import artistsRoutes from "./routes/artistsRoutes.js";
import artistPublicRoutes from "./routes/artistPublicRoutes.js";
import customersRoutes from "./routes/customersRoutes.js";
import bookingsRoutes from "./routes/bookingRoutes.js";
import categoriesRoutes from "./routes/catergoryRoutes.js";
import paymentsRoutes from "./routes/paymentRoutes.js";
import reviewsRoutes from "./routes/reviewRoutes.js";
import notificationsRoutes from "./routes/notificationRoutes.js";

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRateLimiter);

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (Entity-based architecture)
app.use("/api/auth", authRoutes); // Authentication: register, login, me, logout
app.use("/api/admin", adminRoutes); // Admin operations
app.use("/api/artists", artistPublicRoutes); // Public artist browsing (no auth required)
app.use("/api/artists", artistsRoutes); // Artist profile, bookings, reviews, admin approval
app.use("/api/customers", customersRoutes); // Customer profile, bookings, reviews
app.use("/api/bookings", bookingsRoutes); // Booking management
app.use("/api/categories", categoriesRoutes); // Category management
app.use("/api/payments", paymentsRoutes); // Payment processing
app.use("/api/reviews", reviewsRoutes); // Review management
app.use("/api/notifications", notificationsRoutes); // Notification management

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
