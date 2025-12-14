/**
 * Category Controller
 * Handles category CRUD operations and artist filtering by category
 */
import Category from "../models/Category.js";
import Artist from "../models/Artist.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

/**
 * Get all categories with search and filtering
 * @route GET /api/categories
 * Query params: search, isActive, page, limit
 * 
 * EXPLANATION:
 * - search: Searches in name and description fields (case-insensitive)
 * - isActive: Filter by active status (true/false)
 * - page, limit: Pagination parameters
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 10 } = req.query;

  const query = {};

  // ACTIVE STATUS FILTER
  // Filter by whether category is active
  // Example: ?isActive=true
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  // SEARCH FILTER
  // Searches in category name and description
  // Uses $or to match either field
  // Example: ?search=photography
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // PAGINATION
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const categories = await Category.find(query)
    .skip(skip)
    .limit(limitNum)
    .sort({ name: 1 }); // Sort alphabetically by name

  const total = await Category.countDocuments(query);

  const response = formatPaginationResponse(categories, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

/**
 * Get category by ID
 * @route GET /api/categories/:categoryId
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  res.json({
    success: true,
    data: {
      category,
    },
  });
});

/**
 * Create category (Admin only)
 * @route POST /api/categories
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, type } = req.body;

  if (!name) {
    throw new BadRequestError("Please provide a category name");
  }

  if (!type || !["physical", "remote"].includes(type)) {
    throw new BadRequestError("Please provide a valid category type (physical or remote)");
  }

  const category = await Category.create({
    name,
    description,
    image,
    type,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: {
      category,
    },
  });
});
/**
 * Update category (Admin only)
 * @route PUT /api/categories/:categoryId
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name, description, image, isActive, type } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const updateData = {};
  if (name !== undefined && name !== null && name.trim() !== "") updateData.name = name.trim();
  if (description !== undefined) updateData.description = description;
  if (image !== undefined) updateData.image = image;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (type !== undefined && type !== null && ["physical", "remote"].includes(type)) updateData.type = type;

  // Check if there are any fields to update
  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("No valid fields provided for update");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Category updated successfully",
    data: {
      category: updatedCategory,
    },
  });
});

/**
 * Delete category (Admin only)
 * @route DELETE /api/categories/:categoryId
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  // Check if category is used by any artists
  const artistsCount = await Artist.countDocuments({ category: categoryId });
  if (artistsCount > 0) {
    throw new BadRequestError(
      `Cannot delete category. It is used by ${artistsCount} artist(s).`
    );
  }

  await Category.findByIdAndDelete(categoryId);

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
});

/**
 * Get artists by category with search and filtering
 * @route GET /api/categories/:categoryId/artists
 * Query params: search, minRating, maxRate, page, limit
 * 
 * EXPLANATION:
 * - search: Searches in name, bio, and skills fields
 * - minRating: Minimum rating filter (0-5)
 * - maxRate: Maximum hourly rate filter
 * - Returns only approved and active artists in the category
 */
export const getArtistsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { search, minRating, maxRate, page = 1, limit = 10 } = req.query;

  // Base query - only approved artists in this category
  // For physical artists, they must also have an active subscription
  // For remote artists, subscription status is 'active' by default (or ignored)
  const query = {
    category: categoryId,
    status: "approved",
    "subscription.status": "active",
  };

  // RATING FILTER
  // Filter artists by minimum rating
  // Example: ?minRating=4 (only 4+ star artists)
  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) };
  }

  // PRICE FILTER
  // Filter artists by maximum hourly rate
  // Example: ?maxRate=100 (artists charging $100/hour or less)
  if (maxRate) {
    query.hourlyRate = { $lte: parseFloat(maxRate) };
  }

  // SEARCH FILTER
  // Searches in bio and skills array
  // Note: name is in User model, not Artist model
  // Example: ?search=photography
  if (search) {
    query.$or = [
      { bio: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // PAGINATION
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const artists = await Artist.find(query)
    .populate("userId", "email")
    .populate("category", "name description image")
    .skip(skip)
    .limit(limitNum)
    .sort({ rating: -1, createdAt: -1 }); // Sort by rating first, then creation date

  const total = await Artist.countDocuments(query);

  // Format response with user email
  const formattedArtists = artists.map((artist) => {
    const artistObj = artist.toObject();
    return {
      ...artistObj,
      email: artistObj.userId?.email || "",
      userId: artistObj.userId?._id || artistObj.userId,
    };
  });

  const response = formatPaginationResponse(formattedArtists, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

