/**
 * Artist Public Controller
 * Provides read-only access to approved artist data
 */
import mongoose from "mongoose";
import Artist from "../models/Artist.js";
import User from "../models/User.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";

/**
 * Get approved artists with search and filtering
 * @route GET /api/artists
 * @access Public
 * Query params: category, search, page, limit
 * 
 * EXPLANATION:
 * - category: Filter by category ID
 * - search: Searches in name, bio, and skills fields (case-insensitive)
 * - page, limit: Pagination parameters
 * - Returns only approved and active artists
 */
export const getArtists = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;

  // Base query - only approved artists (status="approved")
  const query = { status: "approved" };

  // CATEGORY FILTER
  // Filter artists by specific category
  // Example: ?category=69159852bcea8d9de167502f
  // Validates that category ID is a valid MongoDB ObjectId
  if (category) {
    // Validate MongoDB ObjectId format (24 hex characters)
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw new BadRequestError("Invalid category id");
    }
    query.category = category;
  }

  // SEARCH FILTER
  // Searches across multiple fields using $or operator
  // - bio: Artist biography
  // - skills: Skills array (uses $in with RegExp for array search)
  // Note: name is in User model, we'll search by email or populate user data
  // Example: ?search=photography
  // Will match artists with "photography" in bio or skills
  if (search) {
    const regex = new RegExp(search, "i"); // Case-insensitive regex
    query.$or = [
      { bio: regex },
      { skills: { $in: [new RegExp(search, "i")] } }, // Searches in skills array
    ];
  }

  // PAGINATION CALCULATION
  // Ensure page is at least 1, limit is between 1-100
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  // EXECUTE QUERY
  // Use Promise.all to run query and count in parallel for better performance
  const [artists, total] = await Promise.all([
    Artist.find(query)
      .populate("userId", "email")
      .populate("category", "name description image type")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }), // Sort by newest first
    Artist.countDocuments(query), // Get total count for pagination
  ]);

  // Sync artistType with category type for all artists (batch update if needed)
  // This ensures consistency when categories are updated
  for (const artist of artists) {
    if (artist.category && artist.category.type && artist.artistType !== artist.category.type) {
      artist.artistType = artist.category.type;
      await artist.save();
    }
  }

  // Format response with user email
  const formattedArtists = artists.map((artist) => {
    const artistObj = artist.toObject();
    return {
      ...artistObj,
      email: artistObj.userId?.email || "",
      userId: artistObj.userId?._id || artistObj.userId,
    };
  });

  // RESPONSE
  res.json({
    success: true,
    message: "Artists retrieved successfully",
    data: formattedArtists,
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
    status: "approved",
  })
    .populate("userId", "email")
    .populate("category", "name description image type");

  if (!artist) {
    throw new NotFoundError("Artist");
  }

  // Sync artistType with category type if they don't match
  if (artist.category && artist.category.type && artist.artistType !== artist.category.type) {
    artist.artistType = artist.category.type;
    await artist.save();
  }

  // Format response with user email
  const artistObj = artist.toObject();
  const formattedArtist = {
    ...artistObj,
    email: artistObj.userId?.email || "",
    userId: artistObj.userId?._id || artistObj.userId,
  };

  res.json({
    success: true,
    message: "Artist retrieved successfully",
    data: formattedArtist,
  });
});
