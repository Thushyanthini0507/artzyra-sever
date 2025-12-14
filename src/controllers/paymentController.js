/**
 * Payment Controller
 * Handles payment processing, retrieval, and refunds
 */
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import Chat from "../models/Chat.js";
import {
  processPayment,
  refundPayment,
  verifyPayment,
} from "../utils/paymentService.js";
import { createNotification } from "../utils/helpers.js";
import Notification from "../models/Notification.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Create payment
 * @route POST /api/payments
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethod } = req.body;

  console.log("💳 Create Payment Request:", {
    bookingId,
    hasPaymentMethod: !!paymentMethod,
    paymentMethodType: typeof paymentMethod,
    body: req.body
  });

  if (!bookingId) {
    throw new BadRequestError(
      "Please provide bookingId"
    );
  }

  const booking = await Booking.findById(bookingId)
    .populate("customer", "name email")
    .populate("artist", "name email");

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Validate booking has required data
  if (!booking.totalAmount || booking.totalAmount <= 0) {
    console.error("Booking missing totalAmount:", {
      bookingId: booking._id,
      totalAmount: booking.totalAmount,
      service: booking.service,
    });
    throw new BadRequestError(
      "Booking does not have a valid total amount. Please ensure the booking is properly created."
    );
  }

  // Check authorization
  if (booking.customer._id.toString() !== req.userId.toString()) {
    throw new ForbiddenError(
      "You are not authorized to make payment for this booking"
    );
  }

  if (booking.paymentStatus === "paid") {
    throw new BadRequestError(
      "Payment already completed for this booking"
    );
  }

  console.log("Creating payment for booking:", {
    bookingId: booking._id,
    customerId: booking.customer._id,
    artistId: booking.artist._id,
    amount: booking.totalAmount,
  });

  // Process payment
  const paymentResult = await processPayment({
    bookingId: booking._id,
    customerId: booking.customer._id,
    artistId: booking.artist._id,
    amount: booking.totalAmount,
    currency: "USD",
    paymentMethodId: paymentMethod,
  });

  if (!paymentResult.success) {
    console.error("Payment processing failed:", paymentResult);
    throw new BadRequestError(
      `Payment processing failed: ${paymentResult.error}${paymentResult.errorCode ? ' (Code: ' + paymentResult.errorCode + ')' : ''}`
    );
  }

  // If no paymentMethod was provided, just return clientSecret for Payment Element
  // The actual payment confirmation will happen via verifyPaymentIntent endpoint
  // We check for null, undefined, or empty string
  if (!paymentMethod || paymentMethod === "") {
    console.log("No payment method provided, returning client secret only");
    return res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.transactionId,
      },
    });
  }

  // If paymentMethod was provided, create payment record and complete the booking
  const payment = await Payment.create({
    booking: bookingId,
    customer: booking.customer._id,
    artist: booking.artist._id,
    amount: booking.totalAmount,
    currency: "USD",
    paymentMethod,
    stripePaymentIntentId: paymentResult.transactionId,
    status: paymentResult.status === "succeeded" ? "succeeded" : "pending",
    paymentDate: new Date(),
  });

  // Update booking status to in_progress (auto-confirmed when payment succeeds)
  // No manual approval needed - payment confirmation = booking confirmation
  booking.status = "in_progress";
  booking.paymentStatus =
    paymentResult.status === "succeeded" ? "paid" : "pending";
  booking.payment = payment._id;

  // Create or Find Chat - Enable chat access after payment confirmation
  let chat = await Chat.findOne({
    booking: booking._id,
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [booking.customer._id, booking.artist._id],
      booking: booking._id,
      messages: [],
      lastMessage: "Booking confirmed! You can now chat.",
      lastMessageTimestamp: new Date(),
    });
  }
  
  // Link chat to booking
  booking.chatRoomId = chat._id;
  await booking.save();

  // Send Notifications to both parties
  // Notify Customer: Booking confirmed
  await createNotification(
    Notification,
    booking.customer._id,
    "Customer",
    "booking_confirmed",
    "Booking Confirmed",
    `Your booking with ${booking.artist.name} has been confirmed! Payment successful. You can now chat with the artist.`,
    booking._id,
    "Booking"
  );

  // Notify Artist: New booking received
  await createNotification(
    Notification,
    booking.artist._id,
    "Artist",
    "booking_confirmed",
    "New Booking Received",
    `You have a new confirmed booking from ${booking.customer.name}. Payment received: $${booking.totalAmount}. Chat is now available.`,
    booking._id,
    "Booking"
  );
  
  // Also notify artist about payment
  await createNotification(
    Notification,
    booking.artist._id,
    "Artist",
    "payment_received",
    "Payment Received",
    `Payment of $${booking.totalAmount} received for booking with ${booking.customer.name}`,
    payment._id,
    "Payment"
  );

  const populatedPayment = await Payment.findById(payment._id)
    .populate("booking", "bookingDate startTime endTime")
    .populate("customer", "name email")
    .populate("artist", "name email");

  res.status(201).json({
    success: true,
    message: "Payment processed successfully",
    data: {
      payment: populatedPayment,
      clientSecret: paymentResult.clientSecret,
    },
  });
});

