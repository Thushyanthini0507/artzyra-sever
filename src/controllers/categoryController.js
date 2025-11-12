import Category from "../models/Category.js";
import Artist from "../models/Artist.js";
import { buildSearchQuery, paginate } from "../utils/helpers.js";

// Get all categories
const getAllCategories = async (req, res, next) => {
  try {
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

    const { skip, limit: limitNum } = paginate(page, limit);
    const categories = await Category.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ name: 1 });

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        categories,
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

// Get category by ID
const getCategoryById = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create category (Admin only)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Please provide a category name",
      });
    }

    const category = await Category.create({
      name,
      description,
      image,
    });

    res.status(201).json({
      success: true,
      data: {
        category,
      },
      message: "Category created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update category (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, description, image, isActive } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
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
      data: {
        category: updatedCategory,
      },
      message: "Category updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category is used by any artists
    const artistsCount = await Artist.countDocuments({ category: categoryId });
    if (artistsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${artistsCount} artist(s).`,
      });
    }

    await Category.findByIdAndDelete(categoryId);

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get artists by category
const getArtistsByCategory = async (req, res, next) => {
  try {
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

    const { skip, limit: limitNum } = paginate(page, limit);
    const artists = await Artist.find(query)
      .select("-password")
      .populate("category", "name")
      .skip(skip)
      .limit(limitNum)
      .sort({ rating: -1, createdAt: -1 });

    const total = await Artist.countDocuments(query);

    res.json({
      success: true,
      data: {
        artists,
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

export {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getArtistsByCategory,
};
