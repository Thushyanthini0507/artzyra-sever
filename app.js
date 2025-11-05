import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
// Import routes

// Customer routes
import customerRoute from "./routes/customerRoutes.js";
import artistRoute from "./routes/artistRoutes.js";
import bookingRoute from "./routes/bookingRoutes.js";
import userRoute from "./routes/authRoutes.js";
import reviewRoute from "./models/review.js";
// import PaymentRouter from "./routes/paymentRoutes .js";

// Initialized express
const app = express();

// Middleware added
app.use(express.json());
app.use(cors());

// Test if the server is working or not.
app.get("/", (req, res) => {
  res.send("Welcome to Mini pos API");
});

// Mongo DB connected
connectDB();

app.use("/api/customers", customerRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/artists", artistRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/users", userRoute);
// app.use("/api/payment",PaymentRouter)

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running in http://localhost:${PORT}`);
});