/**
 * Get payment by ID
 * @route GET /api/payments/:paymentId
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate("booking", "bookingDate startTime endTime totalAmount")
    .populate("customer", "name email phone")
    .populate("artist", "name email");

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Check authorization
  const isAuthorized =
    payment.customer._id.toString() === req.userId.toString() ||
    payment.artist._id.toString() === req.userId.toString() ||
    req.userRole === "admin";

  if (!isAuthorized) {
    throw new ForbiddenError(
      "You are not authorized to view this payment"
    );
  }

  res.json({
    success: true,
    data: {
      payment,
    },
  });
});

/**
 * Get payments with search and filtering
 * @route GET /api/payments
 * Query params: search, status, paymentMethod, customer, artist, booking, startDate, endDate, minAmount, maxAmount, page, limit, sortBy, sortOrder
 * 
 * EXPLANATION:
 * - Role-based: Customers/artists see only their payments, admins see all
 * - search: Searches in transactionId field
 * - status: Payment status (pending, succeeded, failed, refunded)
 * - paymentMethod: Filter by payment method
 * - customer/artist: Admin can filter by specific users
 * - booking: Filter by booking ID
 * - startDate/endDate: Date range filter for paymentDate
 * - minAmount/maxAmount: Amount range filter
 */
export const getPayments = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    paymentMethod,
    customer,
    artist,
    booking,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // ROLE-BASED FILTERING (Security)
  // Customers can only see their own payments
  // Artists can only see payments for their services
  // Admins can see all payments
  if (req.userRole === "customer") {
    query.customer = req.userId;
  } else if (req.userRole === "artist") {
    query.artist = req.userId;
  } else if (req.userRole !== "admin") {
    throw new ForbiddenError("Unauthorized");
  }

  // ADMIN-SPECIFIC FILTERS
  // Only admins can filter by customer/artist
  if (req.userRole === "admin") {
    if (customer) {
      query.customer = customer;
    }
    if (artist) {
      query.artist = artist;
    }
  }

  // STATUS AND METHOD FILTERS
  if (status) {
    query.status = status;
  }
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }
  if (booking) {
    query.booking = booking;
  }

  // DATE RANGE FILTER
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) {
      query.paymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.paymentDate.$lte = new Date(endDate);
    }
  }

  // AMOUNT RANGE FILTER
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) {
      query.amount.$gte = parseFloat(minAmount);
    }
    if (maxAmount) {
      query.amount.$lte = parseFloat(maxAmount);
    }
  }

  // SEARCH FILTER
  // Searches in stripePaymentIntentId field
  if (search) {
    query.stripePaymentIntentId = { $regex: search, $options: "i" };
  }

  // PAGINATION AND SORTING
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const payments = await Payment.find(query)
    .populate("booking", "bookingDate startTime endTime totalAmount")
    .populate("customer", "name email")
    .populate("artist", "name email")
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  const total = await Payment.countDocuments(query);

  const response = formatPaginationResponse(payments, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Refund payment (Admin only)
 * @route POST /api/payments/:paymentId/refund
 */
export const refundPaymentRequest = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount } = req.body;

  const payment = await Payment.findById(paymentId)
    .populate("booking")
    .populate("customer", "name email")
    .populate("artist", "name email");

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Only admin can process refunds
  if (req.userRole !== "admin") {
    throw new ForbiddenError("Only admins can process refunds");
  }

  if (payment.status !== "succeeded") {
    throw new BadRequestError("Only succeeded payments can be refunded");
  }

  const refundAmount = amount || payment.amount;
  const refundResult = await refundPayment(
    payment.stripePaymentIntentId,
    refundAmount
  );

  if (!refundResult.success) {
    throw new BadRequestError(
      `Refund processing failed: ${refundResult.error}`
    );
  }

  payment.status = "refunded";
  await payment.save();

  // Update booking payment status
  if (payment.booking) {
    payment.booking.paymentStatus = "refunded";
    await payment.booking.save();
  }

  // Create notification
  await createNotification(
    Notification,
    payment.customer._id,
    "Customer",
    "system",
    "Payment Refunded",
    `Your payment of $${refundAmount} has been refunded.`,
    payment._id,
    "Payment"
  );

  res.json({
    success: true,
    message: "Refund processed successfully",
    data: {
      payment,
      refund: refundResult,
    },
  });
});

