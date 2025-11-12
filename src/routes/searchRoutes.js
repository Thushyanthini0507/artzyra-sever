import express from "express";
const router = express.Router();
import Artist from "../models/Artist.js";
import Category from "../models/Category.js";
import { paginate, buildSearchQuery } from "../utils/helpers.js";

// Search artists
router.get("/artists", async (req, res, next) => {
  try {
    const {
      search,
      category,
      minRating,
      maxRate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      isApproved: true,
      isActive: true,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate) };
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
});

// Search categories
router.get("/categories", async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };

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
});

export default router;
