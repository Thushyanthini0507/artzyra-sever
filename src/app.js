import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { ensureDBConnection } from "./middleware/dbMiddleware.js";
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
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

// CORS configuration - supports both localhost and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://artzyra-client.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Cookie parser middleware (must be before routes)
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRateLimiter);
app.use("/api", ensureDBConnection);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API routes are working",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/artists", artistPublicRoutes);
app.use("/api/artists", artistsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/upload", uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

connectDB();

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("Backend restarted with CORRECT configuration (Cloud Name: dvmqpz0fp)");
  });
}

export default app;