/**
 * Verify payment intent and confirm booking
 * @route POST /api/payments/verify
 */
export const verifyPaymentIntent = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  console.log("🔍 Payment Verification Request:", {
    paymentIntentId,
    userId: req.userId,
    userRole: req.userRole,
    hasAuth: !!req.user,
  });

  if (!paymentIntentId) {
    console.error("Missing payment intent ID in request body");
    throw new BadRequestError("Payment Intent ID is required");
  }

  // 1. Verify with Stripe
  console.log("📡 Calling Stripe to verify payment intent...");
  const verification = await verifyPayment(paymentIntentId);

  if (!verification.success) {
    console.error("Stripe verification failed:", verification.error);
    throw new BadRequestError(`Payment verification failed: ${verification.error}`);
  }

  const paymentIntent = verification.data;
  console.log("Stripe verification successful:", {
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    hasMetadata: !!paymentIntent.metadata,
    bookingIdInMetadata: paymentIntent.metadata?.bookingId,
  });

  if (paymentIntent.status !== "succeeded") {
    return res.json({
      success: false,
      message: `Payment status is ${paymentIntent.status}`,
      status: paymentIntent.status,
    });
  }

  // 2. Find Booking from metadata or local Payment record
  let bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    console.warn("Booking ID missing in payment metadata. Attempting fallback lookup...");
    
    // Fallback: Try to find payment record by stripePaymentIntentId
    const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    
    if (existingPayment && existingPayment.booking) {
      bookingId = existingPayment.booking;
      console.log("Found booking ID from local payment record:", bookingId);
    } else {
      console.error("Could not find booking ID for payment intent:", paymentIntentId);
      throw new BadRequestError("Booking ID missing in payment metadata and could not be recovered");
    }
  }

  const booking = await Booking.findById(bookingId)
    .populate("customer", "name email")
    .populate("artist", "name email");

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Check authorization
  if (booking.customer._id.toString() !== req.userId.toString() && req.userRole !== "admin") {
    throw new ForbiddenError("Not authorized to verify this payment");
  }

  // 3. Check if already paid
  if (booking.paymentStatus === "paid") {
    return res.json({
      success: true,
      message: "Booking already confirmed",
      data: { booking },
    });
  }

  // 4. Create Payment Record if not exists
  let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

  if (!payment) {
    console.log("💾 Creating new payment record...");
    try {
      payment = await Payment.create({
        booking: booking._id,
        customer: booking.customer._id,
        artist: booking.artist._id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method_types[0],
        stripePaymentIntentId: paymentIntentId,
        status: "succeeded",
        paymentDate: new Date(),
      });
      console.log("Payment record created:", payment._id);
    } catch (error) {
      console.error("Error creating payment record:", error);
      throw error;
    }
  } else {
    console.log("🔄 Updating existing payment record:", payment._id);
    payment.status = "succeeded";
    await payment.save();
  }

  // 5. Update Booking - Auto-confirm booking when payment succeeds
  // No manual approval needed - payment confirmation = booking confirmation
  booking.status = "in_progress";
  booking.paymentStatus = "paid";
  booking.payment = payment._id;

  // 6. Create Chat - Enable chat access after payment confirmation
  let chat = await Chat.findOne({ booking: booking._id });
  if (!chat) {
    chat = await Chat.create({
      participants: [booking.customer._id, booking.artist._id],
      booking: booking._id,
      messages: [],
      lastMessage: "Booking confirmed! You can now chat.",
      lastMessageTimestamp: new Date(),
    });
  }
  
  // Link chat to booking
  booking.chatRoomId = chat._id;
  await booking.save();

  // 7. Send Notifications to both parties
  // Notify Customer: Booking confirmed
  await createNotification(
    Notification,
    booking.customer._id,
    "Customer",
    "booking_confirmed",
    "Booking Confirmed",
    `Your booking with ${booking.artist.name} has been confirmed! Payment successful. You can now chat with the artist.`,
    booking._id,
    "Booking"
  );

  // Notify Artist: New booking received
  await createNotification(
    Notification,
    booking.artist._id,
    "Artist",
    "booking_confirmed",
    "New Booking Received",
    `You have a new confirmed booking from ${booking.customer.name}. Payment received: $${booking.totalAmount}. Chat is now available.`,
    booking._id,
    "Booking"
  );
  
  // Also notify artist about payment
  await createNotification(
    Notification,
    booking.artist._id,
    "Artist",
    "payment_received",
    "Payment Received",
    `Payment of $${booking.totalAmount} received for booking with ${booking.customer.name}`,
    payment._id,
    "Payment"
  );

  res.json({
    success: true,
    message: "Payment verified and booking confirmed",
    data: {
      booking,
      payment,
      chatId: chat._id,
    },
  });
});
