/**
 * Artist Public Controller
 * Provides read-only access to approved artist data
 */
import mongoose from "mongoose";
import Artist from "../models/Artist.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";

/**
 * Get approved artists with optional filters
 * @route GET /api/artists
 * @access Public
 */
export const getArtists = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;

  const query = { isApproved: true, isActive: true };

  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw new BadRequestError("Invalid category id");
    }
    query.category = category;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { bio: regex }, { skills: regex }];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [artists, total] = await Promise.all([
    Artist.find(query)
      .select("-password")
      .populate("category", "name description")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Artist.countDocuments(query),
  ]);

  res.json({
    success: true,
    message: "Artists retrieved successfully",
    data: artists,
    pagination: {
      currentPage: pageNum,
      limit: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: skip + artists.length < total,
      hasPrevPage: pageNum > 1,
    },
  });
});

/**
 * Get approved artist by ID
 * @route GET /api/artists/:id
 * @access Public
 */
export const getArtistById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new BadRequestError("Invalid artist id");
  }

  const artist = await Artist.findOne({
    _id: id,
    isApproved: true,
    isActive: true,
  })
    .select("-password")
    .populate("category", "name description");

  if (!artist) {
    throw new NotFoundError("Artist");
  }

  res.json({
    success: true,
    message: "Artist retrieved successfully",
    data: artist,
  });
});
