import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import {
  processPayment,
  refundPayment,
  verifyPayment,
} from "../utils/paymentService.js";
import { createNotification } from "../utils/helpers.js";
import Notification from "../models/Notification.js";

// Create payment
const createPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please provide bookingId and paymentMethod",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("customer")
      .populate("artist");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    if (booking.customer._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to make payment for this booking",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this booking",
      });
    }

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
      return res.status(400).json({
        success: false,
        message: "Payment processing failed",
        error: paymentResult.error,
      });
    }

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      customer: booking.customer._id,
      artist: booking.artist._id,
      amount: booking.totalAmount,
      currency: "USD",
      paymentMethod,
      transactionId: paymentResult.transactionId,
      status: paymentResult.status === "completed" ? "completed" : "pending",
      paymentDate: new Date(),
    });

    // Update booking payment status
    booking.paymentStatus =
      paymentResult.status === "completed" ? "paid" : "pending";
    booking.payment = payment._id;
    await booking.save();

    // Create notification for artist
    await createNotification(
      Notification,
      booking.artist._id,
      "Artist",
      "payment_received",
      "Payment Received",
      `Payment received for booking. Amount: $${booking.totalAmount}`,
      payment._id,
      "Payment"
    );

    res.status(201).json({
      success: true,
      data: {
        payment,
      },
      message: "Payment processed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("booking")
      .populate("customer", "name email")
      .populate("artist", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check authorization
    const isAuthorized =
      payment.customer._id.toString() === req.userId.toString() ||
      payment.artist._id.toString() === req.userId.toString() ||
      req.userRole === "admin";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment",
      });
    }

    res.json({
      success: true,
      data: {
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get payments by user
const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (req.userRole === "customer") {
      query.customer = req.userId;
    } else if (req.userRole === "artist") {
      query.artist = req.userId;
    } else if (req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(query)
      .populate("booking", "bookingDate startTime endTime")
      .populate("customer", "name email")
      .populate("artist", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refund payment
const refundPaymentRequest = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate("booking")
      .populate("customer")
      .populate("artist");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Only admin can process refunds
    if (req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can process refunds",
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded",
      });
    }

    const refundAmount = amount || payment.amount;
    const refundResult = await refundPayment(
      payment.transactionId,
      refundAmount
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: "Refund processing failed",
        error: refundResult.error,
      });
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
      data: {
        payment,
        refund: refundResult,
      },
      message: "Refund processed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { createPayment, getPaymentById, getPayments, refundPaymentRequest };
