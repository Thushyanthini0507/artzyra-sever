import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes
import customerRoute from "./routes/customerRoutes.js";
import artistRoute from "./routes/artistRoutes.js";
import bookingRoute from "./routes/bookingRoutes.js";
import userRoute from "./routes/authRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import ServiceRouter from "./routes/serviceRoutes.js";

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Artzyra API",
    version: "1.0.0",
  });
});

// API routes
app.use("/api/customers", customerRoute);
app.use("/api/artists", artistRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/users", userRoute);
app.use("/api/payments", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/services", ServiceRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
