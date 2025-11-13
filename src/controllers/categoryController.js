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
 * Get all categories with pagination
 * @route GET /api/categories
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 10 } = req.query;

  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const categories = await Category.find(query)
    .skip(skip)
    .limit(limitNum)
    .sort({ name: 1 });

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
  const { name, description, image } = req.body;

  if (!name) {
    throw new BadRequestError("Please provide a category name");
  }

  const category = await Category.create({
    name,
    description,
    image,
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
  const { name, description, image, isActive } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (image !== undefined) updateData.image = image;
  if (isActive !== undefined) updateData.isActive = isActive;

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
 * Get artists by category with pagination
 * @route GET /api/categories/:categoryId/artists
 */
export const getArtistsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { search, minRating, maxRate, page = 1, limit = 10 } = req.query;

  const query = {
    category: categoryId,
    isApproved: true,
    isActive: true,
  };

  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) };
  }

  if (maxRate) {
    query.hourlyRate = { $lte: parseFloat(maxRate) };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { bio: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const artists = await Artist.find(query)
    .select("-password")
    .populate("category", "name description image")
    .skip(skip)
    .limit(limitNum)
    .sort({ rating: -1, createdAt: -1 });

  const total = await Artist.countDocuments(query);

  const response = formatPaginationResponse(artists, total, page, limit);

  res.json({
    success: true,
    data: response.data,
    pagination: response.pagination,
  });
});

