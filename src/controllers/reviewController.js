import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Artist from "../models/Artist.js";
import { createNotification } from "../utils/helpers.js";
import Notification from "../models/Notification.js";

// Create review
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Please provide bookingId and rating",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if booking exists and belongs to customer
    const booking = await Booking.findById(bookingId)
      .populate("customer")
      .populate("artist");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.customer._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own bookings",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "You can only review completed bookings",
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this booking",
      });
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      customer: req.userId,
      artist: booking.artist._id,
      rating,
      comment,
    });

    // Update artist rating
    const artist = await Artist.findById(booking.artist._id);
    const totalReviews = await Review.countDocuments({ artist: artist._id });
    const avgRating = await Review.aggregate([
      { $match: { artist: artist._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    artist.rating = avgRating[0]?.avgRating || rating;
    artist.totalReviews = totalReviews;
    await artist.save();

    const populatedReview = await Review.findById(review._id)
      .populate("customer", "name profileImage")
      .populate("booking", "bookingDate");

    // Create notification for artist
    await createNotification(
      Notification,
      booking.artist._id,
      "Artist",
      "review_received",
      "New Review Received",
      `You received a ${rating}-star review from ${req.user.name}`,
      review._id,
      "Review"
    );

    res.status(201).json({
      success: true,
      data: {
        review: populatedReview,
      },
      message: "Review created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by artist
const getReviewsByArtist = async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find({ artist: artistId, isVisible: true })
      .populate("customer", "name profileImage")
      .populate("booking", "bookingDate")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({
      artist: artistId,
      isVisible: true,
    });

    res.json({
      success: true,
      data: {
        reviews,
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

// Get review by ID
const getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate("customer", "name profileImage")
      .populate("artist", "name profileImage")
      .populate("booking", "bookingDate startTime endTime");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update review
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.customer.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Update artist rating
    const artist = await Artist.findById(review.artist);
    const avgRating = await Review.aggregate([
      { $match: { artist: artist._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    artist.rating = avgRating[0]?.avgRating || artist.rating;
    await artist.save();

    res.json({
      success: true,
      data: {
        review,
      },
      message: "Review updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      review.customer.toString() !== req.userId.toString() &&
      req.userRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update artist rating
    const artist = await Artist.findById(review.artist);
    const totalReviews = await Review.countDocuments({ artist: artist._id });
    const avgRating = await Review.aggregate([
      { $match: { artist: artist._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    artist.rating = totalReviews > 0 ? avgRating[0]?.avgRating || 0 : 0;
    artist.totalReviews = totalReviews;
    await artist.save();

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  createReview,
  getReviewsByArtist,
  getReviewById,
  updateReview,
  deleteReview,
};
